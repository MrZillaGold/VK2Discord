FROM node:14-alpine
WORKDIR /usr/src/vk2discord

COPY package*.json ./

RUN [ "npm", "install" ]

COPY . .

CMD [ "npm", "start" ]
