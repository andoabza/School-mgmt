import React, { useState, useEffect } from 'react';
import { Table, InputNumber, Button, Input } from 'antd';

export default function Gradebook({ classId }) {
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [assignment, setAssignment] = useState({
    name: '',
    maxScore: 100
  });

  useEffect(() => {
    fetch(`/api/classes/${classId}/students`)
      .then(res => res.json())
      .then(data => setStudents(data));
  }, [classId]);

  const handleGradeChange = (studentId, score) => {
    setGrades(prev => ({ ...prev, [studentId]: score }));
  };

  const submitGrades = () => {
    const studentGrades = students.map(student => ({
      studentId: student.id,
      score: grades[student.id] || 0
    }));
    
    fetch(`/api/grades`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ 
        classId, 
        assignment,
        studentGrades 
      })
    });
  };

  const columns = [
    { title: 'Student', dataIndex: 'name', key: 'name' },
    { 
      title: 'Grade', 
      key: 'grade',
      render: (_, record) => (
        <InputNumber
          min={0}
          max={assignment.maxScore}
          onChange={(value) => handleGradeChange(record.id, value)}
        />
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Assignment name"
          value={assignment.name}
          onChange={(e) => setAssignment({...assignment, name: e.target.value})}
          style={{ width: 200, marginRight: 8 }}
        />
        <InputNumber
          placeholder="Max score"
          value={assignment.maxScore}
          onChange={(value) => setAssignment({...assignment, maxScore: value})}
          min={1}
          style={{ width: 120 }}
        />
      </div>
      
      <Table 
        columns={columns} 
        dataSource={students} 
        rowKey="id"
        pagination={false}
      />
      
      <Button 
        type="primary" 
        onClick={submitGrades}
        style={{ marginTop: 16 }}
      >
        Save Grades
      </Button>
    </div>
  );
}