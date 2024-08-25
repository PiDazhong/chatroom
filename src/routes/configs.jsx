/**
 * @des 路由配置
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import LogsTable from 'pages/LogsTable';
import Room from 'pages/Room';
import Home from 'pages/index';

const getRouterConfigs = () => {
  return [
    {
      key: 'root',
      path: '/',
      element: <Navigate to="/home" />,
    },
    {
      key: 'home',
      name: '首页',
      path: '/home',
      element: <Home />,
    },
    {
      key: 'room',
      name: '用户管理',
      path: '/room',
      element: <Room />,
    },
    {
      key: 'logs',
      name: '用户管理',
      path: '/logs',
      element: <LogsTable />,
    },
  ];
};

export default getRouterConfigs;
