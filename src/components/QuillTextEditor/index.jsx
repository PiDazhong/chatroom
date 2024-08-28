/**
 * @des 自定义 QuillTextEditor 组件
 * @des-url https://www.quantanalysis.cn/icons/components/QuillTextEditor.png
 */

import React, { useEffect, useRef } from 'react';
import classnames from 'classnames';
import Quill, { RangeStatic } from 'quill';
import { isDelta, isValuesEqual } from './utils';
import 'quill/dist/quill.snow.css';
import 'quill/dist/quill.bubble.css';
// import './index.scss';

const QuillTextEditor = (props) => {
  const {
    theme = 'snow',
    className,
    value,
    onChange,
    bounds,
    modules,
    placeholder = '请输入',
    readOnly,
  } = props;

  // 创建一个ref来存储editor的DOM元素
  const contanierRef = useRef(null);
  // 存储Quill实例的ref
  const quillRef = useRef(null);

  // 设置编辑器的内容，但不触发onChange
  const silentUpdate = (content) => {
    const editor = quillRef.current;
    if (isDelta(value)) {
      editor.setContents(value);
    } else if (typeof value === 'string') {
      editor.setContents(editor.clipboard.convert(content));
    }
  };

  useEffect(() => {
    if (contanierRef.current) {
      const editor = new Quill(contanierRef.current, {
        theme,
        modules,
        placeholder,
        readOnly: false,
        bounds,
      });
      quillRef.current = editor;

      // 初始加载时设置内容
      silentUpdate(value);

      // 注册编辑器的变更回调函数
      const handleChange = () => {
        const currentContent = editor.root.innerHTML;
        onChange?.(currentContent);
      };

      // 注册 编辑器的改变回调函数   调用传入的onChange回调函数，传递当前内容
      editor.on('text-change', handleChange);
      return () => {
        editor.off('text-change', handleChange);
      };
    }
  }, []);

  // 当外部控制的value改变时，更新编辑器内容
  useEffect(() => {
    if (quillRef.current && !isValuesEqual(value, getEditorInnerHtml())) {
      const selection = quillRef.current.getSelection(); // 保存当前的选择区域
      quillRef.current.setContents(
        quillRef.current.clipboard.convert(value),
        'silent',
      );
      if (selection) {
        // 如果有选区，恢复选区
        quillRef.current.setSelection(selection);
      }
    }
  }, [value]);

  useEffect(() => {
    if (quillRef.current) {
      if (readOnly) {
        quillRef.current?.disable();
      } else {
        quillRef.current?.enable();
      }
    }
  }, [readOnly]);

  // 获取编辑器内部 html 元素内容
  const getEditorInnerHtml = () => {
    return quillRef.current?.root.innerHTML;
  };

  return (
    <div
      className={classnames('quill-text-editor ql-editor-container', className)}
    >
      <div ref={contanierRef} />
    </div>
  );
};

export default QuillTextEditor;
