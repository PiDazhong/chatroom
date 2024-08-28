import React, { useState } from 'react';
import DayNightSwitch from './index';

const MemoEl = () => {
  const [value, setValue] = useState(true);

  const [value2, setValue2] = useState(false);

  return (
    <div style={{ textAlign: 'center' }}>
      <DayNightSwitch value={value} onChange={setValue} />
      <br />
      <DayNightSwitch value={value2} onChange={setValue2} />
    </div>
  );
};

export default MemoEl;
