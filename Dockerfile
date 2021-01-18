FROM node:14-alpine
WORKDIR /usr/src/vk2discord

COPY package*.json ./

RUN [ "npm", "install" ]
RUN [ "npm", "build" ]

COPY . .

CMD [ "npm", "start" ]
