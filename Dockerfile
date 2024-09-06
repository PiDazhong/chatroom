# 使用一个轻量级的基础镜像，例如 Debian 或 Ubuntu
FROM debian:buster-slim

# 设置工作目录
WORKDIR /app

# 安装依赖并下载 Node.js 二进制文件
RUN apt-get update && apt-get install -y curl \
    && curl -o node-v20.11.0-linux-x64.tar.xz https://mirrors.tuna.tsinghua.edu.cn/nodejs-release/v20.11.0/node-v20.11.0-linux-x64.tar.xz \
    && tar -xJf node-v20.11.0-linux-x64.tar.xz -C /usr/local --strip-components=1 \
    && rm node-v20.11.0-linux-x64.tar.xz

# 将 npm 源设置为淘宝源，提升依赖安装速度
RUN npm config set registry https://registry.npmmirror.com

# 复制 package.json 和 yarn.lock 文件
COPY package.json yarn.lock ./

# 安装依赖
RUN yarn install

# 复制项目的所有文件
COPY . .

# 构建项目
RUN yarn just-build

# 暴露端口（例如 3000）
EXPOSE 3000

# 启动应用
CMD ["yarn", "start"]
