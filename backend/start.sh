#!/bin/bash
set -e

mkdir -p model

MODEL_PATH="model/plant_model.keras"
FILE_ID="1A_OPsNycR6viMa7j6Xy1MFFdUeabjnwu"

if [ ! -f "$MODEL_PATH" ]; then
    echo "Downloading model from Google Drive..."

    wget --no-check-certificate \
    "https://drive.google.com/uc?export=download&id=${FILE_ID}" \
    -O "$MODEL_PATH"

    echo "Model download completed."
else
    echo "Model already exists."
fi

echo "Starting FastAPI..."

uvicorn app.main:app --host 0.0.0.0 --port $PORT