
**Prompter** is a web UI for LLM prompt engineering. *Prompter* is under development, you can access a demo at https://prompter.conversabile.com

Available features:

* Parametrized prompts

Planned features brainstorming:

* Prompt sharing via permalink
* LLM service connection for in-page predictions
* Multi-prompt sequences
* External service integrations
* Output JSON parsing and schema validation
* Automatic REST endpoints around prompts

# Run with Docker

A public Docker image is available for Prompter:

    docker run -p 8888:80 conversabile/prompter:latest

# Development

## Run locally

Prompter can be launched by building the frontend first, and then launching the server

```sh
cd frontend
npm install
npm run build
cd ..
# export FRONTEND_DIR=/your/custom/frontend/dir/
uvicorn prompter_server.main:app --host 0.0.0.0 --port 8000 --reload
```

The application is now available at `http://localhost:8000` (swagger UI: `http://localhost:8000/docs`)

## Docker Build and Publish

    docker build . -t conversabile/prompter:latest
    docker push conversabile/prompter:latest
