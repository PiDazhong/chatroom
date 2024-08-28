/**
 * @des  防抖输入
 * @des-url https://www.quantanalysis.cn/icons/components/DebounceInput.png
 */
import React, { useCallback, useState, useEffect } from 'react';
import { Input } from 'antd';
import _ from 'lodash';

const DebounceInput = ({
  value,
  onChange,
  placeholder,
  delay = 300,
  disabled,
  className,
  style = {},
}) => {
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const debounceSearch = useCallback(
    _.debounce((val) => {
      onChange(val);
    }, delay),
    [delay, onChange],
  );

  const handleOnChange = (e) => {
    const val = e.target.value;
    setText(val);
    debounceSearch(val);
  };

  return (
    <Input
      className={className}
      style={style}
      value={text}
      onChange={handleOnChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
};

export default DebounceInput;
