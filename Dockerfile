FROM node:20.2.0 AS frontend_builder
WORKDIR /frontend
COPY ./frontend/ ./
RUN npm install
RUN npm run build

FROM python:3.11.3-buster
RUN pip install pipenv==2023.2.18
WORKDIR /app
COPY ./prompter_server/ ./prompter_server
COPY Pipfile ./
COPY Pipfile.lock ./
COPY --from=frontend_builder /frontend/build /built_frontend
RUN pipenv install
ENV FRONTEND_DIR=/built_frontend/
CMD ["pipenv", "run", "uvicorn", "--host", "0.0.0.0", "--port", "80", "prompter_server.main:app"]
