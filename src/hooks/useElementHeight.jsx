/**
 * @des 自定义Hook，根据传入的classname返回对应DOM元素的高度。
 */

import { useState, useEffect } from 'react';
import _ from 'lodash';

/**
 * @param {string} className - 要获取高度的DOM元素的classname。
 * @return {number} - DOM元素的高度。
 */
function useElementHeight(className, show = true) {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    // 查找DOM元素
    const element = _.isString(className)
      ? document.querySelector(`.${className}`)
      : className;
    if (element) {
      // 获取并设置元素高度
      const elementHeight = element.offsetHeight;
      setHeight(elementHeight);
    }

    // 创建一个函数来响应窗口大小的变化
    const handleResize = () => {
      if (element) {
        const updatedHeight = element.offsetHeight;
        setHeight(updatedHeight);
      }
    };

    // 添加窗口大小变化监听器
    window.addEventListener('resize', handleResize);

    // 组件卸载时移除事件监听器
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [className, show]); // 依赖项列表中包括className，以便于className变化时重新执行

  return height;
}

export default useElementHeight;
