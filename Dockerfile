# Builder stage
FROM node:14-alpine AS builder
WORKDIR /usr/src/vk2discord-builder

COPY package*.json ./
COPY tsconfig*.json ./

COPY ./src ./src
COPY ./scripts ./scripts

RUN npm ci --quiet && npm run build

# Production stage
FROM node:14-alpine
WORKDIR /usr/src/vk2discord

ENV NODE_ENV=production

COPY package*.json ./
COPY LICENSE.txt ./
RUN npm ci --quiet --only=production

COPY --from=builder /usr/src/vk2discord-builder/dist ./dist
COPY ./scripts ./scripts

CMD npm start
