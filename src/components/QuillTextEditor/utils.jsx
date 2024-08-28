/**
 * @description 一些方法
 */

import _ from 'lodash';

/** 判断是否的 delta 格式 */
export const isDelta = (value) => {
  return value && value.ops;
};

// 函数来检查两个值是否相等，以避免重复更新
export const isValuesEqual = (v1, v2) => {
  if (isDelta(v1) && isDelta(v2)) {
    return _.isEqual(v1.ops, v2.ops);
  }
  return v1 === v2;
};
