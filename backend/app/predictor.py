"""
predictor.py — Model loading and inference engine for TerraLeaf.

The Keras model and class-index map are loaded exactly once at application
startup (via load_model_assets) and kept in a module-level singleton so that
every subsequent request hits already-warm memory with no I/O overhead.
"""

from __future__ import annotations

import json
import logging

import numpy as np

from app.config import CLASS_MAP_PATH, MODEL_PATH, TOP_K_PREDICTIONS
from app.schemas import PredictionItem, PredictionResult

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level singletons — populated once at startup.
# ---------------------------------------------------------------------------

_model = None  # keras.Model  (typed as Any to avoid TF import at module level)
_class_indices: dict[str, str] = {}  # {str(index): class_name}
_model_loaded: bool = False


# ---------------------------------------------------------------------------
# Startup / teardown helpers
# ---------------------------------------------------------------------------


def load_model_assets() -> None:
    """
    Load the Keras model and the class-index map into memory.

    Called once from the FastAPI lifespan context so both assets are ready
    before the first request arrives.  Any failure here is logged and
    re-raised so the application surfaces a clear startup error rather than
    silently serving broken predictions.

    Raises:
        FileNotFoundError: If either asset file does not exist on disk.
        RuntimeError: If TensorFlow cannot load the model file.
        json.JSONDecodeError: If class_indices.json is malformed.
    """
    global _model, _class_indices, _model_loaded

    # ── 1. Validate file existence before importing TF (faster fail path). ──
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model file not found: {MODEL_PATH}. "
            "Place your trained model at the path specified by MODEL_PATH."
        )
    if not CLASS_MAP_PATH.exists():
        raise FileNotFoundError(
            f"Class-index map not found: {CLASS_MAP_PATH}. "
            "Place class_indices.json at the path specified by CLASS_MAP_PATH."
        )

    logger.info("Loading class-index map from: %s", CLASS_MAP_PATH)
    with CLASS_MAP_PATH.open("r", encoding="utf-8") as fh:
        raw = json.load(fh)

    if not raw:
        raise ValueError(
            f"Class map file at {CLASS_MAP_PATH} is empty. "
            "It must contain at least one class mapping."
        )

    # Support JSON lists, and both {"ClassName": index} and {index: "ClassName"} formats.
    # We normalise to {str(index): "ClassName"} for O(1) lookup by index.
    if isinstance(raw, list):
        _class_indices = {str(i): v for i, v in enumerate(raw)}
    elif isinstance(raw, dict):
        first_key = next(iter(raw))
        if isinstance(raw[first_key], int):
            # Format: {"ClassName": 0, "OtherClass": 1, ...}
            _class_indices = {str(v): k for k, v in raw.items()}
        else:
            # Format: {"0": "ClassName", "1": "OtherClass", ...}
            _class_indices = {str(k): v for k, v in raw.items()}
    else:
        raise TypeError(
            f"Unsupported class map format in {CLASS_MAP_PATH}. "
            "Must be a JSON list or a JSON object/dictionary."
        )

    logger.info("Loaded %d classes.", len(_class_indices))

    # ── 3. Load Keras model. ─────────────────────────────────────────────────
    logger.info("Loading Keras model from: %s", MODEL_PATH)
    try:
        # Import TensorFlow here (not at module top-level) so the module can
        # be imported cheaply in tests that mock load_model_assets.
        import tensorflow as tf  # noqa: PLC0415

        _model = tf.keras.models.load_model(str(MODEL_PATH))
        try:
            input_shape = _model.input_shape
        except AttributeError:
            # Keras 3 / some SavedModel formats don't expose input_shape
            # until after the first forward pass — safe to skip logging it.
            input_shape = "(unavailable before first call)"
        logger.info("Model loaded successfully. Input shape: %s", input_shape)
    except Exception as exc:
        logger.exception("Failed to load Keras model.")
        raise RuntimeError(
            f"Could not load model from {MODEL_PATH}: {exc}"
        ) from exc

    _model_loaded = True
    logger.info("All model assets loaded and ready.")


def is_model_loaded() -> bool:
    """Return True if the model and class map are loaded and ready."""
    return _model_loaded


# ---------------------------------------------------------------------------
# Inference
# ---------------------------------------------------------------------------


def predict(image_array: np.ndarray) -> PredictionResult:
    """
    Run inference on a preprocessed image tensor.

    Args:
        image_array: Float32 array of shape (1, 224, 224, 3) with pixels
                     normalised to [0, 1].

    Returns:
        PredictionResult with the top-1 disease name, its confidence, and
        the top-K predictions sorted by confidence descending.

    Raises:
        RuntimeError: If the model has not been loaded yet.
        RuntimeError: If inference fails for any reason.
    """
    if not _model_loaded or _model is None:
        raise RuntimeError(
            "The model is not loaded. Ensure load_model_assets() was called at startup."
        )

    try:
        # Run inference — returns an ndarray of shape (1, num_classes).
        predictions: np.ndarray = _model.predict(image_array, verbose=0)
    except Exception as exc:
        logger.exception("Model inference failed.")
        raise RuntimeError(f"Prediction failed during model inference: {exc}") from exc

    # Flatten to 1-D probability vector.
    probabilities: np.ndarray = predictions[0]

    # Convert to percentage scores (0–100) rounded to 2 d.p.
    scores: np.ndarray = np.round(probabilities * 100.0, 2)

    # Argsort descending for top-K.
    top_k_indices = np.argsort(scores)[::-1][:TOP_K_PREDICTIONS]

    top_predictions: list[PredictionItem] = []
    for idx in top_k_indices:
        class_name: str = _class_indices.get(str(idx), f"Unknown_Class_{idx}")
        top_predictions.append(
            PredictionItem(name=class_name, confidence=float(scores[idx]))
        )

    best = top_predictions[0]
    logger.debug(
        "Prediction complete: disease=%s confidence=%.2f%%", best.name, best.confidence
    )

    return PredictionResult(
        disease=best.name,
        confidence=best.confidence,
        top_predictions=top_predictions,
    )
