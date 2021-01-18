FROM node:14-alpine
WORKDIR /usr/src/vk2discord

COPY package*.json ./
COPY tsconfig*.json ./
COPY LICENSE.txt ./

COPY ./src ./src
COPY ./scripts ./scripts

CMD [ "npm", "ci" ]
CMD [ "npm", "build" ]
