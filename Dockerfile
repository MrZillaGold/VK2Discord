FROM node:14
WORKDIR /usr/src/vk2discord

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "npm", "start" ]
