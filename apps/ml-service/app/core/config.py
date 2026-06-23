import os
from pathlib import Path

MODEL_DIR = Path(os.getenv("MODEL_DIR", "./models"))
DATA_DIR = Path(os.getenv("DATA_DIR", "./data"))

MODEL_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)
