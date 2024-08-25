/**
 * @des 房间
 */

import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { Input, message, Tooltip } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useNavigate } from 'react-router-dom';
import { fetchRequest } from 'utils';
import Spin from 'components/Spin';
import Abbr from 'components/Abbr';
import WebSocketManager from 'components/WebSocketManager';
import useUrlParams from 'hooks/useUrlParams';
import './Room.scss';

const Room = () => {
  let navigate = useNavigate();

  const { roomId, userId: nickId } = useUrlParams();

  // 当前输入框的值
  const [inputValue, setInputValue] = useState('');
  // 当前聊天室的聊天记录
  const [logs, setLogs] = useState([]);
  // 在线的人
  const [onlineMembers, setOnlineMembers] = useState([]);
  // 房间名
  const [roomName, setRoomName] = useState('');
  // 用户名
  const [nickName, setNickName] = useState('');
  // loading
  const [loading, setLoading] = useState(true);

  // 当前的 websocket 实例
  const ws = useRef(null);
  // 聊天记录容器dom
  const logsContanierRef = useRef(null);

  // 滚动到最底部
  const scrollToBottom = () => {
    if (logsContanierRef.current) {
      // 延迟执行 scrollToBottom 确保容器高度已更新
      setTimeout(() => {
        logsContanierRef.current.scrollTop =
          logsContanierRef.current.scrollHeight;
      }, 0);
    }
  };

  // 校验 合法性
  const validate = async () => {
    setLoading(true);

    try {
      if (!roomId) {
        message.error('房间号不能为空');
        navigate('/');
      }
      if (!nickId) {
        message.error('未登录');
        navigate('/');
      }
      // 判断 nickId 是否正确进入过 room
      const { success } = await fetchRequest(
        '/mysql/validateNickIdByRoomId',
        'post',
        {
          roomId,
          nickId,
        },
      );
      if (!success) {
        navigate('/');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 查询 roominfo
  const getRoomInfo = async () => {
    try {
      const { success, data } = await fetchRequest(
        '/mysql/getRoomInfo',
        'post',
        {
          roomId,
        },
      );
      if (success) {
        setRoomName(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 查询 userinfo
  const getUserInfo = async () => {
    try {
      const { success, data } = await fetchRequest(
        '/mysql/getUserInfo',
        'post',
        {
          userId: nickId,
        },
      );
      if (success) {
        setNickName(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      // 先执行验证和数据获取
      await validate();
      await getRoomInfo();
      await getUserInfo();

      // 确保房间 ID 和用户 ID 都存在
      if (roomId && nickId) {
        connectWebSocket();
      }
    };

    const connectWebSocket = () => {
      if (ws.current && ws.current.getReadyState() !== WebSocket.CLOSED) {
        return;
      }

      console.log('初始化 WebSocket 连接...');
      ws.current = new WebSocketManager(
        `/ws?roomId=${roomId}&nickId=${nickId}`,
        {
          reconnectDelay: 5000,
          heartBeatDelay: 5000,
          onOpen: () => {
            console.log('WebSocket 连接成功');
            message.success({
              content: '聊天室连接成功',
              key: 'success-connect',
            });
          },
          onMessage: (event) => {
            console.log('收到消息:', event.data);
            handleReciveMessage(event.data);
          },
          onError: (error) => {
            console.error('WebSocket 连接错误', error);
          },
          onClose: (event) => {
            console.log(
              'WebSocket 断开连接，代码:',
              event.code,
              '原因:',
              event.reason,
            );
            message.success({
              content: '聊天室断开连接',
              key: 'success-close',
            });
          },
          onReconnect: () => {
            console.log('正在尝试重新连接...');
            message.warning({
              content: '正在尝试重新连接',
              key: 'success-reconnect',
            });
          },
        },
      );

      ws.current.initWebSocket();
    };

    initialize();

    return () => {
      console.log('组件卸载，关闭 WebSocket 连接...');
      if (ws.current) {
        ws.current.closeWebSocket();
        ws.current = null;
      }
    };
  }, [roomId, nickId]);

  // 处理 接受到的消息
  const handleReciveMessage = (dataStr) => {
    const parseData = JSON.parse(dataStr);
    for (let item of parseData) {
      const { type, data } = item;
      if (type === 'logs') {
        setLogs(data);
        scrollToBottom();
      }
      if (type === 'members') {
        setOnlineMembers(data);
      }
      if (type === 'message') {
        setLogs((prev) => [...prev, data]);
        scrollToBottom();
      }
    }
  };

  const sendMessage = () => {
    if (!inputValue) {
      message.warning('空消息');
      return;
    }
    if (ws.current && ws.current.getReadyState() === WebSocket.OPEN) {
      const info = {
        content: inputValue,
        sendUserName: nickName,
        sendUserId: nickId,
        sendRoomId: roomId,
        sendRoomName: roomName,
        sendTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        type: 'message',
      };
      ws.current.sendMessage(JSON.stringify(info));
      setInputValue(''); // 清空输入框
    }
  };

  // 请求最近的聊天记录
  const getLogs = async () => {
    if (ws.current && ws.current.getReadyState() === WebSocket.OPEN) {
      const info = {
        content: '',
        sendUserName: nickName,
        sendUserId: nickId,
        sendRoomId: roomId,
        sendRoomName: roomName,
        sendTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        type: 'query-logs',
      };
      ws.current.sendMessage(JSON.stringify(info));
    }
  };

  if (loading) {
    return <Spin loading={loading} />;
  }

  // 渲染 聊天记录
  const renderLog = () => {
    return logs.map((item, idx) => {
      const { log_user_name, log_content, log_time } = item;
      if (log_user_name === 'system') {
        return (
          <div key={`${log_time}_${idx}`} className="room-logs-item">
            <div className="room-logs-item-system">
              <div className="room-logs-item-system-content">{log_content}</div>
            </div>
          </div>
        );
      }
      return (
        <div key={`${log_time}_${idx}`} className="room-logs-item">
          <div className="room-logs-item-head">
            <div className="room-logs-item-head-user">{log_user_name}</div>
            <div className="room-logs-item-head-time">{log_time}</div>
          </div>
          <div className="room-logs-item-content">{log_content}</div>
        </div>
      );
    });
  };

  // 渲染 用户
  const renderMember = () => {
    return onlineMembers.map((item) => {
      const { user_name, head_num } = item;
      return (
        <div key={user_name} className="room-members-item">
          <div className="room-members-item-head one-img">
            <img src={`/head_${head_num || 1}.png`} />
          </div>
          <div className="room-members-item-name shine-text">
            <Abbr text={user_name} />
          </div>
        </div>
      );
    });
  };

  // 渲染 顶部 用户
  const renderTopMember = () => {
    return onlineMembers.map((item) => {
      const { user_name, head_num } = item;
      return (
        <div key={user_name} className="room-members-item">
          <Tooltip title={user_name}>
            <div className="room-members-item-head one-img">
              <img src={`/head_${head_num || 1}.png`} />
            </div>
          </Tooltip>
        </div>
      );
    });
  };

  return (
    <div className="room-page">
      <div className="room-page-container">
        <div className="room-top-members">{renderTopMember()}</div>
        <div className="room-main">
          <div className="room-logs-container">
            <div className="room-logs-container-title">
              <div className="room-logs-container-title-content">
                <span>{`欢迎来到   ${roomName}   聊天室`}</span>
                <div className="star-img one-img">
                  <img src="/star.png" />
                  <img src="/star.png" />
                  <img src="/star.png" />
                </div>
              </div>
              <div
                className="room-logs-container-title-exit one-img"
                onClick={() => {
                  navigate('/home');
                  if (ws.current) {
                    ws.current.closeWebSocket();
                  }
                }}
              >
                <img src="/exit.png" />
              </div>
            </div>
            <div className="room-logs" ref={logsContanierRef}>
              {renderLog()}
            </div>
          </div>
          <div className="room-members">{renderMember()}</div>
        </div>
        <div className="room-user">
          <div className="room-user-info">
            <div className="room-user-info-label">
              <div className="user-icon one-img">
                <img src="/user.png" />
              </div>
              <div className="room-user-info-name  shine-text">{nickName}</div>
            </div>
            <div className="clickable get-logs ">
              <Tooltip title="获取最近200条聊天记录">
                <img src="/link.png" onClick={() => getLogs()} />
              </Tooltip>
              <Tooltip title="清空聊天记录">
                <img src="/delete.png" onClick={() => setLogs([])} />
              </Tooltip>
            </div>
          </div>
          <div className="room-user-input">
            <Input.TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              rows={4}
              placeholder="请输入聊天内容"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <div className="send-icon one-img" onClick={() => sendMessage()}>
              <img src="/send.png" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
