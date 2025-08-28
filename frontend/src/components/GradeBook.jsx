import React, { useState, useEffect, useMemo } from 'react';
import api from '../axiosConfig';
import { useUser } from '../context/userContext';
import { toast } from 'react-toastify';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

// UI Components
const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 ${className}`} {...props}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500'
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ label, error, className = '', ...props }) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <input
      className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

const Select = ({ label, options, className = '', ...props }) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <select
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      {...props}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-lg w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex justify-center items-center py-8 ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
    </div>
  );
};

const EmptyState = ({ title, description, icon, action }) => (
  <div className="text-center py-12">
    <div className="mx-auto h-16 w-16 text-gray-400 mb-4">{icon}</div>
    <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-500 mb-4">{description}</p>
    {action}
  </div>
);

const Tabs = ({ tabs, activeTab, onChange, className = '' }) => (
  <div className={`border-b border-gray-200 ${className}`}>
    <nav className="-mb-px flex space-x-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === tab.id
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  </div>
);

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Enhanced Analytics Components
const PerformanceChart = ({ data, title, type = 'bar', height = 300, colors }) => {
  const chartColors = colors || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e5e7eb'
                }}
              />
              <Legend />
              <Bar dataKey="value" fill={chartColors[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e5e7eb'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={chartColors[0]} 
                strokeWidth={2} 
                dot={{ r: 4, fill: chartColors[0] }} 
                activeDot={{ r: 6, fill: chartColors[0] }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e5e7eb'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e5e7eb'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={chartColors[0]} 
                fill={chartColors[0]} 
                fillOpacity={0.3} 
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <RadarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis />
              <Radar 
                name="Performance" 
                dataKey="score" 
                stroke={chartColors[0]} 
                fill={chartColors[0]} 
                fillOpacity={0.3} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e5e7eb'
                }}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {data && data.length > 0 ? (
        renderChart()
      ) : (
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">No data available</p>
        </div>
      )}
    </Card>
  );
};

const StatisticsCard = ({ title, value, comparison, trend, icon, description, loading = false }) => {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  if (loading) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow h-full">
      <div className="flex items-start">
        {icon && <div className="p-2 bg-blue-100 rounded-lg mr-4 text-blue-600">{icon}</div>}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline mb-1">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            {comparison && (
              <span className={`ml-2 text-sm font-medium ${trendColor}`}>
                {trendIcon} {comparison}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

const GradeDistributionChart = ({ grades, maxScore = 100 }) => {
  const distribution = useMemo(() => {
    const ranges = [
      { range: '90-100', min: 90, max: 100, count: 0, color: '#10b981' },
      { range: '80-89', min: 80, max: 89, count: 0, color: '#34d399' },
      { range: '70-79', min: 70, max: 79, count: 0, color: '#f59e0b' },
      { range: '60-69', min: 60, max: 69, count: 0, color: '#f97316' },
      { range: '0-59', min: 0, max: 59, count: 0, color: '#ef4444' }
    ];

    grades.forEach(grade => {
      const percentage = (grade.score / grade.max_score) * 100;
      for (const range of ranges) {
        if (percentage >= range.min && percentage <= range.max) {
          range.count++;
          break;
        }
      }
    });

    return ranges;
  }, [grades]);

  return (
    <PerformanceChart
      data={distribution.map(d => ({ name: d.range, value: d.count, color: d.color }))}
      title="Grade Distribution"
      type="bar"
      height={250}
      colors={distribution.map(d => d.color)}
    />
  );
};

// Enhanced Teacher View with more features
const TeacherGradeView = ({ user }) => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [assignment, setAssignment] = useState({
    name: '',
    maxScore: 100,
    date: new Date().toISOString().split('T')[0],
    type: 'assignment',
    category: 'homework',
    weight: 1
  });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [classSettings, setClassSettings] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('grades');
  const [studentSearch, setStudentSearch] = useState('');
  
  const assignmentTypes = [
    { value: 'assignment', label: 'Assignment' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'test', label: 'Test' },
    { value: 'project', label: 'Project' },
    { value: 'participation', label: 'Participation' }
  ];
  
  const assignmentCategories = [
    { value: 'homework', label: 'Homework' },
    { value: 'classwork', label: 'Classwork' },
    { value: 'assessment', label: 'Assessment' },
    { value: 'project', label: 'Project' }
  ];

  const tabs = [
    { id: 'grades', label: 'Grade Management' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'students', label: 'Student Roster' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const classesRes = await api.get(`/teacher/${user?.id}/classes`);
        const settingsRes = await api.get(`/teacher/${user?.id}/settings`);
        setClasses(classesRes.data);
        setClassSettings(settingsRes.data);       
        if (classesRes.data.length > 0) {
          setSelectedClass(classesRes.data[0].id);
        }  
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load classes');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);
  
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        if (selectedClass) {
          const response = await api.get(`/enrollments/class/${selectedClass}/students`);
          setStudents(response.data);
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to load students' });
      }
    };

    fetchStudents();
  }, [selectedClass]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (selectedClass) {
        setAnalyticsLoading(true);
        try {
          const response = await api.get(`/analytics/class/${selectedClass}`);
          setAnalytics(response.data);
        } catch (error) {
          console.error('Failed to load analytics', error);
        } finally {
          setAnalyticsLoading(false);
        }
      }
    };

    fetchAnalytics();
  }, [selectedClass]);

  const handleGradeChange = (studentId, score) => {
    setGrades(prev => ({ 
      ...prev, 
      [studentId]: {
        ...prev[studentId],
        score: parseFloat(score) || 0
      }
    }));
  };

  const submitGrades = async () => {
    if (!assignment.name) {
      setMessage({ type: 'error', text: 'Please enter an assignment name' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const gradePromises = students.map(student => {
        const score = grades[student.id]?.score || 0;
        
        return api.post('/grades', {
          student_id: student.id,
          class_id: selectedClass,
          assignment_name: assignment.name,
          score: score,
          max_score: assignment.maxScore,
          grade_date: assignment.date,
          type: assignment.type,
          category: assignment.category,
          weight: assignment.weight
        });
      });

      await Promise.all(gradePromises);
      setMessage({ type: 'success', text: 'Grades saved successfully!' });
      setGrades({});
      setAssignment({
        name: '',
        maxScore: 100,
        date: new Date().toISOString().split('T')[0],
        type: 'assignment',
        category: 'homework',
        weight: 1
      });
      setShowAssignmentModal(false);
      
      // Refresh analytics after saving grades
      const response = await api.get(`/analytics/class/${selectedClass}`);
      setAnalytics(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save grades' });
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (score) => {
    return ((score / assignment.maxScore) * 100).toFixed(1);
  };

  const saveClassSettings = async () => {
    try {
      await api.put(`/teacher/${user.id}/settings`, classSettings);
      toast.success('Settings saved successfully');
      setShowSettingsModal(false);
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const exportGrades = async (format = 'csv') => {
    try {
      const response = await api.get(`/grades/class/${selectedClass}/export?format=${format}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `grades_${selectedClass}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to export grades');
    }
  };

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students;
    
    return students.filter(student => 
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.student_id?.toLowerCase().includes(studentSearch.toLowerCase())
    );
  }, [students, studentSearch]);

  const selectedClassInfo = classes.find(c => c.id === selectedClass);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Gradebook</h1>
          <p className="text-sm text-gray-600 mt-1">
            Logged in as: {user.name} ({user.role})
            {selectedClassInfo && ` • Teaching: ${selectedClassInfo.name} - ${selectedClassInfo.subject}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <Button variant="secondary" onClick={() => setShowSettingsModal(true)}>
            Class Settings
          </Button>
          <Button variant="secondary" onClick={() => exportGrades('csv')}>
            Export CSV
          </Button>
          <Button variant="secondary" onClick={() => exportGrades('pdf')}>
            Export PDF
          </Button>
          <Button onClick={() => setShowAssignmentModal(true)}>
            New Assignment
          </Button>
        </div>
      </div>
      
      {message.text && (
        <div className={`mb-4 p-3 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}

      <div className="mb-4">
        <Select
          label="Select Class"
          options={classes.map(classItem => ({
            value: classItem.id,
            label: `${classItem.name} - ${classItem.subject}`
          }))}
          value={selectedClass || ''}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      {activeTab === 'analytics' && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Class Analytics</h2>
          {analyticsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map(i => (
                <StatisticsCard key={i} loading={true} />
              ))}
            </div>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatisticsCard 
                  title="Class Average" 
                  value={`${analytics.classAverage || 0}%`} 
                  comparison={analytics.previousAverage && `${Math.abs(analytics.classAverage - analytics.previousAverage).toFixed(1)}%`}
                  trend={analytics.classAverage > analytics.previousAverage ? 'up' : analytics.classAverage < analytics.previousAverage ? 'down' : null}
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>}
                />
                <StatisticsCard 
                  title="Completion Rate" 
                  value={`${analytics.completionRate || 0}%`} 
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                />
                <StatisticsCard 
                  title="At-Risk Students" 
                  value={analytics.atRiskCount || 0} 
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}
                />
                <StatisticsCard 
                  title="Top Performers" 
                  value={analytics.topPerformers || 0} 
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <PerformanceChart data={analytics.gradeDistribution} title="Grade Distribution" type="bar" />
                <PerformanceChart data={analytics.trendData} title="Performance Trend" type="line" />
                <PerformanceChart data={analytics.assignmentTypeDistribution} title="Assignment Types" type="pie" />
                <PerformanceChart data={analytics.studentProgress} title="Student Progress Overview" type="area" />
              </div>
            </>
          ) : (
            <Card>
              <EmptyState
                title="No analytics data"
                description="Analytics will appear here once grades are entered for this class."
                icon={<svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>}
              />
            </Card>
          )}
        </div>
      )}

      {activeTab === 'grades' && (
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Student Grades</h2>
            <Input
              label="Search Students"
              type="text"
              placeholder="Search by name or ID..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full md:w-64 mt-2 md:mt-0"
            />
          </div>
          
          {filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => {
                    const score = grades[student.id]?.score || 0;
                    const percentage = calculatePercentage(score);
                    let status = 'Not submitted';
                    let statusColor = 'bg-gray-100 text-gray-800';
                    
                    if (score > 0) {
                      if (percentage >= 90) {
                        status = 'Excellent';
                        statusColor = 'bg-green-100 text-green-800';
                      } else if (percentage >= 80) {
                        status = 'Good';
                        statusColor = 'bg-blue-100 text-blue-800';
                      } else if (percentage >= 70) {
                        status = 'Average';
                        statusColor = 'bg-yellow-100 text-yellow-800';
                      } else {
                        status = 'Needs improvement';
                        statusColor = 'bg-red-100 text-red-800';
                      }
                    }
                    
                    return (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="font-medium text-blue-800">
                                  {student.first_name[0]}{student.last_name[0]}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{student.first_name} {student.last_name}</div>
                              <div className="text-sm text-gray-500">{student.student_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="text"
                              max={assignment.maxScore}
                              className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={score}
                              onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            />
                            <span className="ml-2 text-sm text-gray-500">/ {assignment.maxScore}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {percentage}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title={students.length === 0 ? "No students enrolled" : "No students found"}
              description={students.length === 0 
                ? "Students will appear here once they are enrolled in this class." 
                : "No students match your search criteria."}
              icon={<svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>}
            />
          )}
        </Card>
      )}

      {activeTab === 'students' && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Roster</h2>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <p className="text-sm text-gray-600">Total students: {students.length}</p>
            <Input
              label="Search Students"
              type="text"
              placeholder="Search by name or ID..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full md:w-64 mt-2 md:mt-0"
            />
          </div>
          
          {filteredStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="h-12 w-12 flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="font-medium text-blue-800 text-lg">
                          {student.first_name[0]}{student.last_name[0]}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{student.first_name} {student.last_name}</div>
                      <div className="text-sm text-gray-500">{student.student_id}</div>
                      <div className="text-xs text-gray-500">{student.email}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title={students.length === 0 ? "No students enrolled" : "No students found"}
              description={students.length === 0 
                ? "Students will appear here once they are enrolled in this class." 
                : "No students match your search criteria."}
              icon={<svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>}
            />
          )}
        </Card>
      )}

      {/* Assignment Modal */}
      <Modal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        title="Create New Assignment"
      >
        <div className="space-y-4">
          <Input
            label="Assignment Name"
            type="text"
            value={assignment.name}
            onChange={(e) => setAssignment({...assignment, name: e.target.value})}
            placeholder="Enter assignment name"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Max Score"
               type="text"
              value={assignment.maxScore}
              onChange={(e) => setAssignment({...assignment, maxScore: parseInt(e.target.value) || 100})}
            />
            
            <Input
              label="Weight"
               type="text"
              value={assignment.weight}
              onChange={(e) => setAssignment({...assignment, weight: parseFloat(e.target.value) || 1})}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Type"
              options={assignmentTypes}
              value={assignment.type}
              onChange={(e) => setAssignment({...assignment, type: e.target.value})}
            />
            
            <Select
              label="Category"
              options={assignmentCategories}
              value={assignment.category}
              onChange={(e) => setAssignment({...assignment, category: e.target.value})}
            />
          </div>
          
          <Input
            label="Date"
            type="date"
            value={assignment.date}
            onChange={(e) => setAssignment({...assignment, date: e.target.value})}
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setShowAssignmentModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitGrades}
              disabled={loading || !assignment.name}
            >
              {loading ? 'Creating...' : 'Create Assignment'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Class Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Class Settings"
        size="lg"
      >
        {classSettings && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Grading Scale</h4>
              <div className="space-y-2">
                {Object.entries(classSettings.gradingScale || {}).map(([grade, threshold]) => (
                  <div key={grade} className="flex items-center">
                    <span className="w-16 font-medium">{grade}</span>
                    <Input
                      type="text"
                      value={threshold}
                      onChange={(e) => setClassSettings({
                        ...classSettings,
                        gradingScale: {
                          ...classSettings.gradingScale,
                          [grade]: parseInt(e.target.value)
                        }
                      })}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Category Weights</h4>
              <div className="space-y-2">
                {Object.entries(classSettings.categoryWeights || {}).map(([category, weight]) => (
                  <div key={category} className="flex items-center">
                    <span className="w-32 font-medium capitalize">{category}</span>
                    <Input
                       type="text"
                      value={weight}
                      onChange={(e) => setClassSettings({
                        ...classSettings,
                        categoryWeights: {
                          ...classSettings.categoryWeights,
                          [category]: parseFloat(e.target.value)
                        }
                      })}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="secondary" onClick={() => setShowSettingsModal(false)}>
                Cancel
              </Button>
              <Button onClick={saveClassSettings}>
                Save Settings
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Enhanced Student View
const StudentGradeView = ({ user }) => {
  const [grades, setGrades] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [timeRange, setTimeRange] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Grade Details' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [gradesRes, analyticsRes] = await Promise.all([
          api.get(`/grades/student/${user.id}`),
          api.get(`/analytics/student/${user.id}`)
        ]);
        
        setGrades(gradesRes.data.data);
        setAnalytics(analyticsRes.data);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id]);

  const calculateAverage = (gradesList = grades) => {
    if (gradesList.length === 0) return 0;
    
    const totalPercentage = gradesList.reduce((sum, grade) => {
      return sum + (grade.score / grade.max_score * 100);
    }, 0);
    
    return (totalPercentage / gradesList.length).toFixed(1);
  };

  const filteredGrades = useMemo(() => {
    let filtered = grades;
    
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(grade => grade.class_name === selectedSubject);
    }
    
    if (timeRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (timeRange) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'term':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        default:
          break;
      }
      
      filtered = filtered.filter(grade => new Date(grade.grade_date) >= filterDate);
    }
    
    return filtered;
  }, [grades, selectedSubject, timeRange]);

  const subjects = useMemo(() => {
    const uniqueSubjects = [...new Set(grades.map(grade => grade.class_name))];
    return uniqueSubjects.map(subject => ({ value: subject, label: subject }));
  }, [grades]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Grades</h1>
          <p className="text-sm text-gray-600 mt-1">
            Logged in as: {user.name} ({user.role})
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <Select
            options={[{ value: 'all', label: 'All Subjects' }, ...subjects]}
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-40"
          />
          <Select
            options={[
              { value: 'all', label: 'All Time' },
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
              { value: 'term', label: 'This Term' }
            ]}
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-40"
          />
        </div>
      </div>
      
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      {activeTab === 'overview' && (
        <>
          {/* Student Analytics */}
          {analytics && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">My Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatisticsCard 
                  title="Overall Average" 
                  value={`${calculateAverage()}%`} 
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>}
                />
                <StatisticsCard 
                  title="Assignments Completed" 
                  value={grades.length} 
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                />
                <StatisticsCard 
                  title="Strongest Subject" 
                  value={analytics.strongestSubject || 'N/A'} 
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}
                />
                <StatisticsCard 
                  title="Progress Trend" 
                  value={analytics.trend || 'Steady'} 
                  trend={analytics.trend === 'Improving' ? 'up' : analytics.trend === 'Declining' ? 'down' : null}
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <PerformanceChart data={analytics.subjectPerformance} title="Subject Performance" type="bar" />
                <PerformanceChart data={analytics.timelineData} title="Progress Timeline" type="line" />
                <GradeDistributionChart grades={grades} />
                <PerformanceChart data={analytics.assignmentTypePerformance} title="Performance by Assignment Type" type="pie" />
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'details' && (
        <Card>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Grade Details</h2>
            {filteredGrades.length > 0 && (
              <div className="mt-2 md:mt-0 p-2 bg-blue-50 rounded-md">
                <span className="font-medium">Filtered Average: </span>
                <span className="text-blue-700 font-bold">{calculateAverage(filteredGrades)}%</span>
              </div>
            )}
          </div>
          
          {filteredGrades.length === 0 ? (
            <EmptyState
              title="No grades found"
              description={grades.length === 0 
                ? "You don't have any grades recorded yet." 
                : "No grades match your current filters."}
              icon={<svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredGrades.map((grade) => {
                    const percentage = ((grade.score / grade.max_score) * 100).toFixed(1);
                    let gradeColor = 'text-gray-500';
                    
                    if (percentage >= 90) gradeColor = 'text-green-600 font-bold';
                    else if (percentage >= 80) gradeColor = 'text-blue-600';
                    else if (percentage >= 70) gradeColor = 'text-yellow-600';
                    else if (percentage < 60) gradeColor = 'text-red-600';
                    
                    return (
                      <tr key={grade.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {grade.class_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {grade.assignment_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          <Badge variant={
                            grade.type === 'test' ? 'danger' : 
                            grade.type === 'quiz' ? 'warning' : 
                            grade.type === 'project' ? 'info' : 'default'
                          }>
                            {grade.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {grade.score} / {grade.max_score}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${gradeColor}`}>
                          {percentage}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(grade.grade_date).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

// Enhanced Parent View
const ParentGradeView = ({ user }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [timeRange, setTimeRange] = useState('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Grade Details' }
  ];

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/parents/${user.id}/students`);
        setStudents(response.data.data);
        
        if (response.data.data.length > 0) {
          setSelectedStudent(response.data.data[0].id);
        }
      } catch (err) {
        setError('Failed to load student data');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [user.id]);

  useEffect(() => {
    if (selectedStudent) {
      const fetchData = async () => {
        try {
          const [gradesRes, analyticsRes, notificationsRes] = await Promise.all([
            api.get(`/grades/student/${selectedStudent}`),
            api.get(`/analytics/student/${selectedStudent}`),
            api.get(`/parents/${user.id}/notifications`)
          ]);
          
          setGrades(gradesRes.data.data);
          setAnalytics(analyticsRes.data);
          setNotifications(notificationsRes.data);
        } catch (err) {
          setError('Failed to load data');
        }
      };

      fetchData();
    }
  }, [selectedStudent, user.id]);

  const calculateAverage = (gradesList = grades) => {
    if (gradesList.length === 0) return 0;
    
    const totalPercentage = gradesList.reduce((sum, grade) => {
      return sum + (grade.score / grade.max_score * 100);
    }, 0);
    
    return (totalPercentage / gradesList.length).toFixed(1);
  };

  const filteredGrades = useMemo(() => {
    let filtered = grades;
    
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(grade => grade.class_name === selectedSubject);
    }
    
    if (timeRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (timeRange) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'term':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        default:
          break;
      }
      
      filtered = filtered.filter(grade => new Date(grade.grade_date) >= filterDate);
    }
    
    return filtered;
  }, [grades, selectedSubject, timeRange]);

  const subjects = useMemo(() => {
    const uniqueSubjects = [...new Set(grades.map(grade => grade.class_name))];
    return uniqueSubjects.map(subject => ({ value: subject, label: subject }));
  }, [grades]);

  const selectedStudentInfo = students.find(s => s.id === selectedStudent);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Child Grades</h1>
          <p className="text-sm text-gray-600 mt-1">
            Logged in as: {user.name} ({user.role})
            {selectedStudentInfo && ` • Viewing: ${selectedStudentInfo.first_name} ${selectedStudentInfo.last_name}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <Button 
            variant="secondary" 
            onClick={() => setShowNotifications(true)}
            className="relative"
          >
            Notifications
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </Button>
          <Select
            options={students.map(student => ({
              value: student.id,
              label: `${student.first_name} ${student.last_name}`
            }))}
            value={selectedStudent || ''}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-48"
          />
        </div>
      </div>
      
      {students.length > 0 && !selectedStudent && (
        <Card>
          <EmptyState
            title="Select a student"
            description="Choose a student from the dropdown to view their grades."
            icon={<svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>}
          />
        </Card>
      )}
      
      {selectedStudent && (
        <>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />
          
          {activeTab === 'overview' && (
            <>
              {/* Student Analytics */}
              {analytics && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatisticsCard 
                      title="Overall Average" 
                      value={`${calculateAverage()}%`} 
                      icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>}
                    />
                    <StatisticsCard 
                      title="Assignments Completed" 
                      value={grades.length} 
                      icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                    />
                    <StatisticsCard 
                      title="Strongest Subject" 
                      value={analytics.strongestSubject || 'N/A'} 
                      icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}
                    />
                    <StatisticsCard 
                      title="Progress Trend" 
                      value={analytics.trend || 'Steady'} 
                      trend={analytics.trend === 'Improving' ? 'up' : analytics.trend === 'Declining' ? 'down' : null}
                      icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <PerformanceChart data={analytics.subjectPerformance} title="Subject Performance" type="bar" />
                    <PerformanceChart data={analytics.timelineData} title="Progress Timeline" type="line" />
                    <GradeDistributionChart grades={grades} />
                    <PerformanceChart data={analytics.assignmentTypePerformance} title="Performance by Assignment Type" type="pie" />
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'details' && (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                <Select
                  options={[{ value: 'all', label: 'All Subjects' }, ...subjects]}
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-40"
                />
                <Select
                  options={[
                    { value: 'all', label: 'All Time' },
                    { value: 'week', label: 'This Week' },
                    { value: 'month', label: 'This Month' },
                    { value: 'term', label: 'This Term' }
                  ]}
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-40"
                />
              </div>
              
              <Card>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Grade Details</h2>
                  {filteredGrades.length > 0 && (
                    <div className="mt-2 md:mt-0 p-2 bg-blue-50 rounded-md">
                      <span className="font-medium">Filtered Average: </span>
                      <span className="text-blue-700 font-bold">{calculateAverage(filteredGrades)}%</span>
                    </div>
                  )}
                </div>
                
                {filteredGrades.length === 0 ? (
                  <EmptyState
                    title="No grades found"
                    description={grades.length === 0 
                      ? "No grades recorded for this student yet." 
                      : "No grades match your current filters."}
                    icon={<svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredGrades.map((grade) => {
                          const percentage = ((grade.score / grade.max_score) * 100).toFixed(1);
                          let gradeColor = 'text-gray-500';
                          
                          if (percentage >= 90) gradeColor = 'text-green-600 font-bold';
                          else if (percentage >= 80) gradeColor = 'text-blue-600';
                          else if (percentage >= 70) gradeColor = 'text-yellow-600';
                          else if (percentage < 60) gradeColor = 'text-red-600';
                          
                          return (
                            <tr key={grade.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {grade.class_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {grade.assignment_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                <Badge variant={
                                  grade.type === 'test' ? 'danger' : 
                                  grade.type === 'quiz' ? 'warning' : 
                                  grade.type === 'project' ? 'info' : 'default'
                                }>
                                  {grade.type}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {grade.score} / {grade.max_score}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${gradeColor}`}>
                                {percentage}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(grade.grade_date).toLocaleDateString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}

      {/* Notifications Modal */}
      <Modal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        title="Notifications"
      >
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <EmptyState
              title="No notifications"
              description="You don't have any notifications at this time."
              icon={<svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>}
            />
          ) : (
            notifications.map(notification => (
              <div key={notification.id} className={`p-4 rounded-lg border ${notification.read ? 'border-gray-200' : 'border-blue-200 bg-blue-50'}`}>
                <div className="flex justify-between">
                  <h4 className="font-medium text-gray-900">{notification.title}</h4>
                  <span className="text-sm text-gray-500">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                {!notification.read && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        await api.put(`/notifications/${notification.id}/read`);
                        setNotifications(notifications.map(n => 
                          n.id === notification.id ? {...n, read: true} : n
                        ));
                      }}
                    >
                      Mark as Read
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

// Enhanced Admin View
const AdminGradeView = ({ user }) => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [grades, setGrades] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [editingGrade, setEditingGrade] = useState(null);
  const [editForm, setEditForm] = useState({ score: '', max_score: '' });
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [showReports, setShowReports] = useState(false);
  const [reportType, setReportType] = useState('summary');
  const [activeTab, setActiveTab] = useState('management');

  const tabs = [
    { id: 'management', label: 'Grade Management' },
    { id: 'analytics', label: 'Analytics' }
  ];

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const response = await api.get('/classes');
        setClasses(response.data);
        
        if (response.data.length > 0) {
          setSelectedClass(response.data[0].id);
        }
      } catch (err) {
        setError('Failed to load classes');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      const fetchData = async () => {
        try {
          const [gradesRes, analyticsRes] = await Promise.all([
            api.get(`/grades/class/${selectedClass}`),
            api.get(`/analytics/class/${selectedClass}`)
          ]);
          
          setGrades(gradesRes.data.data);
          setAnalytics(analyticsRes.data);
        } catch (err) {
          setError('Failed to load data');
        }
      };

      fetchData();
    }
  }, [selectedClass]);

  const handleEdit = (grade) => {
    setEditingGrade(grade.id);
    setEditForm({ score: grade.score, max_score: grade.max_score });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const submitEdit = async (gradeId) => {
    try {
      await api.put(`/grades/${gradeId}`, editForm);
      setMessage({ type: 'success', text: 'Grade updated successfully!' });
      
      // Refresh the grades list and analytics
      const [gradesRes, analyticsRes] = await Promise.all([
        api.get(`/grades/class/${selectedClass}`),
        api.get(`/analytics/class/${selectedClass}`)
      ]);
      
      setGrades(gradesRes.data.data);
      setAnalytics(analyticsRes.data);
      setEditingGrade(null);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update grade' });
    }
  };

  const cancelEdit = () => {
    setEditingGrade(null);
    setEditForm({ score: '', max_score: '' });
  };

  const handleDelete = async (gradeId) => {
    if (!window.confirm('Are you sure you want to delete this grade record?')) {
      return;
    }

    try {
      await api.delete(`/grades/${gradeId}`);
      setMessage({ type: 'success', text: 'Grade deleted successfully!' });
      
      // Refresh the grades list and analytics
      const [gradesRes, analyticsRes] = await Promise.all([
        api.get(`/grades/class/${selectedClass}`),
        api.get(`/analytics/class/${selectedClass}`)
      ]);
      
      setGrades(gradesRes.data.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete grade' });
    }
  };

  const toggleGradeSelection = (gradeId) => {
    setSelectedGrades(prev => 
      prev.includes(gradeId)
        ? prev.filter(id => id !== gradeId)
        : [...prev, gradeId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedGrades.length === grades.length) {
      setSelectedGrades([]);
    } else {
      setSelectedGrades(grades.map(grade => grade.id));
    }
  };

  const deleteSelectedGrades = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedGrades.length} grade records?`)) {
      return;
    }

    try {
      await Promise.all(selectedGrades.map(id => api.delete(`/grades/${id}`)));
      setMessage({ type: 'success', text: `${selectedGrades.length} grades deleted successfully!` });
      setSelectedGrades([]);
      
      // Refresh the grades list and analytics
      const [gradesRes, analyticsRes] = await Promise.all([
        api.get(`/grades/class/${selectedClass}`),
        api.get(`/analytics/class/${selectedClass}`)
      ]);
      
      setGrades(gradesRes.data.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete grades' });
    }
  };

  const generateReport = async () => {
    try {
      const response = await api.get(`/reports/class/${selectedClass}?type=${reportType}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${selectedClass}_${reportType}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowReports(false);
    } catch (err) {
      toast.error('Failed to generate report');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  const selectedClassInfo = classes.find(c => c.id === selectedClass);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grade Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Logged in as: {user.name} ({user.role})
            {selectedClassInfo && ` • Managing: ${selectedClassInfo.name} - ${selectedClassInfo.subject}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <Button variant="secondary" onClick={() => setShowReports(true)}>
            Generate Report
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setShowBulkActions(!showBulkActions)}
            className="relative"
          >
            Bulk Actions
            {selectedGrades.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {selectedGrades.length}
              </span>
            )}
          </Button>
          <Select
            options={classes.map(classItem => ({
              value: classItem.id,
              label: `${classItem.name} - ${classItem.subject}`
            }))}
            value={selectedClass || ''}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}
      
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      {activeTab === 'analytics' && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Class Analytics</h2>
          {analyticsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map(i => (
                <StatisticsCard key={i} loading={true} />
              ))}
            </div>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatisticsCard 
                  title="Class Average" 
                  value={`${analytics.classAverage || 0}%`} 
                  comparison={analytics.previousAverage && `${Math.abs(analytics.classAverage - analytics.previousAverage).toFixed(1)}%`}
                  trend={analytics.classAverage > analytics.previousAverage ? 'up' : analytics.classAverage < analytics.previousAverage ? 'down' : null}
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>}
                />
                <StatisticsCard 
                  title="Completion Rate" 
                  value={`${analytics.completionRate || 0}%`} 
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                />
                <StatisticsCard 
                  title="At-Risk Students" 
                  value={analytics.atRiskCount || 0} 
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}
                />
                <StatisticsCard 
                  title="Top Performers" 
                  value={analytics.topPerformers || 0} 
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1" /></svg>}
                  />
                  </div>
            </>
            ):
            ('')}
            </div>
      )}
      </div>
  )}
      

  // Main Gradebook component with role-based rendering
export default function Gradebook() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading user data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <div className="p-4 text-red-600">Failed to load user data. Please try again.</div>;
  }

  // Render the appropriate view based on user role
  switch (user.role) {
    case 'teacher':
      return <TeacherGradeView user={user} />;
    case 'student':
      return <StudentGradeView user={user} />;
    case 'parent':
      return <ParentGradeView user={user} />;
    case 'admin':
      return <AdminGradeView user={user} />;
    default:
      return <div className="p-4 text-red-600">Unauthorized access. Please contact administrator.</div>;
  }
}