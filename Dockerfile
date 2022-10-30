# Builder stage
FROM node:19-alpine AS builder
WORKDIR /usr/src/vk2discord

COPY package*.json ./
COPY tsconfig*.json ./

COPY ./src ./src
COPY ./scripts ./scripts

RUN npm ci --quiet && npm run build

# Production stage
FROM node:19-alpine
WORKDIR /usr/src/vk2discord

ENV NODE_ENV=production

COPY package*.json ./
COPY LICENSE.txt ./
RUN npm ci --quiet --only=production

COPY --from=builder /usr/src/vk2discord/dist ./dist
COPY ./scripts ./scripts

CMD ["npm", "start"]
