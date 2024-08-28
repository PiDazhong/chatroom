import React, { useState } from 'react';
import MultiSelect from './index';

const MemoEl = () => {
  const [value, setValue] = useState([]);

  return (
    <div style={{ marginLeft: 200 }}>
      <MultiSelect
        style={{ width: 300 }}
        placeholder="请选择..."
        selectedBefore={true}
        maxTagCount={1}
        allowClear={true}
        value={value}
        onChange={(val) => setValue(val || [])}
        options={new Array(100).fill(0).map((_, index) => ({
          label: `第 ${index + 1} 项`,
          value: index + 1,
          des: `des ${index + 1}`,
        }))}
        renderLengthLimit={20}
      />
    </div>
  );
};

export default MemoEl;
