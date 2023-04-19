FROM node:14-alpine as builder

RUN echo @timer2ticket:registry=https://npm.pkg.github.com/ >> ~/.npmrc
RUN --mount=type=secret,id=github_token \
      echo //npm.pkg.github.com/:_authToken=$(cat /run/secrets/github_token) >> ~/.npmrc

WORKDIR /app

COPY package*.json /app

RUN npm ci

COPY . /app

RUN npm run build

FROM node:14-alpine

ENV NODE_ENV=production

USER node

WORKDIR /app

COPY --from=builder /app /app

CMD [ "node", "./dist/src/app.js" ]