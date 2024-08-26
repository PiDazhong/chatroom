import qs from 'query-string';

class FetchManager {
  constructor() {
    this.isRefreshing = false; // 是否正在刷新 token
    this.pendingRequests = []; // 等待的请求队列
    this.defaultHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  }

  async fetchRequest(url, options = {}) {
    this.url = url;
    this.timeout = options.timeout || 600 * 1000; // 超时时间 10分钟
    this.method = options.method || 'GET';
    this.headers = { ...this.defaultHeaders, ...options.headers };
    this.body = qs.stringify(options.body) || null;
    this.signal = options.signal || null;

    // 错误处理
    this.onError =
      options.onError || ((errorMessage) => console.error(errorMessage));
    // 警告处理
    this.onWarning =
      options.onWarning || ((warnMessage) => console.warn(warnMessage));
    // 重新登录
    this.onLogin = options.onLogin || function () {};

    try {
      return await this.execute();
    } catch (error) {
      if (error.message === '401 Unauthorized') {
        const newToken = await this.refreshToken();
        this.headers.Authorization = `Bearer ${newToken}`;
        return this.execute(); // 重新执行请求
      }
      throw error;
    }
  }

  // 带超时机制的请求方法
  async fetchWithTimeout() {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Request timed out'));
      }, this.timeout);

      fetch(this.url, {
        method: this.method,
        headers: this.headers,
        body: this.body,
        signal: this.signal,
      })
        .then((response) => {
          clearTimeout(timeoutId);
          if (response.status === 401) {
            reject(new Error('401 Unauthorized'));
          } else {
            resolve(response);
          }
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  // 执行请求
  async execute() {
    try {
      const jwt = localStorage.getItem('quantanalysis_jwt');
      if (jwt) {
        this.headers.Authorization = `Bearer ${jwt}`;
      }

      const response = await this.fetchWithTimeout();
      const data = await this.parseResponse(response);

      if (data?.error) {
        this.onError(data.error);
        return {};
      }

      if (data?.warning) {
        this.onWarning(data.warning);
        return {};
      }

      return data;
    } catch (error) {
      this.handleRequestError(error);
      return {};
    }
  }

  // 处理请求结果的 parse
  async parseResponse(response) {
    try {
      const dataJson = await response.text();
      return JSON.parse(dataJson || '{}');
    } catch (error) {
      this.onError('JSON parse错误:', error);
      return {};
    }
  }

  // 处理超时或请求错误的情况
  handleRequestError(error) {
    if (error.message === 'Request timed out') {
      this.onError('请求超时:', error);
    } else {
      this.onError('请求错误:', error);
    }
  }

  // 刷新 token 的方法
  async refreshToken() {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.pendingRequests.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const jwtLong = localStorage.getItem('quantanalysis_jwt_long');
      if (!jwtLong) {
        throw new Error('长效jwt找不到，无法刷新token');
      }

      const response = await fetch('/mysql/refreshToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtLong}`, // 携带长期 token
        },
      });

      if (!response.ok) {
        throw new Error('刷新 token 失败');
      }

      const data = await response.json();
      if (data?.token) {
        localStorage.setItem('quantanalysis_jwt', data.token);
        this.headers.Authorization = `Bearer ${data.token}`;

        this.isRefreshing = false;

        // 重新执行所有挂起的请求，这里是将第一个阻塞 refreshToken 的请求拿到的结果直接返回出去
        // 这样其他请求就不需要真的去执行 refreshToken 发起 fetch 请求拿到 token 了
        this.pendingRequests.forEach(({ resolve }) => resolve(data.token));
        this.pendingRequests = [];

        return data.token;
      } else {
        throw new Error('刷新 token 失败, 返回结果有误');
      }
    } catch (error) {
      this.isRefreshing = false;
      this.pendingRequests.forEach(({ reject }) => reject(error));
      this.pendingRequests = [];

      localStorage.removeItem('quantanalysis_jwt');
      localStorage.removeItem('quantanalysis_jwt_long');
      // 重新登录，这里可以写页面跳转之类的，外部传入即可
      this.onLogin();
      throw error;
    }
  }
}

// 导出单一实例
export default new FetchManager();
