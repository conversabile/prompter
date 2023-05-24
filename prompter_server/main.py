import os

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .config import FRONTEND_DIR
from .routers import persistence

app = FastAPI()
app.include_router(persistence.router, prefix="/v1")

# Place After All Other Routes
app.mount('', StaticFiles(directory=FRONTEND_DIR, html=True), name="static")
