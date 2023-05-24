"""
Here we define the API endpoints to load and save prompts. Those are used by the frontend to generate and open permalinks.

Currently this is implemented with basic filesystem. Given a prompt id (e.g. `a_prompt`), these are the files involved:

* `$DATA_ROOT/a/a_prompt/prompt.json` (actual prompt definition)
* `$DATA_ROOT/a/a_prompt/edit_key.txt` (a random key that is used to validate updates)

`$DATA_ROOT` is `./.prompt_data` by default, and can be customized by defining a `PERSISTENCE_FILE_DIR` env.
"""
import os
import json
from logging import getLogger
from typing import Dict
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pydantic.tools import parse_obj_as

from ..config import PERSISTENCE_FILE_DIR

logger = getLogger(__name__)
router = APIRouter()

class Prompt(BaseModel):
    version: int
    prompt_text: str
    parameters_dict: Dict[str, str]
    title: str = "Untitled Prompt"

@router.post("/prompt/{prompt_id}", tags=["persistence"])
async def prompt(prompt_id: str, prompt: Prompt):
    # TODO: check overwrite permissions
    save_prompt(prompt_id, prompt, True)

@router.get("/prompt/{prompt_id}", tags=["persistence"])
async def prompt(prompt_id: str) -> Prompt:
    try:
        return load_prompt(prompt_id)
    except PromptNotFoundError:
        raise HTTPException(status_code=404, detail="Item not found") from PromptNotFoundError
    
def load_prompt(prompt_id: str) -> Prompt:
    prompt_dir = os.path.join(PERSISTENCE_FILE_DIR, prompt_id[0], prompt_id)
    prompt_file = os.path.join(prompt_dir, f"prompt.json")
    if not os.path.isfile(prompt_file):
        raise PromptNotFoundError
    with open(prompt_file, "r") as f:
        result_dict = json.load(f)
    return parse_obj_as(Prompt, result_dict)

def save_prompt(prompt_id: str, prompt: Prompt, edit_key: str=None):
    prompt_dir = os.path.join(PERSISTENCE_FILE_DIR, prompt_id[0], prompt_id)
    logger.info("Saving prompt %s to dir: %s", prompt_id, prompt_dir)
    if not os.path.exists(prompt_dir):
        os.makedirs(prompt_dir)
    else:
        # TODO: implement update
        raise PermissionDeniedError()
    with open(os.path.join(prompt_dir, f"prompt.json"), "w") as f:
        json.dump(prompt.dict(), f, indent=2)

class PermissionDeniedError(ValueError):
    pass

class PromptNotFoundError(ValueError):
    pass