interface Props {
  /** value */
  value: boolean;

  /** onChange */
  onChange: (v) => void;

  /** 选择框类名 */
  className: string;

  /** 下拉框类名 */
  popupClassName?: string;

  /** options */
  options: any[];

  /** 开启虚拟列表 */
  isVirtual?: boolean;

  /** 渲染数量限制 */
  renderLengthLimit?: number;

  /** 选中项目自动提到最前面 */
  selectedBefore?: boolean;

  /** 其他继承 antd-select 的参数 */
  wraps?: any;
}
