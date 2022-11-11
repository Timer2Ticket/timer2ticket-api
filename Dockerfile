FROM node:16-alpine as builder

USER root

RUN apk --no-cache add --virtual .builds-deps build-base python3

COPY . /app/
WORKDIR /app

RUN npm install && npm run build

FROM node:16-alpine

USER root

RUN apk --no-cache add --virtual .builds-deps build-base python3

ENV NODE_ENV=production

USER node

COPY --from=builder --chown=node:node /app/dist /app/dist
COPY --chown=node:node package*.json /app/
WORKDIR /app

RUN npm install --production

CMD [ "node", "./dist/src/app.js" ]
