import React, { useState } from 'react';
import QuillTextEditor from './index';

const MemoEl = () => {
  const [text, setText] = useState('');

  return (
    <QuillTextEditor
      className="day-book-quill"
      value={text}
      onChange={setText}
      // onChangeSelection={handleOnChangeSelection}
      readOnly={false}
      bounds={`.ql-editor-container`}
      modules={{
        // syntax: true,
        toolbar: {
          container: [
            // [{ 'header': 1 }, { 'header': 2 }], // 标题 —— 独立平铺
            // [{header: [1, 2, 3, 4, 5, 6, false]}], // 标题 —— 下拉选择
            // [{size: ["small", false, "large", "huge"]}], // 字体大小
            [{ list: 'ordered' }, { list: 'bullet' }], // 有序、无序列表
            // ["blockquote", "code-block"], // 引用  代码块
            ['blockquote'], // 引用  代码块
            // 链接按钮需选中文字后点击
            // ["link", "image", "video"], // 链接、图片、视频
            ['link', 'image'], // 链接、图片、视频
            [{ align: [] }], // 对齐方式// text direction
            // [{indent: "-1"}, {indent: "+1"}], // 缩进
            // ["bold", "italic", "underline", "strike"], // 加粗 斜体 下划线 删除线
            ['bold', 'underline', 'strike'], // 加粗 斜体 下划线 删除线
            [{ color: [] }, { background: [] }], // 字体颜色、字体背景颜色
            // [{'script': 'sub'}, {'script': 'super'}],      // 下标/上标
            // [{'font': []}],//字体
            ['clean'], // 清除文本格式
          ],
        },
      }}
    />
  );
};

export default MemoEl;
