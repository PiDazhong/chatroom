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
      const engine = new PinyinEngine([t], ['time', 'path']);
      const pinyin = engine?.query(searchText?.toLowerCase());
      const pinyinFilter = pinyin?.length > 0;
      return (
        pinyinFilter ||
        t.path?.includes(searchText) ||
        t.time?.includes(searchText)
      );
    });
  };

  // 获取
  const handleGetTableList = async () => {
    setLoading(true);
    const { data } = await fetchRequest('/mysql/getBlogVisitRecord', {
      method: 'get',
    });
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
        width: 200,
        key: 'time',
        title: '时间',
        dataIndex: 'time',
        render: (text, record) => (
          <div className="bk-name-line">
            <Abbr text={text} highLightText={searchText} />
          </div>
        ),
      },
      {
        width: 120,
        key: 'browser',
        title: '浏览器',
        dataIndex: 'browser',
        render: (text, record) => (
          <div className="bk-code-line">
            <Abbr text={text} />
          </div>
        ),
      },
      {
        width: 120,
        key: 'device',
        title: '设备',
        dataIndex: 'device',
        render: (text, record) => (
          <div className="bk-code-line">
            <Abbr text={text} />
          </div>
        ),
      },
      {
        width: 120,
        key: 'os',
        title: '系统',
        dataIndex: 'os',
        render: (text, record) => (
          <div className="bk-code-line">
            <Abbr text={text} />
          </div>
        ),
      },
      {
        width: 280,
        key: 'path',
        title: '页面',
        dataIndex: 'path',
        render: (text, record) => (
          <div className="bk-code-line path-line">
            <Abbr text={text} />
          </div>
        ),
      },
    ].filter(Boolean);
  };

  return (
    <div className="blog-table-card-el-card z-index10">
      <div className="card-head">
        <div className="card-head-title">访问日志</div>
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
