FROM centos:7

# 替换为阿里云源
RUN sed -i 's|mirrorlist=http://mirrorlist.centos.org|#mirrorlist=http://mirrorlist.centos.org|g' /etc/yum.repos.d/CentOS-Base.repo && \
    sed -i 's|#baseurl=http://mirror.centos.org|baseurl=https://mirrors.aliyun.com|g' /etc/yum.repos.d/CentOS-Base.repo

WORKDIR /app

# 安装依赖并下载 Node.js 二进制文件
RUN yum install -y curl \
    && curl -o node-v20.11.0-linux-x64.tar.xz https://mirrors.tuna.tsinghua.edu.cn/nodejs-release/v20.11.0/node-v20.11.0-linux-x64.tar.xz \
    && tar -xJf node-v20.11.0-linux-x64.tar.xz -C /usr/local --strip-components=1 \
    && rm node-v20.11.0-linux-x64.tar.xz

# 将 npm 源设置为淘宝源，提升依赖安装速度
RUN npm config set registry https://registry.npmmirror.com

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

RUN yarn just-build

CMD ["yarn", "start"]
