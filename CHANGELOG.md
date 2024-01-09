# Changelog

## v0.0.6 (in development)

* Add support for streaming OpenAI predictions
* Make OpenAI model configurable
* Add Ollama integration for predictions
* Shorten generated chain IDs to 11 characters
* Add badge to chains with unsaved edits
* Add "Copy to clipboard" button to rendered prompts
* Add option to save prediction service settings locally

## v0.0.5

* Add OpenAI integration for in page predictions
* Add parametrized site name
* Fix input chain ID parameter sanitization

## v0.0.4

* Add editable permalinks
* Add editable prompt titles
* Update data model to support prompt chains
* Change prompt record version to 3 (record is now a prompt chain)
* Fix invalid prompt id handling with 404 page

## v0.0.3

* Add Jinja2 syntax highlighting with CodeMirror 5
* Change prompt record version to 2 (prompt is plain text instead of HTML)

## v0.0.2

* Add sharing via permalink
* Change prompt template syntax from custom to Jinja2 via [nunjucks](https://mozilla.github.io/nunjucks/)
* Change FastAPI server with default Node server

## v0.0.1

* Prompt definition with parameter replacement and rendered result
* Docker build with FastAPI server