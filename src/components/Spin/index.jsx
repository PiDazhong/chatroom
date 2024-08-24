/**
 * @des 简单的 loading 组件
 */

import React from 'react';
import * as _ from 'lodash';
import classNames from 'classnames';
import './Spin.scss';

const Spin = ({
  dotNum = 36,
  dotSize = 6,
  size = 100,
  delay = 1500,
  loading,
  children,
  className,
}) => {
  return (
    <div className={classNames('custom-spin', className)}>
      {children}
      {loading && (
        <div className="custom-spin-loading">
          {new Array(dotNum).fill(0).map((v, i) => (
            <div
              key={i}
              className="dot-item"
              style={{
                width: dotSize,
                height: dotSize,
                marginLeft: -dotSize / 2,
                marginTop: -dotSize / 2,
                transform: `rotate(${(i * 360) / dotNum}deg) translateY(${size / 2}px)`,
              }}
            >
              <div
                className="before"
                style={{
                  animation: `blackMove ${delay}ms infinite`,
                  animationDelay: `-${(i * 6 * delay) / dotNum}ms`,
                }}
              />
              <div
                className="after"
                style={{
                  animation: `whiteMove ${delay}ms infinite`,
                  animationDelay: `-${(i * 6 * delay) / dotNum}ms`,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Spin;
