import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Select, 
  DatePicker, 
  Upload, 
  message, 
  Card, 
  Steps,
  Divider,
  Typography,
  Modal
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined,
  SolutionOutlined,
  TeamOutlined,
  CalendarOutlined,
  BookOutlined,
  UploadOutlined,
  LockOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import api from '../axiosConfig';

const { Title, Text } = Typography;
const { Step } = Steps;
const { Option } = Select;

export default function Register() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const navigate = useNavigate();

  // Check admin role on mount
  useEffect(() => {
    const user = localStorage.getItem('user');
    // if (user.role != 'admin' ) {
    //   message.error('Only admins can access this page');
    //   navigate('/dashboard');
    // }
  }, [navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Add default password for all new users
      const payload = {
        ...values,
        birthDate: values.birthDate?.format('YYYY-MM-DD'),
        password: 'School@123' // Default password
      };

      const response = await api.post('/auth/register', payload);

      if (response.statusText == 'Ok') {
        message.success('User registered successfully!');
        form.resetFields();
        setCurrentStep(0);
      } else {
        message.error(response.message || 'Registration failed');
      }
    } catch (error) {
      message.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = (info) => {
    setFileLoading(true);
    const file = info.file.originFileObj;
    
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        setPreviewData(results.data);
        setPreviewVisible(true);
        setFileLoading(false);
      },
      error: (error) => {
        message.error('Error parsing file: ' + error.message);
        setFileLoading(false);
      }
    });
  };

  const confirmBulkUpload = async () => {
    try {
      const response = await api.post('/auth/bulk-register', JSON.stringify({
          users: previewData,
        }));

      if (response.statusText == 'Ok') {
        message.success(`Successfully registered ${response.user.length} users`);
        setPreviewVisible(false);
      } else {
        message.error(response.message || 'Bulk registration failed');
      }
    } catch (error) {
      message.error('Network error during bulk upload');
    }
  };

  const nextStep = () => {
    form.validateFields()
      .then(() => setCurrentStep(currentStep + 1))
      .catch(err => console.log('Validation failed:', err));
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const renderRoleSelection = () => (
    <div className="mb-6">
      <Title level={4} className="mb-4">Select User Role</Title>
      <Form.Item
        name="role"
        rules={[{ required: true, message: 'Please select a role' }]}
      >
        <Select 
          placeholder="Select role" 
          size="large"
          onChange={() => form.setFieldsValue({ gradeLevel: undefined, section: undefined })}
        >
          <Option value="student">Student</Option>
          <Option value="teacher">Teacher</Option>
          <Option value="parent">Parent</Option>
        </Select>
      </Form.Item>
    </div>
  );

  const renderBasicInfo = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Form.Item
          name="firstName"
          label="First Name"
          rules={[
            { required: true, message: 'Please input first name!' },
            { max: 50, message: 'Maximum 50 characters' }
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="First Name" size="large" />
        </Form.Item>

        <Form.Item
          name="lastName"
          label="Last Name"
          rules={[
            { required: true, message: 'Please input last name!' },
            { max: 50, message: 'Maximum 50 characters' }
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="Last Name" size="large" />
        </Form.Item>
      </div>

      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: 'Please input email!' },
          { type: 'email', message: 'Please enter valid email' }
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
      </Form.Item>
    </>
  );

  const renderRoleSpecificInfo = () => {
    const role = form.getFieldValue('role');
    
    if (role === 'student') {
      return (
        <>
          <Divider orientation="left">Student Information</Divider>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="birthDate"
              label="Birth Date"
              rules={[{ required: true, message: 'Please select birth date' }]}
            >
              <DatePicker 
                className="w-full"
                placeholder="Select date"
                suffixIcon={<CalendarOutlined />}
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="gradeLevel"
              label="Grade Level"
              rules={[{ required: true, message: 'Please select grade level' }]}
            >
              <Select placeholder="Select grade" size="large">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(grade => (
                  <Option key={grade} value={grade}>Grade {grade}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="section"
            label="Section"
            rules={[
              { required: true, message: 'Please input section!' },
              { pattern: /^[A-Z]$/, message: 'Single uppercase letter (A-Z)' }
            ]}
          >
            <Input 
              placeholder="Section (e.g., A, B, C)" 
              maxLength={1}
              className="w-full uppercase"
              size="large"
            />
          </Form.Item>
        </>
      );
    }

    if (role === 'teacher') {
      return (
        <>
          <Divider orientation="left">Teacher Information</Divider>
          <Form.Item
            name="subject"
            label="Primary Subject"
            rules={[{ required: true, message: 'Please input subject' }]}
          >
            <Input placeholder="e.g., Mathematics, Science" size="large" />
          </Form.Item>
        </>
      );
    }

    if (role === 'parent') {
      return (
        <>
          <Divider orientation="left">Parent Information</Divider>
          <Form.Item
            name="childStudentId"
            label="Child's Student ID (Optional)"
            rules={[
              { pattern: /^STU-\d+$/, message: 'Format: STU-12345' }
            ]}
          >
            <Input 
              prefix={<TeamOutlined />} 
              placeholder="STU-12345" 
              size="large"
            />
          </Form.Item>
        </>
      );
    }

    return null;
  };

  const steps = [
    { title: 'Role', content: renderRoleSelection() },
    { title: 'Basic Info', content: renderBasicInfo() },
    { title: 'Details', content: renderRoleSpecificInfo() }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card 
          title={
            <div className="flex justify-between items-center">
              <Title level={4} className="mb-0">User Registration</Title>
              <Text type="secondary">Admin Panel</Text>
            </div>
          }
          className="shadow-lg"
        >
          <div className="mb-6">
            <Upload
              accept=".csv"
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleBulkUpload}
            >
              <Button 
                icon={<UploadOutlined />} 
                loading={fileLoading}
                size="large"
              >
                Bulk Upload Students (CSV)
              </Button>
            </Upload>
            <Text type="secondary" className="ml-2">
              Upload CSV file with student data
            </Text>
          </div>

          <Steps current={currentStep} size="small" className="mb-6">
            {steps.map(item => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>

          <Form
            form={form}
            name="register"
            onFinish={onFinish}
            layout="vertical"
            scrollToFirstError
          >
            {steps[currentStep].content}

            <div className="flex justify-between mt-6">
              {currentStep > 0 && (
                <Button onClick={prevStep} size="large">
                  Back
                </Button>
              )}
              
              <div className="flex-1" />
              
              {currentStep < steps.length - 1 ? (
                <Button type="primary" onClick={nextStep} size="large">
                  Next
                </Button>
              ) : (
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large"
                  loading={loading}
                >
                  Register User
                </Button>
              )}
            </div>
          </Form>
        </Card>
      </div>

      {/* Bulk Upload Preview Modal */}
      <Modal
        title="Preview Bulk Upload"
        visible={previewVisible}
        width={800}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setPreviewVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={fileLoading}
            onClick={confirmBulkUpload}
          >
            Confirm Upload ({previewData.length} users)
          </Button>,
        ]}
      >
        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                {previewData[0] && Object.keys(previewData[0]).map(key => (
                  <th key={key} className="p-2 text-left">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, i) => (
                <tr key={i} className="border-b">
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="p-2">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
