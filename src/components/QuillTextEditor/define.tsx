interface Props {
  /** 文本值 */
  value: string;

  /** onChange */
  onChange: (v: string) => void;

  /** 类名 */
  className: string;

  /** 挂载的dom的选择器 */
  bounds?: string;

  /** 主题 */
  theme: string;

  /** 配置项目 */
  modules?: any;

  /** placeholder */
  placeholder?: string;

  /** 只读 */
  readOnly?: boolean;
}
