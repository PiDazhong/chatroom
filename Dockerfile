FROM node:20.11.0

WORKDIR /app

# 将 npm 源设置为淘宝源，提升依赖安装速度
RUN npm config set registry https://registry.npmmirror.com

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

RUN yarn just-build

CMD ["yarn", "start"]
