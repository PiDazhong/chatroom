/**
 * @des 路由
 */
import React from 'react';
import { Routes, Route, Router } from 'react-router-dom';
import _ from 'lodash';
import { browserHistory } from 'utils';
import getRouterConfigs from './configs';

export function BrowserRouter({ basename, children }) {
  const historyRef = React.useRef(browserHistory);

  const history = historyRef.current;
  const [state, setState] = React.useState({
    action: history.action,
    location: history.location,
  });

  React.useLayoutEffect(() => {
    const removeListener = history.listen(setState);
    return () => {
      removeListener();
    };
  }, [history]);

  return (
    <Router
      basename={basename}
      location={state.location}
      navigationType={state.action}
      navigator={history}
    >
      {children}
    </Router>
  );
}

// 中间件
const LayoutMiddle = () => {
  return (
    <Routes>
      {getRouterConfigs().map((item) => {
        const { key, path, element } = item;
        return <Route key={key} path={path} element={element} />;
      })}
      <Route path="/*" element={<div>路由错误...</div>} />
    </Routes>
  );
};

// 路由配置页面
const RoutePage = () => {
  return (
    <BrowserRouter>
      <LayoutMiddle />
    </BrowserRouter>
  );
};

export default RoutePage;
