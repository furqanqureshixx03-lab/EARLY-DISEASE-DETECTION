# TerraLeaf Backend — AI Plant Disease Detection API

> **FastAPI · TensorFlow/Keras · Uvicorn**
> Production-ready REST API that accepts a leaf image and returns an AI diagnosis with treatment recommendations.

---

## Table of Contents

1. [Project Overview](#project-overview)  
2. [Folder Structure](#folder-structure)  
3. [Prerequisites](#prerequisites)  
4. [Installation](#installation)  
5. [Configuration](#configuration)  
6. [Running the Server](#running-the-server)  
7. [API Endpoints](#api-endpoints)  
8. [Swagger Documentation](#swagger-documentation)  
9. [Example Requests](#example-requests)  
10. [Deploying to Railway](#deploying-to-railway)  
11. [Deploying to Render](#deploying-to-render)  
12. [Extending the API](#extending-the-api)  

---

## Project Overview

TerraLeaf is an AI-powered plant disease detection platform. This backend:

- Accepts leaf images via a `POST /predict` endpoint.
- Preprocesses images (RGB → resize 224×224 → normalise) using Pillow and NumPy.
- Runs inference with a pre-trained Keras model loaded once at startup.
- Returns the predicted disease, confidence score, top-3 predictions, and structured treatment/prevention advice.

---

## Folder Structure

```
backend/
├── app/
│   ├── __init__.py        # Package marker
│   ├── main.py            # FastAPI app, CORS, lifespan, endpoints
│   ├── predictor.py       # Model loading & inference engine
│   ├── treatments.py      # Disease → treatment recommendation database
│   ├── schemas.py         # Pydantic request/response models
│   ├── utils.py           # Image preprocessing & upload validation
│   └── config.py          # Environment-variable-driven configuration
│
├── models/
│   ├── model.keras        # ← Place your trained Keras model here
│   └── class_indices.json # ← Place your class-index map here
│
├── requirements.txt
├── .env.example
├── .gitignore
├── railway.json
├── Procfile
└── README.md
```

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Python      | 3.10 or 3.11 (recommended) |
| pip         | ≥ 23 |

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/sudarshant04-droid/terraleaf-plant-health.git
cd terraleaf-plant-health/backend
```

### 2. Create and activate a virtual environment

**macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Add your model files

Copy your trained model artifacts into the `models/` directory:

```
backend/
└── models/
    ├── model.keras          ← Keras SavedModel
    └── class_indices.json   ← {"ClassName": 0, ...} or {"0": "ClassName", ...}
```

Both key-value orientations of `class_indices.json` are automatically detected.

---

## Configuration

Copy the example environment file and edit as needed:

```bash
cp .env.example .env
```

| Variable          | Default                                          | Description                                     |
|-------------------|--------------------------------------------------|-------------------------------------------------|
| `APP_NAME`        | `TerraLeaf API`                                  | API name shown in Swagger UI                    |
| `APP_ENV`         | `development`                                    | Runtime environment tag                         |
| `APP_VERSION`     | `1.0.0`                                          | API version string                              |
| `ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:5173`     | Comma-separated CORS allowed origins            |
| `MODEL_PATH`      | `models/model.keras`                             | Path to the Keras model (relative to `backend/`)|
| `CLASS_MAP_PATH`  | `models/class_indices.json`                      | Path to the class-index JSON file               |

---

## Running the Server

From the `backend/` directory with your virtual environment active:

**Option A (macOS/Linux):**
```bash
python3 -m uvicorn app.main:app --reload
```

**Option B (Windows / alternative):**
```bash
python -m uvicorn app.main:app --reload
```

**Production (no auto-reload):**
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at: **http://localhost:8000**

---

## API Endpoints

| Method | Path       | Description                              |
|--------|------------|------------------------------------------|
| GET    | `/`        | Welcome message                          |
| GET    | `/health`  | Health check — confirms model is loaded  |
| POST   | `/predict` | Upload leaf image, receive AI diagnosis  |
| GET    | `/docs`    | Swagger interactive documentation        |
| GET    | `/redoc`   | ReDoc API documentation                  |

### POST `/predict` — Request

- **Content-Type:** `multipart/form-data`
- **Field name:** `file`
- **Accepted formats:** JPG, JPEG, PNG
- **Max file size:** 10 MB

### POST `/predict` — Response

```json
{
  "success": true,
  "prediction": {
    "disease": "Tomato___Early_blight",
    "confidence": 97.83,
    "top_predictions": [
      { "name": "Tomato___Early_blight", "confidence": 97.83 },
      { "name": "Tomato___Late_blight",  "confidence": 1.50  },
      { "name": "Tomato___healthy",      "confidence": 0.67  }
    ]
  },
  "recommendation": {
    "severity": "Moderate",
    "symptoms": [
      "Brown circular lesions with concentric rings on older leaves",
      "Yellow chlorotic halo surrounding each lesion"
    ],
    "treatment": [
      "Apply copper fungicide or azoxystrobin at 7-day intervals",
      "Remove and destroy infected leaves promptly"
    ],
    "prevention": [
      "Rotate with non-solanaceous crops for 2–3 years",
      "Use drip irrigation; avoid overhead watering"
    ]
  }
}
```

---

## Swagger Documentation

Once the server is running, open your browser at:

- **Swagger UI** → http://localhost:8000/docs
- **ReDoc**       → http://localhost:8000/redoc

You can test the `/predict` endpoint directly from the Swagger UI by clicking  
**POST /predict → Try it out → Choose File → Execute**.

---

## Example Requests

### cURL — GET /health

```bash
curl -X GET http://localhost:8000/health
```

### cURL — POST /predict (upload image)

```bash
curl -X POST http://localhost:8000/predict \
  -F "file=@/path/to/leaf.jpg"
```

### cURL — POST /predict (verbose with headers)

```bash
curl -X POST http://localhost:8000/predict \
  -H "Accept: application/json" \
  -F "file=@/path/to/leaf.png" \
  -v
```

### Python — requests library

```python
import requests

url = "http://localhost:8000/predict"

with open("leaf.jpg", "rb") as f:
    response = requests.post(url, files={"file": ("leaf.jpg", f, "image/jpeg")})

print(response.json())
```

### JavaScript — fetch (from frontend)

```javascript
const formData = new FormData();
formData.append("file", imageFile);  // imageFile is a File object

const response = await fetch("http://localhost:8000/predict", {
  method: "POST",
  body: formData,
});

const result = await response.json();
console.log(result.prediction.disease);
console.log(result.recommendation.treatment);
```

---

## Deploying to Railway

1. **Install the Railway CLI:**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Initialise and link your project:**
   ```bash
   cd backend
   railway init
   ```

3. **Set environment variables in Railway Dashboard:**
   - `APP_ENV=production`
   - `ALLOWED_ORIGINS=https://your-frontend.vercel.app`
   - `MODEL_PATH=models/model.keras`
   - `CLASS_MAP_PATH=models/class_indices.json`

4. **Upload model files** via Railway Volume or build them into your Docker image.

5. **Deploy:**
   ```bash
   railway up
   ```

The `railway.json` in this repository configures:
- Builder: Nixpacks
- Start command: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check: `GET /health`
- Restart policy: on failure, max 5 retries

---

## Deploying to Render

1. Create a new **Web Service** on [render.com](https://render.com).

2. Connect your GitHub repository and select the `backend/` as the root directory.

3. Configure the service:
   - **Runtime:** Python 3
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. Add environment variables in Render Dashboard (same as Railway above).

5. Add a **Disk** to mount your model files:
   - Mount path: `/opt/render/project/src/models`
   - Upload `model.keras` and `class_indices.json` there.

6. Click **Deploy** — Render uses the `Procfile` in this repository automatically.

---

## Extending the API

The architecture is intentionally modular for easy future expansion:

| Feature | Where to add |
|---|---|
| New crop / disease treatment | `app/treatments.py` — add entry to `TREATMENT_DB` |
| New ML model (e.g., severity grader) | `app/predictor.py` — add a second model singleton |
| Weather API integration | New `app/weather.py` service + new endpoint in `main.py` |
| Terrace farming recommendations | New `app/terrace.py` + endpoint |
| User authentication (JWT) | Add `fastapi-users` or `python-jose` + auth router |
| Request rate limiting | Add `slowapi` middleware in `main.py` |
| Caching predictions | Add Redis via `aioredis` in a new `app/cache.py` |
| Database persistence | Add `SQLAlchemy` + `app/database.py` + models |

---

*Built with ❤️ for the TerraLeaf platform.*
