FROM node:14-alpine as builder

RUN --mount=type=secret,id=NPM_TOKEN export NPM_TOKEN=$(cat /run/secrets/NPM_TOKEN)

RUN echo @timer2ticket:registry=https://npm.pkg.github.com/ >> ~/.npmrc
RUN echo //npm.pkg.github.com/:_authToken=$NPM_TOKEN >> ~/.npmrc

COPY package*.json /app

RUN npm ci

WORKDIR /app

COPY . /app

RUN npm run build

FROM node:14-alpine

ENV NODE_ENV=production

USER node

WORKDIR /app

COPY --from=builder /app /app

CMD [ "node", "./dist/src/app.js" ]