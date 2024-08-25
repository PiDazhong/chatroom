/**
 * @des 封装一个 心跳机制 和 断线重连的 WebSocketManager
 */

class WebSocketManager {
  constructor(url, options = {}) {
    this.url = url;
    this.socket = null;
    // 心跳定时器
    this.heartBeatInterval = null;
    // 断线重连定时器
    this.reconnectInterval = null;
    this.options = {
      reconnectDelay: options.reconnectDelay || 5000, // 断线重连的延迟
      heartBeatDelay: options.heartBeatDelay || 3000, // 心跳机制的间隔
      onOpen: options.onOpen || function () {}, // 连接成功的回调
      onMessage: options.onMessage || function () {}, // 接收消息的回调
      onError: options.onError || function () {}, // 连接错误的回调
      onClose: options.onClose || function () {}, // 连接关闭的回调
      onReconnect: options.onReconnect || function () {}, // 重连成功的回调
    };
  }

  // 初始化连接
  initWebSocket() {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      console.log('WebSocket 连接已存在或正在连接中');
      return;
    }

    console.log('初始化 WebSocket 连接...');
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log('WebSocket 连接成功');
      this.stopReconnect(); // 确保成功连接后停止重连逻辑
      this.options.onOpen();
      this.startHeartBeat();
    };

    this.socket.onmessage = (event) => {
      console.log('收到消息:', event.data);
      this.options.onMessage(event);
    };

    this.socket.onerror = (error) => {
      console.log('WebSocket 连接错误:', error);
      this.options.onError(error);
      // this.reconnect(); // 发生错误时尝试重连
    };

    this.socket.onclose = (event) => {
      console.log(
        'WebSocket 连接关闭，代码:',
        event.code,
        '原因:',
        event.reason,
      );
      this.options.onClose(event);
      if (event.code !== 1000) {
        // 1000 表示正常关闭
        this.reconnect(); // 非正常关闭时重连
      }
    };
  }

  reconnect() {
    console.log('尝试重连，当前 readyState:', this.socket.readyState);

    if (
      this.reconnectInterval ||
      this.socket?.readyState === WebSocket.OPEN ||
      this.socket?.readyState === WebSocket.CONNECTING
    ) {
      console.log('正在重连或已连接，跳过重连');
      return;
    }

    this.reconnectInterval = setInterval(() => {
      console.log('重连中，当前 readyState:', this.socket.readyState);

      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        console.log('连接成功，停止重连');
        this.stopReconnect();
        return;
      }

      if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
        console.log('连接正在建立中，等待...');
        return;
      }

      console.log('未连接，重新初始化 WebSocket');
      this.options.onReconnect();
      this.initWebSocket();
    }, this.options.reconnectDelay);
  }

  // 开始心跳
  startHeartBeat() {
    this.heartBeatInterval = setInterval(() => {
      // 如果socket存在且连接成功，发送心跳包
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.options.heartBeatDelay);
  }

  // 停止心跳
  stopHeartBeat() {
    clearInterval(this.heartBeatInterval);
    this.heartBeatInterval = null;
  }

  stopReconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
      console.log('重连已停止');
    }
  }

  // 手动关闭 WebSocket
  closeWebSocket() {
    if (
      this.socket &&
      (this.socket?.readyState === WebSocket.OPEN ||
        this.socket?.readyState === WebSocket.CONNECTING)
    ) {
      this.stopHeartBeat();
      this.stopReconnect();
      this.socket.close(1000, '正常关闭');
    }
  }

  // 发送消息
  sendMessage(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    }
  }

  // 当前连接器的状态
  getReadyState() {
    if (this.socket) {
      return this.socket.readyState;
    }
    return -1;
  }
}

export default WebSocketManager;
