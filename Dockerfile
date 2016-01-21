FROM node:slim

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ADD package.json /usr/src/app/
RUN npm install --only prod

ADD . /usr/src/app
RUN npm run grunt

CMD [ "node", "index.js" ]
