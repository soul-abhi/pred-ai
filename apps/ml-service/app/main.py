from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI

from app.core.model_registry import registry
from app.routers import health, predict, train

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Try loading pre-existing model at startup
    loaded = registry.load()
    if not loaded:
        logger.info("No pre-trained model found — call POST /train to create one.")
    yield


app = FastAPI(
    title="PredAI ML Service",
    version="1.0.0",
    description="Internal ML inference service — not for direct browser access.",
    lifespan=lifespan,
)

app.include_router(health.router)
app.include_router(predict.router)
app.include_router(train.router)
