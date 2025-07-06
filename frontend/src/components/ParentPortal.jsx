import React, { useState, useEffect } from 'react';
import { Card, Tabs, Table, Tag, Spin, Empty, Alert } from 'antd';
import {
  UserOutlined,
  BookOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { TabPane } = Tabs;

export default function ParentPortal({ parentId }) {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState({
    children: true,
    grades: false,
    attendance: false
  });
  const [error, setError] = useState(null);

  // Fetch parent's children
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await fetch(`/api/parent/children`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setChildren(data);
        if (data.length > 0) {
          setSelectedChild(data[0].id);
        }
      } catch (err) {
        setError('Failed to load children data');
      } finally {
        setLoading(prev => ({ ...prev, children: false }));
      }
    };

    fetchChildren();
  }, [parentId]);

  // Fetch data when selected child changes
  useEffect(() => {
    if (selectedChild) {
      fetchChildData(selectedChild);
    }
  }, [selectedChild]);

  const fetchChildData = async (childId) => {
    setLoading(prev => ({ ...prev, grades: true, attendance: true }));
    try {
      const [gradesRes, attendanceRes] = await Promise.all([
        fetch(`/api/parent/child/${childId}/grades`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch(`/api/parent/child/${childId}/attendance`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ]);

      const gradesData = await gradesRes.json();
      const attendanceData = await attendanceRes.json();

      setGrades(gradesData);
      setAttendance(attendanceData);
    } catch (err) {
      setError('Failed to load child data');
    } finally {
      setLoading(prev => ({ ...prev, grades: false, attendance: false }));
    }
  };

  const gradeColumns = [
    {
      title: 'Subject',
      dataIndex: 'class_name',
      key: 'class_name',
    },
    {
      title: 'Assignment',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      render: (score, record) => (
        <span>
          {score} / {record.max_score} 
          <span style={{ marginLeft: 8, color: '#888' }}>
            ({(score / record.max_score * 100).toFixed(1)}%)
          </span>
        </span>
      ),
    },
    {
      title: 'Teacher',
      dataIndex: 'teacher',
      key: 'teacher',
      render: (_, record) => (
        `${record.teacher_first_name} ${record.teacher_last_name}`
      ),
    },
    {
      title: 'Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: date => new Date(date).toLocaleDateString(),
    },
  ];

  const attendanceColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: date => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Class',
      dataIndex: 'class_name',
      key: 'class_name',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        const color = status === 'present' ? 'green' : 
                     status === 'absent' ? 'red' : 
                     status === 'late' ? 'orange' : 'blue';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Teacher',
      dataIndex: 'teacher_name',
      key: 'teacher_name',
    },
  ];

  const attendanceSummary = attendance.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="parent-portal">
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Card 
        title="My Children" 
        loading={loading.children}
        style={{ marginBottom: 16 }}
      >
        {children.length > 0 ? (
          <div className="children-selector">
            <Tabs
              activeKey={selectedChild}
              onChange={setSelectedChild}
              type="card"
            >
              {children.map(child => (
                <TabPane
                  key={child.id}
                  tab={
                    <span>
                      <UserOutlined />
                      {child.first_name} {child.last_name}
                      <Tag style={{ marginLeft: 8 }}>
                        Grade {child.grade_level}
                      </Tag>
                    </span>
                  }
                />
              ))}
            </Tabs>
          </div>
        ) : (
          <Empty description="No children found" />
        )}
      </Card>

      {selectedChild && (
        <>
          <Card 
            title="Academic Performance" 
            loading={loading.grades}
            style={{ marginBottom: 16 }}
          >
            <Tabs defaultActiveKey="1">
              <TabPane
                tab={
                  <span>
                    <BookOutlined />
                    Grades
                  </span>
                }
                key="1"
              >
                <Table
                  columns={gradeColumns}
                  dataSource={grades}
                  rowKey="id"
                  loading={loading.grades}
                  pagination={{ pageSize: 5 }}
                  locale={{ emptyText: 'No grade records found' }}
                />
              </TabPane>
              <TabPane
                tab={
                  <span>
                    <InfoCircleOutlined />
                    Summary
                  </span>
                }
                key="2"
              >
                {grades.length > 0 ? (
                  <div>
                    <h4>Average Score: {(grades.reduce((sum, grade) => sum + (grade.score / grade.max_score), 0) / grades.length * 100).toFixed(1)}%</h4>
                    <h4>Total Assignments: {grades.length}</h4>
                  </div>
                ) : (
                  <Empty description="No grade data available" />
                )}
              </TabPane>
            </Tabs>
          </Card>

          <Card 
            title="Attendance Records" 
            loading={loading.attendance}
          >
            <Tabs defaultActiveKey="1">
              <TabPane
                tab={
                  <span>
                    <CheckCircleOutlined />
                    Detailed Records
                  </span>
                }
                key="1"
              >
                <Table
                  columns={attendanceColumns}
                  dataSource={attendance}
                  rowKey="id"
                  loading={loading.attendance}
                  pagination={{ pageSize: 5 }}
                  locale={{ emptyText: 'No attendance records found' }}
                />
              </TabPane>
              <TabPane
                tab={
                  <span>
                    <InfoCircleOutlined />
                    Summary
                  </span>
                }
                key="2"
              >
                {attendance.length > 0 ? (
                  <div>
                    <h4>Total Days: {attendance.length}</h4>
                    <h4>
                      Present: <Tag color="green">{attendanceSummary.present || 0}</Tag>
                    </h4>
                    <h4>
                      Absent: <Tag color="red">{attendanceSummary.absent || 0}</Tag>
                    </h4>
                    <h4>
                      Late: <Tag color="orange">{attendanceSummary.late || 0}</Tag>
                    </h4>
                    <h4>
                      Excused: <Tag color="blue">{attendanceSummary.excused || 0}</Tag>
                    </h4>
                  </div>
                ) : (
                  <Empty description="No attendance data available" />
                )}
              </TabPane>
            </Tabs>
          </Card>
        </>
      )}
    </div>
  );
}