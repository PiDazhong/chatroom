/**
 * @des 概念板块 card 页面
 */

import React, { useEffect, useState } from 'react';
import * as _ from 'lodash';
import { Table } from 'antd';
import PinyinEngine from 'pinyin-engine';
import { ReloadOutlined } from '@ant-design/icons';
import { fetchRequest } from 'utils';
import DebounceInput from 'components/DebounceInput';
import Abbr from 'components/Abbr';
import useElementHeight from 'hooks/useElementHeight';

import './index.scss';

const LogsTable = () => {
  // 模糊查询
  const [searchText, setSearchText] = useState('');
  // list
  const [tableList, setTableList] = useState([]);
  // loading
  const [loading, setLoading] = useState(false);

  // 表格的高度
  const tableHeight = useElementHeight('log-table-card-el-card', true);

  const getTableListFilter = () => {
    return _.filter(tableList, (t) => {
      if (!searchText) {
        return true;
      }
      const engine = new PinyinEngine([t], ['log_room_name', 'log_content']);
      const pinyin = engine?.query(searchText?.toLowerCase());
      const pinyinFilter = pinyin?.length > 0;
      return (
        pinyinFilter ||
        t.log_room_name?.includes(searchText) ||
        t.log_content?.includes(searchText)
      );
    });
  };

  // 获取 板块表内的数据
  const handleGetTableList = async () => {
    setLoading(true);
    const { data } = await fetchRequest(
      '/mysql/getLoginLog',
      'get',
      {},
      setLoading,
    );
    setTableList(data || []);
    setLoading(false);
  };

  useEffect(() => {
    handleGetTableList();
  }, []);

  const getColumns = () => {
    return [
      {
        width: 50,
        key: 'index',
        title: '序号',
        dataIndex: 'index',
        render: (text, record, index) => (
          <div className="index-num-line">{Number(index) + 1}</div>
        ),
      },
      {
        width: 180,
        key: 'log_user_name',
        title: '用户名称',
        dataIndex: 'log_user_name',
        render: (text, record) => (
          <div className="bk-name-line">
            <Abbr
              text={_.head(_.split(record.log_content, ' '))}
              highLightText={searchText}
            />
          </div>
        ),
      },
      {
        width: 180,
        key: 'log_room_name',
        title: '房间名称',
        dataIndex: 'log_room_name',
        render: (text, record) => (
          <div className="bk-name-line">
            <Abbr text={text} highLightText={searchText} />
          </div>
        ),
      },
      {
        width: 180,
        key: 'log_content',
        title: '操作',
        dataIndex: 'log_content',
        render: (text) => {
          const isLogin = text?.includes('进入');
          const content = isLogin ? '进入房间' : '离开房间';
          return <div className="bk-code-line">{content}</div>;
        },
      },
      {
        width: 180,
        key: 'log_time',
        title: '时间',
        dataIndex: 'log_time',
        render: (text) => <div className="bk-code-line">{text}</div>,
      },
    ].filter(Boolean);
  };

  return (
    <div className="log-table-card-el-card z-index10">
      <div className="card-head">
        <div className="card-head-title">登录日志</div>
        <div className="card-head-action">
          <DebounceInput
            value={searchText}
            onChange={setSearchText}
            placeholder="模糊查询"
          />
          <ReloadOutlined onClick={() => handleGetTableList()} />
        </div>
      </div>
      <div className={`card-content no-padding`}>
        <Table
          className="log-table-card-table"
          rowKey={(t) => t.log_id}
          loading={loading}
          columns={getColumns()}
          dataSource={getTableListFilter()}
          scroll={{ y: tableHeight - 80 }}
          pagination={false}
          bordered={true}
          virtual={true}
          size="small"
        />
      </div>
    </div>
  );
};

export default LogsTable;
