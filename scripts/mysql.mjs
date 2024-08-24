/**
 * @des 连接数据库
 */
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { createServer } from 'http';

import { router as chatroomRoute, setupWebSocket } from './chatroomRoute.mjs'; // 导入 chatroomRoute 相关接口

const app = express();
// 创建 HTTP 服务器
const server = createServer(app);

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 使用 chatroomRoute
app.use('/mysql', chatroomRoute);

// 传递 Express 应用实例和 HTTP 服务器实例给 WebSocket 逻辑
setupWebSocket(server);

/** ----------------------------------------------------开启服务监听---------------------------------------- */
server.listen(7005, () => {
  console.log('\x1b[35m%s\x1b[0m', 'mysql server working...');
});

export default app;
