/**
 * @des 新建股票 弹窗
 */

import React, { useEffect, useState } from 'react';
import * as _ from 'lodash';
import { Modal, Form, Input, message, Select, Collapse } from 'antd';
import dayjs from 'dayjs';
import { fetchRequest } from 'utils';
import './index.scss';
import { MotoTypeOptions } from './index';

const AddMotoLogModal = ({ visible, curMoto, onCancel, onOk }) => {
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();

  const handleOnOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        const params = {
          curMoto,
          total_mile: values.total_mile,
          cost: values.cost,
        };
        setLoading(true);
        const { success } = await fetchRequest('/mysql/addMotoLog', {
          method: 'post',
          body: {
            ...params,
          },
        });
        setLoading(false);
        if (success) {
          message.success('新建成功');
          if (onOk) {
            onOk();
          }
        }
      })
      .catch((e) => {
        console.error(e);
      });
  };

  return (
    <Modal
      title={'新建记录'}
      open={visible}
      onOk={handleOnOk}
      onCancel={onCancel}
      okButtonProps={{ loading }}
      maskClosable={false}
    >
      <Form
        form={form}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        initialValues={{
          curMoto,
        }}
      >
        <Form.Item
          label="当前摩托"
          name="curMoto"
          rules={[{ required: true, message: '必填项' }]}
        >
          <Select options={MotoTypeOptions} disabled />
        </Form.Item>
        <Form.Item
          label="当前里程"
          name="total_mile"
          rules={[{ required: true, message: '必填项' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="此次消费"
          name="cost"
          rules={[{ required: true, message: '必填项' }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddMotoLogModal;
