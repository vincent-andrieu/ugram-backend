FROM node:18-slim

WORKDIR /app
COPY package.json /app/
COPY package-lock.json /app/
COPY tsconfig.json /app/
COPY src/ /app/src/
COPY .env /app/

RUN npm ci

ENV NODE_ENV production

RUN npm run build
RUN npm ci --only=prod

CMD npm run start:force