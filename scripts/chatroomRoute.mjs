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

// 查询在指定聊天室的 在线的人
const getOnlineMembersByRoomId = async (roomId) => {
  const userTable = `${DB_NAME}.chat_room_user_table`;
  const queryOnlineMembers = `SELECT user_name, head_num FROM ${userTable} where room_ids like '%${roomId}%' and user_status='online'`;
  const onlineMembers = (await runSql(queryOnlineMembers)) || [];

  return onlineMembers;
};

// 查询 指定聊天室 聊天记录  最近 200 条
const getLogsByRoomId = async (roomId) => {
  const logTable = `${DB_NAME}.chat_room_log_table`;

  const queryLogs = `SELECT log_user_name, log_content, log_time FROM ${logTable} where log_room_id='${roomId}' order by log_time limit 200`;
  const logs = await runSql(queryLogs);
  return logs;
};

// 查询 聊天室的name
const getRoomNameByRoomId = async (roomId) => {
  const roomTable = `${DB_NAME}.chat_room_table`;
  const queryRoomName = `SELECT room_name FROM ${roomTable} where room_id='${roomId}'`;
  const roomName = (await runSql(queryRoomName))[0]?.room_name;
  return roomName;
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

    const nowTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const now = dayjs().valueOf();

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

    // 当前 房间name
    const roomName = await getRoomNameByRoomId(roomId);

    // 更新 用户 的状态  为 online
    const queryRoomIdsSql = `SELECT user_id, user_name, room_ids FROM ${userTable} where user_id='${nickId}'`;
    const userInfo = (await runSql(queryRoomIdsSql))[0];
    const user_name = userInfo?.user_name;
    const roomIds = userInfo?.room_ids?.split(',').filter(Boolean) || [];
    const newRoomIds = _.uniq([...roomIds, roomId]).join(',');
    const joinInMessage = `${user_name} 进入了房间`;
    await runSql(
      `update ${userTable} set user_status='online', room_ids='${newRoomIds}' where user_id='${nickId}' `
    );
    // 进入房间的信息也入库吧
    await runSql(
      `insert into ${logTable} 
        (log_id, log_content, log_time, log_room_id, log_room_name, log_user_id, log_user_name) 
        values 
        ('${now}', '${joinInMessage}', '${nowTime}', '${roomId}', '${roomName}', '${nickId}', 'system')
      `
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
            log_content: joinInMessage,
          },
        },
        // 通知大家，聊天室的信息变更了，这里只返回在线的人
        {
          type: 'members',
          data: onlineMembers,
        },
      ])
    );

    // 监听客户端发送的消息
    ws.on('message', async (message) => {
      // 根据消息种类 进行 不同的操作
      const messageParse = JSON.parse(message.toString('utf-8'));
      const {
        content,
        sendUserName,
        sendUserId,
        sendRoomId,
        sendRoomName,
        type,
        sendTime,
      } = messageParse;
      const sendTimeNow = dayjs().valueOf();
      // 如果发过来的是消息，那么直接广播出去即可
      if (type === 'message') {
        // 将发送来的消息存入数据库
        await runSql(
          `insert into ${logTable} 
            (log_id, log_content, log_time, log_room_id, log_room_name, log_user_id, log_user_name) 
            values 
            ('${sendTimeNow}', '${content}', '${sendTime}', '${sendRoomId}', '${sendRoomName}', '${sendUserId}', '${sendUserName}')
          `
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
          ])
        );
      }
      // 如果是请求最近的200条聊天记录
      if (type === 'query-logs') {
        // 广播消息给指定的这个用户
        const logs = await getLogsByRoomId(sendRoomId);
        broadcastToRoom(
          getUserClients(sendUserId),
          JSON.stringify([
            {
              type: 'logs',
              data: logs,
            },
          ])
        );
      }

      if (type === 'ping') {
        // 说明发来的是心跳包，目前不做处理
      }
    });

    // 监听客户端断开连接
    ws.on('close', async () => {
      const exitTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
      const exitTimeNow = dayjs().valueOf();

      // 更新 用户 的活跃房间： 去掉当前房间
      const queryExitRoomIdsSql = `SELECT user_id, user_name, room_ids FROM ${userTable} where user_id='${nickId}'`;
      const userInfoExit = (await runSql(queryExitRoomIdsSql))[0];
      const user_name = userInfoExit?.user_name;
      const roomIdsExit =
        userInfoExit?.room_ids?.split(',').filter(Boolean) || [];
      const newRoomIdsExit = _.filter(roomIdsExit, (item) => item !== roomId);
      const newRoomIdsExitStr = newRoomIdsExit.join(',');
      const user_status = newRoomIdsExit.length > 0 ? 'online' : 'offline';

      const exitMessage = `${user_name} 离开了房间`;
      await runSql(
        `update ${userTable} set user_status='${user_status}',room_ids='${newRoomIdsExitStr}' where user_id='${nickId}' `
      );
      // 离开房间的信息也入库吧
      await runSql(
        `insert into ${logTable} 
        (log_id, log_content, log_time, log_room_id, log_room_name, log_user_id, log_user_name) 
        values 
        ('${exitTimeNow}', '${exitMessage}', '${exitTime}', '${roomId}', '${roomName}', '${nickId}', 'system')
      `
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
              log_content: exitMessage,
            },
          },
          // 通知大家，聊天室的信息变更了，这里只返回在线的人
          {
            type: 'members',
            data: onlineMembers,
          },
        ])
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
      `insert into ${roomTable} (room_id, room_name, room_status, create_time) values ('${room_id}', '${chatroomName}', 'active', '${nowTime}')`
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
      `insert into ${userTable} (user_id, user_name, user_status, create_time, room_ids, head_num) values ('${user_id}', '${nickName}', 'online', '${nowTime}', '${newRoomIds}', '${headNum}')`
    );

    // room_id
    const realRoomId = existRoomId || room_id;
    // real user id
    const realUserId = userId || user_id;

    res.send({
      success: true,
      data: {
        chatroomId: realRoomId,
        nickId: realUserId,
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

// 根据 userId 查询 用户信息
router.post('/getUserInfo', async (req, res) => {
  const { userId } = req.body;
  try {
    const userTable = `${DB_NAME}.chat_room_user_table`;

    // 查看是否存在当前的房间
    const querySql = `SELECT user_name FROM ${userTable} where user_id='${userId}' `;

    const userName = (await runSql(querySql))[0]?.user_name;
    res.send({
      success: true,
      data: userName,
    });
  } catch (e) {
    res.send({
      error: '查询报错',
    });
  }
});

// 根据 userId 查询 用户信息
router.get('/getLoginLog', async (req, res) => {
  try {
    const logTable = `${DB_NAME}.chat_room_log_table`;
    const querySql = `SELECT log_id, log_content, log_time, log_room_name FROM ${logTable} where log_user_name='system' order by log_time desc limit 1000 `;
    const result = await runSql(querySql);
    res.send({
      success: true,
      data: result,
    });
  } catch (e) {
    res.send({
      error: '查询报错',
    });
  }
});

// 新增 博客 访问记录
router.post('/saveBlogVisitRecord', async (req, res) => {
  try {
    const { info } = req.body;
    const { browser, os, device, path } = JSON.parse(info);
    const blogHistoryTable = `${DB_NAME}.blog_history_table`;

    const nowTime = dayjs().format('YYYY-MM-DD HH:mm:ss');

    // 获取用户的真实 IP 地址
    const ip =
      req.headers['x-forwarded-for'] || // 获取代理后的真实 IP
      req.connection.remoteAddress || // 获取远程客户端 IP
      req.socket.remoteAddress || // 获取网络套接字的 IP
      req.connection.socket.remoteAddress;

    await runSql(
      `insert into ${blogHistoryTable} 
        (time, browser, os, device, path, ip) 
        values 
        ('${nowTime}', '${browser}', '${os}', '${device}', '${path}', '${ip}')
      `
    );
    res.send({
      success: true,
    });
  } catch (e) {
    res.send({
      error: '新增博客访问记录报错',
    });
  }
});

// 查询 博客访问记录
router.get('/getBlogVisitRecord', async (req, res) => {
  try {
    const blogHistoryTable = `${DB_NAME}.blog_history_table`;
    const querySql = `SELECT browser, os, device, path, time FROM ${blogHistoryTable} order by time desc limit 1000 `;
    const result = await runSql(querySql);
    res.send({
      success: true,
      data: result,
    });
  } catch (e) {
    res.send({
      error: '查询博客访问记录报错',
    });
  }
});

// 查询 摩托日志
router.post('/getMotoLog', async (req, res) => {
  const { curMoto } = req.body;
  try {
    const motoLogTable = `${DB_NAME}.moto_cost_table`;
    const curMotoFilter = curMoto ? `and moto_id='${curMoto}'` : '';
    const querySql = `
      SELECT * 
      FROM ${motoLogTable} 
      where 1=1
      ${curMotoFilter}
      order by time limit 1000 
    `;
    const result = await runSql(querySql);
    res.send({
      success: true,
      data: result,
    });
  } catch (e) {
    res.send({
      error: '查询摩托日志报错',
    });
  }
});

// 查询 摩托日志
router.post('/addMotoLog', async (req, res) => {
  const { curMoto, total_mile, cost } = req.body;
  try {
    const motoLogTable = `${DB_NAME}.moto_cost_table`;
    // 查询上次当前摩托的最大值
    const querySql = `select * from ${motoLogTable} where moto_id='${curMoto}' order by time desc limit 1`;
    const lastLog = (await runSql(querySql))[0] || {
      total_mile: 0,
      total_cost: 0,
    };
    const { total_mile: lastTotalMile, total_cost: lastTotalCost } = lastLog;
    const mile = Number(total_mile) - Number(lastTotalMile);
    const totalCost = Number(lastTotalCost) + Number(cost);
    const time = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const timestamp = dayjs().valueOf();

    console.log('ttt', {
      curMoto,
      total_mile,
      cost,
      lastLog,
      lastTotalMile,
      mile,
      lastTotalCost,
      totalCost,
      timestamp,
    });
    const addSql = `
      insert into ${motoLogTable} 
      (id, moto_name, moto_id, cost, total_cost, mile, total_mile, time) 
      values 
      ('${timestamp}', '${curMoto}', '${curMoto}', ${cost}, ${totalCost}, ${mile}, ${total_mile}, '${time}')
    `;
    await runSql(addSql);
    res.send({
      success: true,
    });
  } catch (e) {
    res.send({
      error: '新增日志报错',
    });
  }
});

export { setupWebSocket, router };
