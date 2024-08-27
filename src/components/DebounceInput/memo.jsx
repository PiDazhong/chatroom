import React, { useState } from 'react';
import _ from 'lodash';
import DebounceInput from './index';

const MemoPage = () => {
  const [text, setText] = useState('');

  return (
    <DebounceInput value={text} onChange={setText} placeholder={'请输入'} />
  );
};

export default MemoPage;
