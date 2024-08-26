/**
 * @des 公共方法
 */

import { message } from 'antd';
import _ from 'lodash';
import qs from 'query-string';
import { createBrowserHistory } from 'history';
import fetchManager from 'components/FetchManager';

export const browserHistory = createBrowserHistory({ window });

// 请求接口的方法
export const fetchRequest = async (url, options = {}) => {
  return await fetchManager.fetchRequest(url, {
    method: options.method,
    body: options.body,
    timeout: 10000,
    onWarning: (warningMessage) => {
      message.warning({ content: warningMessage, key: String(warningMessage) });
    },
    onError: (errorMessage) => {
      message.error({ content: errorMessage, key: String(errorMessage) });
    },
    onLogin: () => {
      browserHistory.push('/login');
    },
  });
};
