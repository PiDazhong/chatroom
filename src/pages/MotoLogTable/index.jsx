/**
 * @des 概念板块 card 页面
 */

import React, { useEffect, useState } from 'react';
import * as _ from 'lodash';
import { Table, Select, Button } from 'antd';
import PinyinEngine from 'pinyin-engine';
import { ReloadOutlined } from '@ant-design/icons';
import { fetchRequest } from 'utils';
import DebounceInput from 'components/DebounceInput';
import Abbr from 'components/Abbr';
import useElementHeight from 'hooks/useElementHeight';

import './index.scss';
import AddMotoLogModal from './AddMotoLogModal';

export const MotoTypeOptions = [
  {
    value: 'UHR150',
    label: 'UHR150',
  },
  {
    value: 'CLC450',
    label: 'CLC450',
  },
];

const MotoLogTable = () => {
  // 当前摩托
  const [curMoto, setCurMoto] = useState('UHR150');
  // list
  const [tableList, setTableList] = useState([]);
  // loading
  const [loading, setLoading] = useState(false);

  const [visible, setVisible] = useState(false);

  // 表格的高度
  const tableHeight = useElementHeight('moto-log-table-card-el-card', true);

  // 获取
  const handleGetTableList = async (moto) => {
    setLoading(true);
    const { data } = await fetchRequest('/mysql/getMotoLog', {
      method: 'post',
      body: {
        curMoto: moto,
      },
    });
    setTableList(data || []);
    setLoading(false);
  };

  useEffect(() => {
    handleGetTableList(curMoto);
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
        width: 80,
        key: 'mile',
        title: '此次里程',
        dataIndex: 'mile',
        render: (text, record) => (
          <div className="bk-code-line">
            <Abbr text={text} />
          </div>
        ),
      },
      {
        width: 80,
        key: 'cost',
        title: '此次消费',
        dataIndex: 'cost',
        render: (text, record) => (
          <div className="bk-code-line">
            <Abbr text={text} />
          </div>
        ),
      },
      {
        width: 80,
        key: 'total_mile',
        title: '总里程',
        dataIndex: 'total_mile',
        render: (text, record) => (
          <div className="mile-name-line">
            <Abbr text={text} />
          </div>
        ),
      },
      {
        width: 80,
        key: 'total_cost',
        title: '总消费',
        dataIndex: 'total_cost',
        render: (text, record) => (
          <div className="cost-name-line">
            <Abbr text={text} />
          </div>
        ),
      },
      {
        width: 200,
        key: 'time',
        title: '时间',
        dataIndex: 'time',
        render: (text, record) => (
          <div className="bk-name-line">
            <Abbr text={text} />
          </div>
        ),
      },
    ].filter(Boolean);
  };

  return (
    <div className="moto-log-table-card-el-card z-index10">
      <div className="card-head">
        <div className="card-head-title">摩托日志</div>
        <div className="card-head-action">
          <Select
            value={curMoto}
            onChange={(val) => {
              setCurMoto(val || '');
              handleGetTableList(val || '');
            }}
            options={MotoTypeOptions}
            allowClear={true}
          />
          <Button type="default" onClick={() => setVisible(true)}>
            新增
          </Button>
          <ReloadOutlined onClick={() => handleGetTableList(curMoto)} />
        </div>
      </div>
      <div className={`card-content no-padding`}>
        <Table
          className="log-table-card-table"
          rowKey={(t) => t.log_id}
          loading={loading}
          columns={getColumns()}
          dataSource={tableList}
          scroll={{ y: tableHeight - 80 }}
          pagination={false}
          bordered={true}
          virtual={true}
          size="small"
        />
      </div>
      {visible && (
        <AddMotoLogModal
          curMoto={curMoto}
          visible={visible}
          onOk={() => {
            setVisible(false);
            handleGetTableList(curMoto);
          }}
          onCancel={() => setVisible(false)}
        />
      )}
    </div>
  );
};

export default MotoLogTable;
