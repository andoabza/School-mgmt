import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message } from 'antd';
import api from '../axiosConfig.js';
import { useUser } from '../context/userContext';

const ClassroomManagement = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingClassroom, setEditingClassroom] = useState(null);
  const { user } = useUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const response = await api.get('/classrooms');
      setClassrooms(response.data);
    } catch (error) {
      message.error('Failed to fetch classrooms');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingClassroom) {
        await api.put(`/classrooms/${editingClassroom.id}`, values);
        message.success('Classroom updated successfully');
      } else {
        await api.post('/classrooms', values);
        message.success('Classroom created successfully');
      }
      
      form.resetFields();
      setIsModalVisible(false);
      setEditingClassroom(null);
      fetchClassrooms();
    } catch (error) {
      message.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (classroom) => {
    setEditingClassroom(classroom);
    form.setFieldsValue(classroom);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/classrooms/${id}`);
      message.success('Classroom deleted successfully');
      fetchClassrooms();
    } catch (error) {
      message.error('Failed to delete classroom');
    }
  };

  const columns = [
    {
      title: 'Room Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Building',
      dataIndex: 'building',
      key: 'building',
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        isAdmin && (
          <span>
            <Button type="link" onClick={() => handleEdit(record)}>Edit</Button>
            <Button type="link" danger onClick={() => handleDelete(record.id)}>Delete</Button>
          </span>
        )
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Classroom Management</h1>
        {isAdmin && (
          <Button type="primary" onClick={() => setIsModalVisible(true)}>
            Add New Classroom
          </Button>
        )}
      </div>

      <Table 
        columns={columns} 
        dataSource={classrooms} 
        rowKey="id" 
        bordered
      />

      <Modal
        title={editingClassroom ? 'Edit Classroom' : 'Add New Classroom'}
        visible={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingClassroom(null);
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Room Name"
            rules={[{ required: true, message: 'Please input room name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="building"
            label="Building"
            rules={[{ required: true, message: 'Please input building' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="capacity"
            label="Capacity"
            rules={[{ required: true, message: 'Please input capacity' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClassroomManagement;