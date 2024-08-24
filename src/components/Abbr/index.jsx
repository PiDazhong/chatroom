/**
 * @des 自动缩略文本组件
 */
import React, { useRef, useState } from 'react';
import * as _ from 'lodash';
import { Tooltip } from 'antd';
import Highlight from './HighLight';

const Abbr = ({ text, className, highLightText }) => {
  const spanRef = useRef(null);

  const [visible, setVisible] = useState(false);

  const handleCheckOver = () => {
    if (spanRef.current) {
      return spanRef.current.scrollHeight > spanRef.current.clientHeight;
    }
    return false;
  };

  const handleVisibleChange = (vis) => {
    if (vis) {
      if (handleCheckOver()) {
        setVisible(true);
      }
    } else {
      setVisible(false);
    }
  };

  return (
    <Tooltip open={visible} onOpenChange={handleVisibleChange} title={text}>
      <span
        ref={spanRef}
        style={{
          WebkitLineClamp: 1,
          lineHeight: 'inherit',
          display: '-webkit-box',
          overflow: 'hidden',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          '-webkit-box-orient': 'vertical',
          hyphens: 'auto',
        }}
        className={className ?? ''}
      >
        <Highlight text={text} highLightText={highLightText} />
      </span>
    </Tooltip>
  );
};

export default Abbr;
