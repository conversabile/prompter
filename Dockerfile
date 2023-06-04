FROM node:20.2.0 AS node_builder
WORKDIR /app
COPY ./prompter_app/ ./
RUN npm install
RUN npm run build
WORKDIR /
CMD ["node", "app/build/index.js"]
