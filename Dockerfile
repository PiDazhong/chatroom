FROM centos:stream9

WORKDIR /app

# 将本地的 node-v20.5.0-linux-x64.tar.xz 复制到容器中
COPY node-v20.5.0-linux-x64.tar.xz /tmp/node-v20.5.0-linux-x64.tar.xz

# 解压 Node.js 到 /usr/local 目录
RUN tar -xJf /tmp/node-v20.5.0-linux-x64.tar.xz -C /usr/local --strip-components=1 \
    && rm /tmp/node-v20.5.0-linux-x64.tar.xz

# 将 npm 源设置为淘宝源，提升依赖安装速度
RUN npm config set registry https://registry.npmmirror.com

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

RUN yarn just-build

CMD ["yarn", "start"]
