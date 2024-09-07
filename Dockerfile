FROM centos:stream9

WORKDIR /app

# 检查是否安装了 tar 和 xz，如果没有则安装
RUN if ! command -v tar &> /dev/null || ! command -v xz &> /dev/null; then \
        yum install -y tar xz && yum clean all; \
    fi

# 将本地的 node-v21.1.0-linux-x64.tar.xz 复制到容器中
COPY node-v21.1.0-linux-x64.tar.xz /tmp/node-v21.1.0-linux-x64.tar.xz

# 解压 Node.js 到 /usr/local 目录
RUN tar -xJf /tmp/node-v21.1.0-linux-x64.tar.xz -C /usr/local --strip-components=1 \
    && rm /tmp/node-v21.1.0-linux-x64.tar.xz

# 将 npm 源设置为淘宝源
RUN npm config set registry https://registry.npmmirror.com

# 检查 yarn 是否已安装，如果没有安装则执行安装
RUN if ! command -v yarn >/dev/null 2>&1; then \
      npm install -g yarn; \
    else \
      echo "Yarn is already installed"; \
    fi

# 复制 package.json 和 yarn.lock 以利用缓存加速依赖安装
COPY package.json yarn.lock ./

# 复制项目的其他文件，排除了 node_modules
COPY . .

# 如果 package.json 或 yarn.lock 没有变动，则依赖安装步骤将被缓存，暂时注释掉
RUN yarn install

RUN yarn just-build

CMD ["yarn", "start"]
