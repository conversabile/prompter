import os

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

FRONTEND_DIR: str = os.getenv("FRONTEND_DIR", "./frontend/build/")

# Place After All Other Routes
app.mount('', StaticFiles(directory=FRONTEND_DIR, html=True), name="static")
