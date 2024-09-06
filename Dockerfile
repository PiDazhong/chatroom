FROM node:20.11.0

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

RUN yarn just-build

CMD ["yarn", "start"]
