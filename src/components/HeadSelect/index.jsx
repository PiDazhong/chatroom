/**
 * @des 选中头像
 */

import React from 'react';
import './HeadSelect.scss';

const HeadSelect = ({ value, onChange }) => {
  return (
    <div className="head-select-el">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((val) => {
        return (
          <div
            key={val}
            className={`head-item ${value === val ? 'active' : ''}`}
          >
            <img
              src={`/head_${val}.png`}
              alt="head"
              onClick={() => onChange(val)}
            />
          </div>
        );
      })}
    </div>
  );
};

export default HeadSelect;
