import React from 'react';
import Abbr from './index';
import _ from 'lodash';

const MemoEl = () => {
  const text = '这是一段测试文字：内容是什么无所谓';

  const searchText = '文字：内容';

  return <Abbr text={text} highLightText={searchText} />;
};

export default MemoEl;
