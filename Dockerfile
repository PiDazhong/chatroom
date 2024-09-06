# 使用阿里云的镜像源
FROM registry.cn-hangzhou.aliyuncs.com/nodejs/node:20.11.0

WORKDIR /app

COPY package.json yarn.lock ./

# 将 npm 源设置为淘宝源
RUN npm config set registry https://registry.npmmirror.com

RUN yarn install

COPY . .

RUN yarn just-build

CMD ["yarn", "start"]
