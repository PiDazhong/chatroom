import React, { useState } from 'react';
import _ from 'lodash';
import DebounceInput from './index';

const MemoEl = () => {
  const [text, setText] = useState('');

  return (
    <div>
      <div>当前输入内容：{text}</div>
      <br />
      <DebounceInput
        style={{ width: 200 }}
        value={text}
        onChange={setText}
        placeholder={'请输入'}
      />
    </div>
  );
};

export default MemoEl;
