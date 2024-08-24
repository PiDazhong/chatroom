/**
 * @des 用户列表 相关接口
 */
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import dayjs from 'dayjs';
import _ from 'lodash';

import {
  DB_NAME,
  isProd,
  delay,
  runSql,
  insertOrUpdateAfterQuery,
  sshConfig,
} from './constsES5.mjs';

const router = express.Router();

function parseUrlParams(url) {
  const search = _.split(url, '?')[1] || '';
  const params = new URLSearchParams(search);

  // 将参数转换为对象
  const paramsObj = {};
  for (const [key, value] of params.entries()) {
    paramsObj[key] = value;
  }

  return paramsObj;
}

// 广播消息
function broadcastToRoom(clients, message) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

const getOnlineMembersByRoomId = async (roomId) => {
  const userTable = `${DB_NAME}.chat_room_user_table`;
  // 查询在线的人 且 在指定聊天室的人
  const queryOnlineMembers = `SELECT user_name, head_num FROM ${userTable} where room_ids like '%${roomId}%' and user_status='online'`;
  const onlineMembers = (await runSql(queryOnlineMembers)) || [];

  return onlineMembers;
};

const getLogsByRoomId = async (roomId) => {
  const logTable = `${DB_NAME}.chat_room_log_table`;

  // 查询聊天记录  最近 200 条
  const queryLogs = `SELECT log_user_name, log_content, log_time FROM ${logTable} where log_room_id='${roomId}' order by log_time limit 200`;
  const logs = await runSql(queryLogs);
  return logs;
};

function setupWebSocket(server) {
  const rooms = new Map();
  const userClientsMap = new Map();

  // 创建 WebSocket 服务器，使用传入的 HTTP 服务器
  const wss = new WebSocketServer({ server });

  // 监听客户端连接事件
  wss.on('connection', async (ws, req) => {
    const logTable = `${DB_NAME}.chat_room_log_table`;
    const userTable = `${DB_NAME}.chat_room_user_table`;
    const query = parseUrlParams(req.url);

    // 判断 roomId 是否存在
    const { roomId, nickId } = query;
    if (!roomId) {
      ws.close(1008, 'Room ID not provided');
      return;
    }
    // 将连接加入到对应的房间
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(ws);
    // 将连接加入到对应的个人
    if (!userClientsMap.has(nickId)) {
      userClientsMap.set(nickId, new Set());
    }
    userClientsMap.get(nickId).add(ws);

    const roomIdClients = rooms.get(roomId);
    const getUserClients = (nickId) => userClientsMap.get(nickId);

    // 更新 用户 的状态  为 online
    const queryRoomIdsSql = `SELECT user_id, user_name, room_ids FROM ${userTable} where user_id='${nickId}'`;
    const userInfo = (await runSql(queryRoomIdsSql))[0];
    const user_name = userInfo?.user_name;
    const roomIds = userInfo?.room_ids?.split(',').filter(Boolean) || [];
    const newRoomIds = _.uniq([...roomIds, roomId]).join(',');
    await runSql(
      `update ${userTable} set user_status='online', room_ids='${newRoomIds}' where user_id='${nickId}' `,
    );
    const onlineMembers = await getOnlineMembersByRoomId(roomId);
    broadcastToRoom(
      roomIdClients,
      JSON.stringify([
        // 告诉大家 xxx 进入了房间
        {
          type: 'message',
          data: {
            log_user_name: 'system',
            log_content: `${user_name} 进入了房间`,
          },
        },
        // 通知大家，聊天室的信息变更了，这里只返回在线的人
        {
          type: 'members',
          data: onlineMembers,
        },
      ]),
    );

    // 监听客户端发送的消息
    ws.on('message', async (message) => {
      // 根据消息种类 进行 不同的操作
      const messageParse = JSON.parse(message.toString('utf-8'));
      const { content, sendUserName, sendUserId, sendRoom, type, sendTime } =
        messageParse;
      console.log('message', message, messageParse);
      // 如果发过来的是消息，那么直接广播出去即可
      if (type === 'message') {
        // 将发送来的消息存入数据库
        await runSql(
          `insert into ${logTable} 
            (log_id, log_content, log_time, log_room_id, log_user_id, log_user_name) 
            values 
            ('${sendRoom}_${sendUserId}_${sendTime}', '${content}', '${sendTime}', '${sendRoom}', '${sendUserId}', '${sendUserName}')
          `,
        );
        // 广播消息给同一房间的其他客户端
        broadcastToRoom(
          roomIdClients,
          JSON.stringify([
            {
              type: 'message',
              data: {
                log_user_name: sendUserName,
                log_content: content,
                log_time: sendTime,
              },
            },
          ]),
        );
      }
      // 如果是请求最近的200条聊天记录
      if (type === 'query-logs') {
        // 广播消息给指定的这个用户
        const logs = await getLogsByRoomId(sendRoom);
        broadcastToRoom(
          getUserClients(sendUserId),
          JSON.stringify([
            {
              type: 'logs',
              data: logs,
            },
          ]),
        );
      }
    });

    // 监听客户端断开连接
    ws.on('close', async () => {
      await runSql(
        `update ${userTable} set user_status='offline', room_ids='' where user_id='${nickId}' `,
      );
      const onlineMembers = await getOnlineMembersByRoomId(roomId);
      // 告诉大家 xxx 离开了房间
      broadcastToRoom(
        roomIdClients,
        JSON.stringify([
          // 告诉大家 xxx 离开了房间
          {
            type: 'message',
            data: {
              log_user_name: 'system',
              log_content: `${user_name} 离开了房间`,
            },
          },
          // 通知大家，聊天室的信息变更了，这里只返回在线的人
          {
            type: 'members',
            data: onlineMembers,
          },
        ]),
      );
    });
  });

  console.log('\x1b[35m%s\x1b[0m', 'WebSocket server working...');
}

// 获取 room 的数量
router.get('/getRoomNums', async (req, res) => {
  try {
    const querySql = `SELECT room_id FROM ${DB_NAME}.chat_room_table`;
    const results = await runSql(querySql);
    res.send({
      success: true,
      data: results.length,
    });
  } catch (e) {
    res.send({
      success: true,
      data: 0,
    });
  }
});

// 创建 或 进入聊天室
router.post('/createChatroom', async (req, res) => {
  const { chatroomName, nickName, headNum } = req.body;
  try {
    const now = dayjs().valueOf();
    const nowTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const room_id = `room_${now}`;
    const user_id = `user_${now}`;

    const roomTable = `${DB_NAME}.chat_room_table`;
    const userTable = `${DB_NAME}.chat_room_user_table`;

    // 查看是否存在当前的房间
    const queryRoomSql = `SELECT room_id FROM ${roomTable} where room_name='${chatroomName}'`;
    const existRoomId = (await runSql(queryRoomSql))[0]?.room_id;

    // 创建房间，如果房间有现成的，那就直接用现成的，如果没有就新建一个房间
    await insertOrUpdateAfterQuery(
      `select 1 from ${roomTable} where room_name='${chatroomName}'`,
      `update ${roomTable} set room_status='active' where room_name='${chatroomName}'`,
      `insert into ${roomTable} (room_id, room_name, room_status, create_time) values ('${room_id}', '${chatroomName}', 'active', '${nowTime}')`,
    );

    // 查询当前用户活跃的房间
    const queryRoomIdsSql = `SELECT user_id, room_ids FROM ${userTable} where user_name='${nickName}'`;
    const user = (await runSql(queryRoomIdsSql))[0];
    const userId = user?.user_id;
    const roomIds = user?.room_ids?.split(',').filter(Boolean) || [];
    const newRoomIds = _.uniq([...roomIds, existRoomId]).join(',');

    // 创建用户
    await insertOrUpdateAfterQuery(
      `select 1 from ${userTable} where user_name='${nickName}'`,
      `update ${userTable} set user_status='online',room_ids='${newRoomIds}',head_num='${headNum}' where user_name='${nickName}'`,
      `insert into ${userTable} (user_id, user_name, user_status, create_time, room_ids, head_num) values ('${user_id}', '${nickName}', 'online', '${nowTime}', '${newRoomIds}', '${headNum}')`,
    );

    res.send({
      success: true,
      data: {
        chatroomId: existRoomId || room_id,
        nickId: userId || user_id,
      },
    });
  } catch (e) {
    console.log(e);
    res.send({
      error: '创建失败',
    });
  }
});

// 判断用户是否正规进入过room
router.post('/validateNickIdByRoomId', async (req, res) => {
  const { roomId, nickId } = req.body;
  try {
    const userTable = `${DB_NAME}.chat_room_user_table`;

    // 查看是否存在当前的房间
    const queryStatusSql = `SELECT user_status FROM ${userTable} where user_id='${nickId}' and room_ids like '%${roomId}%' `;

    const status = (await runSql(queryStatusSql))[0]?.user_status;
    if (status === 'online') {
      res.send({
        success: true,
      });
    } else {
      res.send({
        success: false,
      });
    }
  } catch (e) {
    res.send({
      success: false,
    });
  }
});

// 根据roomid 查询 room信息
router.post('/getRoomInfo', async (req, res) => {
  const { roomId } = req.body;
  try {
    const roomTable = `${DB_NAME}.chat_room_table`;

    // 查看是否存在当前的房间
    const querySql = `SELECT room_name FROM ${roomTable} where room_id = '${roomId}' `;

    const roomName = (await runSql(querySql))[0]?.room_name;
    res.send({
      success: true,
      data: roomName,
    });
  } catch (e) {
    res.send({
      error: '查询报错',
    });
  }
});

export { setupWebSocket, router };
