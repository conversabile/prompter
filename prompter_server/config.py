import os

FRONTEND_DIR: str = os.getenv("FRONTEND_DIR", "./frontend/build/")
PERSISTENCE_FILE_DIR: str = os.getenv("PERSISTENCE_FILE_DIR", "./.prompt_data")
