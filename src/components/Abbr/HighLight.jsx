/**
 * @des 高亮文本组件
 */
import React from 'react';
import * as _ from 'lodash';

const Highlight = ({ text, highLightText }) => {
  if (!highLightText) {
    return <span>{text}</span>;
  }

  if (!_.isString(text)) {
    return <span>{text}</span>;
  }

  const parts = text.split(new RegExp(`(${highLightText})`, 'gi'));

  return (
    <span>
      {parts.map((part, index) =>
        part.toLowerCase() === highLightText.toLowerCase() ? (
          <span
            key={index}
            style={{ backgroundColor: 'var(--brand80)', color: 'var(--white)' }}
          >
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
};

export default Highlight;
