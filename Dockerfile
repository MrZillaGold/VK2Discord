FROM node:14-alpine
WORKDIR /usr/src/vk2discord

COPY package*.json ./

RUN [ "npm", "install" ]
RUN [ "npm", "run-script", "build" ]

COPY . .

CMD [ "npm", "start" ]
