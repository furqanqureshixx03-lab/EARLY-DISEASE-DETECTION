"""
utils.py — Image preprocessing utilities for TerraLeaf.

All image I/O and tensor preparation logic lives here so that predictor.py
remains focused on inference, and so preprocessing can be tested independently.
"""

from __future__ import annotations

import io
import logging
from pathlib import Path

import numpy as np
from PIL import Image, UnidentifiedImageError

from app.config import ALLOWED_CONTENT_TYPES, ALLOWED_EXTENSIONS, IMAGE_SIZE, MAX_UPLOAD_SIZE_BYTES

logger = logging.getLogger(__name__)

# NumPy array type alias for readability.
ImageArray = np.ndarray


def validate_upload(
    filename: str,
    content_type: str,
    data: bytes,
) -> None:
    """
    Validate an uploaded file before preprocessing.

    Raises:
        ValueError: with a descriptive message if any validation check fails.
    """
    if not data:
        raise ValueError("The uploaded file is empty. Please upload a valid image.")

    if len(data) > MAX_UPLOAD_SIZE_BYTES:
        max_mb = MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)
        raise ValueError(
            f"File size exceeds the maximum allowed size of {max_mb} MB."
        )

    extension = Path(filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise ValueError(
            f"Unsupported file extension '{extension}'. "
            f"Allowed extensions: {allowed}."
        )

    # Normalise content-type (browsers sometimes send "image/jpg" instead of "image/jpeg").
    normalised_ct = content_type.split(";")[0].strip().lower()
    if normalised_ct not in ALLOWED_CONTENT_TYPES:
        allowed_cts = ", ".join(sorted(ALLOWED_CONTENT_TYPES))
        raise ValueError(
            f"Unsupported content type '{normalised_ct}'. "
            f"Allowed types: {allowed_cts}."
        )


def preprocess_image(data: bytes) -> ImageArray:
    """
    Convert raw image bytes into a normalised, batched NumPy array ready for inference.

    Pipeline:
        1. Open image with Pillow.
        2. Convert to RGB (handles RGBA, greyscale, palette modes, etc.).
        3. Resize to IMAGE_SIZE (224 × 224) using high-quality Lanczos resampling.
        4. Convert to a float32 NumPy array.
        5. Normalise pixel values to [0, 1] by dividing by 255.
        6. Expand batch dimension → shape (1, 224, 224, 3).

    Args:
        data: Raw bytes of the uploaded image file.

    Returns:
        NumPy array of shape (1, 224, 224, 3), dtype float32.

    Raises:
        ValueError: If Pillow cannot decode the image.
    """
    try:
        img: Image.Image = Image.open(io.BytesIO(data))
    except UnidentifiedImageError as exc:
        logger.warning("Failed to open image: %s", exc)
        raise ValueError(
            "The uploaded file could not be read as an image. "
            "It may be corrupted or not a valid image format."
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error while opening image.")
        raise ValueError(f"An unexpected error occurred while opening the image: {exc}") from exc

    # Ensure consistent 3-channel RGB input regardless of source format.
    img = img.convert("RGB")

    # Resize to the model's expected spatial dimensions.
    img = img.resize(IMAGE_SIZE, Image.Resampling.LANCZOS)

    # Convert to a NumPy float32 array and normalise.
    img_array: ImageArray = np.array(img, dtype=np.float32)
    img_array = img_array / 255.0

    # Add the batch dimension: (H, W, C) → (1, H, W, C).
    img_array = np.expand_dims(img_array, axis=0)

    logger.debug("Image preprocessed: shape=%s dtype=%s", img_array.shape, img_array.dtype)
    return img_array
