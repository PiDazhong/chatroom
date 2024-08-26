import { useState, useEffect } from 'react';
import { Button, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { fetchRequest } from 'utils';
import HeadSelect from 'components/HeadSelect';
import useUrlParams from 'hooks/useUrlParams';
import './index.scss';

const Home = () => {
  let navigate = useNavigate();

  const { chatroom } = useUrlParams();

  const chatroomLocal = localStorage.getItem('quantanalysis_chatroom_data');
  const chatroomLocalData = JSON.parse(chatroomLocal || '{}');
  const { nickName: nickNameLocal, headNum: headNumLocal } = chatroomLocalData;

  // 聊天室名称
  const [chatroomName, setChatroomName] = useState(chatroom);
  // 昵称
  const [nickName, setNickName] = useState(nickNameLocal || '');
  // 头像
  const [headNum, setHeadNum] = useState(headNumLocal || 1);
  // roomNum
  const [roomNum, setRoomNum] = useState('');

  useEffect(() => {
    querySuccessCount();
  }, []);

  // 获取 聊天室 的数量
  const querySuccessCount = async () => {
    try {
      const { success, data } = await fetchRequest('/mysql/getRoomNums', {
        method: 'get',
      });
      if (success) {
        setRoomNum(data);
      } else {
        setRoomNum(0);
      }
    } catch (e) {
      setRoomNum(0);
    }
  };

  // 根据 聊天室 和 当前昵称  登录
  const handleLogin = async () => {
    if (!nickName) {
      message.warning('昵称不能为空');
      return;
    }
    if (!chatroomName) {
      message.warning('聊天室名称不能为空');
      return;
    }
    try {
      const { success, data } = await fetchRequest('/mysql/createChatroom', {
        method: 'post',
        body: {
          chatroomName,
          nickName,
          headNum,
        },
      });
      if (success) {
        const { chatroomId, nickId } = data;
        // 将 返回回来的 id 存入本地 localstorage
        localStorage.setItem(
          'quantanalysis_chatroom_data',
          JSON.stringify({
            nickId,
            nickName,
            headNum,
          }),
        );
        // 跳转到聊天室
        navigate(`/room?roomId=${chatroomId}&userId=${nickId}`);
      }
    } catch (e) {
      // message.error('创建失败');
      console.error(e);
    }
  };

  return (
    <div className="home-page">
      <div className="home-page-bg">
        <img src="/chatroom-bg.png" alt="chatroom" />
      </div>
      <div className="home-page-login">
        <div className="title-item">
          <img src="/favicon.ico" alt="Certificate" />
          <div className="title-item-label">ChatRoom</div>
        </div>
        {/* <div className="success-result-item">
          当前已提供
          <span className="success-count">{roomNum}</span>
          个chatroom
        </div> */}
        <div className="line-item">
          <div className="line-item-content">
            <Input
              placeholder="请输入你想进入的 Room Name"
              value={chatroomName}
              onChange={(e) => setChatroomName(e.target.value)}
            />
          </div>
        </div>
        <div className="line-item">
          <div className="line-item-content">
            <Input
              placeholder="请输入你想使用的昵称"
              value={nickName}
              onChange={(e) => setNickName(e.target.value)}
            />
          </div>
        </div>
        <div className="line-item">
          <div className="line-item-content">
            <HeadSelect value={headNum} onChange={(val) => setHeadNum(val)} />
          </div>
        </div>

        <div className="line-item">
          <div className="line-item-content">
            <Button
              htmlType="submit"
              className="login-form-button"
              onClick={() => handleLogin()}
            >
              Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
