/**
 * @des 房间
 */

import { useState, useRef, useEffect } from 'react';
import { Button, Input, message } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useNavigate } from 'react-router-dom';
import { fetchRequest } from 'utils';
import Spin from 'components/Spin';
import Abbr from 'components/Abbr';
import useUrlParams from '../useUrlParams';
import './Room.scss';

const Room = () => {
  const [loading, setLoading] = useState(true);

  const chatroomLocal = localStorage.getItem('quantanalysis_chatroom_data');
  const chatroomLocalData = JSON.parse(chatroomLocal || '{}');

  let navigate = useNavigate();

  const { nickId, nickName } = chatroomLocalData;

  const { roomId } = useUrlParams();

  // 当前的 websocket 实例
  const ws = useRef(null);
  // 当前输入框的值
  const [inputValue, setInputValue] = useState('');
  // 当前聊天室的聊天记录
  const [logs, setLogs] = useState([]);
  // 在线的人
  const [onlineMembers, setOnlineMembers] = useState([]);
  // 房间名
  const [roomName, setRoomName] = useState('');

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

  useEffect(() => {
    validate();
    getRoomInfo();
  }, []);

  // 处理 接受到的消息
  const handleReciveMessage = (dataStr) => {
    const parseData = JSON.parse(dataStr);
    for (let item of parseData) {
      const { type, data } = item;
      if (type === 'logs') {
        setLogs(data);
      }
      if (type === 'members') {
        setOnlineMembers(data);
      }
      if (type === 'message') {
        setLogs((prev) => [...prev, data]);
      }
    }
  };

  useEffect(() => {
    // 创建 websocket 连接
    ws.current = new WebSocket(`/ws?roomId=${roomId}&nickId=${nickId}`);

    // 连接成功
    ws.current.onopen = () => {
      message.success({ content: '聊天室连接成功', key: 'success-connect' });
    };

    // 接收到消息
    ws.current.onmessage = (event) => {
      handleReciveMessage(event.data);
    };

    // 连接关闭
    ws.current.onclose = () => {
      message.success({ content: '聊天室断开连接', key: 'success-close' });
    };

    // 连接错误
    ws.current.onerror = (error) => {
      console.log('WebSocket 连接错误', error);
      message.error({ content: '聊天室连接错误', key: 'success-failed' });
    };

    return () => {
      ws.current.close();
      ws.current = null;
    };
  }, []);

  const sendMessage = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const info = {
        content: inputValue,
        sendUserName: nickName,
        sendUserId: nickId,
        sendRoom: roomId,
        sendTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        type: 'message',
      };
      ws.current.send(JSON.stringify(info));
      setInputValue(''); // 清空输入框
    }
  };

  // 请求最近的聊天记录
  const getLogs = async () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const info = {
        content: '',
        sendUserName: nickName,
        sendUserId: nickId,
        sendRoom: roomId,
        sendTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        type: 'query-logs',
      };
      ws.current.send(JSON.stringify(info));
    }
  };

  if (loading) {
    return <Spin loading={loading} />;
  }

  return (
    <div className="room-page">
      <div className="room-page-container">
        <div className="room-main">
          <div className="room-logs-container">
            <div className="room-logs-container-title">{`欢迎来到  ${roomName} ChatRoom`}</div>
            <div className="room-logs">
              {logs.map((item) => {
                const { log_user_name, log_content, log_time } = item;
                return (
                  <div key={log_time} className="room-logs-item">
                    <div className="room-logs-item-head">
                      <div className="room-logs-item-head-user">
                        {log_user_name}
                      </div>
                      <div className="room-logs-item-head-time">{log_time}</div>
                    </div>
                    <div className="room-logs-item-content">{log_content}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="room-members">
            {onlineMembers.map((item) => (
              <div key={item.user_name} className="room-members-item">
                <div className="room-members-item-head">
                  <img src={`/head_${item.head_num || 1}.png`} />
                </div>
                <div className="room-members-item-name">
                  <Abbr text={item.user_name} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="room-user">
          <div className="room-user-info">
            <div className="room-user-info-label">当前身份:</div>
            <div>{nickName}</div>
          </div>
          <div className="room-user-input">
            <Input.TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              rows={4}
            />
          </div>
          <div className="room-user-button">
            <div>
              <Button type="primary" onClick={() => sendMessage()}>
                发送
              </Button>
              <Button type="primary" onClick={() => getLogs()}>
                请求最近的聊天记录
              </Button>
            </div>
            <Button type="primary" onClick={() => navigate('/')}>
              离开聊天室
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
