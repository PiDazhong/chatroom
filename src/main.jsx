import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import RoutePage from 'routes/index';

import './_global.scss';
import './_overhide.scss';

// 全局对象，用于调试信息输出
Object.defineProperty(window, 'DEBUG_INFO', {
  get: function () {
    const projectStr = `/      chatroom 相关信息:                               /`;
    const githubStr = `/      项目地址：https://github.com/PiDazhong/chatroom  /`;
    const chatroomStr = `/      部署地址：https://chatroom.quantanalysis.cn      /`;
    const authorStr = `/      作者vx: pdz_wechat                              /`;
    const lineStr = `- - - - - - - - - - - - - - - - - - - - - - - - - - - -`;
    return `${lineStr}\n${projectStr}\n\n${githubStr}\n\n${chatroomStr}\n\n${authorStr}\n\n${lineStr}\n`;
  },
});

console.log(window['DEBUG_INFO']);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RoutePage />
  </StrictMode>,
);
