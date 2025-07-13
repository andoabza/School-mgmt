import React, { useState, useEffect } from 'react';
import {
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserPlusIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  AcademicCapIcon,
  IdentificationIcon,
  BookOpenIcon,
  UsersIcon,
  LockClosedIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import api from '../axiosConfig';
import { useAuth } from '../context/authContext';
import Papa from 'papaparse';
import { toast } from 'react-toastify';
import { useUser } from '../context/userContext';

const UserManagement = () => {
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showFilters, setShowFilters] = useState(false);
  const { logout } = useAuth();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [notification, setNotification] = useState({ type: null, message: null });
  const [previewData, setPreviewData] = useState(null);
  const { user } = useUser();
  // const [showPassword, setShowPassword] = useState(false);
  const [bulkUploadData, setBulkUploadData] = useState([]);
  const [showBulkPreview, setShowBulkPreview] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'student',
    birthDate: '',
    gradeLevel: '',
    section: '',
    subject: '',
    StudentId: '',
    password: 'School@123',
    resetPassword: false
  });

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      if (response.status === 401) {
        logout();
      }
      // setUsers(response.data);
      const email = user.email;
      // remove current user from the list
      setUsers(response.data.filter(u => u.email !== email));
      setNotification({ type: null, message: null });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to fetch users. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter and sort users
  const filteredUsers = users
    .filter(user => {
      const matchesSearch = 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });


  // User actions
  const updateUser = async (userId, updatedData) => {
    try {
      await api.patch(`/users/${userId}`, updatedData);
      setUsers(users.map(user => 
        user.id === userId ? { ...user, ...updatedData } : user
      ));
      setNotification({ type: 'success', message: 'User updated successfully' });
      return true;
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update user'
      });
      return false;
    }
  };

  const resetPassword = async (userId) => {
    try {
      
      await api.post(`/users/reset-password`, { id: userId });
      setNotification({ type: 'success', message: 'Password reset to default successfully' });
      return true;
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to reset password'
      });
      return false;
    }
  };

  // const deleteUsers = async (userIds = selectedUsers) => {
  //   if (!userIds.length) return;

  //   try {
  //     const response = await api.delete(`/users`, {
  //       data: { ids: userIds }
  //     });
  //     fetchUsers();
  //     setSelectedUsers([]);
  //     toast.success(`${response.data.length || userIds.length} user(s) deleted successfully!`);
  //     setNotification({
  //       type: 'success',
  //       message: `${userIds.length} user(s) deleted successfully`
  //     });
  //   } catch (err) {
  //     setNotification({
  //       type: 'error',
  //       message: err.response?.data?.message || 'Failed to delete users'
  //     });
  //   }
  // };

const deleteUsers = async (userIds = selectedUsers) => {
  if (!userIds.length) return;
  let count = 0,
      failed = 0;
  try {
    for (const id of userIds ){
    const response = await api.delete(`/users/${id}`);  
    if (response.status == 200) count++;
    failed++
  }
       // Send as { users: [id1, id2, ...] });
    
    fetchUsers();
    setSelectedUsers([]);
    toast.success(`${count} user(s) deleted successfully!`);
    setNotification({
      type: 'success',
      message: `${count} user(s) deleted successfully. ${failed} faild.`
    });
  } catch (err) {
    console.log(err);
    setNotification({
      type: 'error',
      message: err.response?.data?.message || 'Failed to delete users'
    });
    toast.error(err.response?.data?.message || 'Failed to delete users');
  }
};


  const createUser = async () => {
    try {
      const payload = {
        ...formData,
        password: formData.resetPassword ? 'School@123' : formData.password
      };

      if (previewData) {
        // Update existing user
        const success = await updateUser(previewData.id, payload);
        if (success) {
          setShowAddModal(false);
          setCurrentStep(0);
          setPreviewData(null);
        }
      } else {
        // Create new user
        const response = await api.post('/users/register', payload);
        setUsers([...users, response.data]);
        setShowAddModal(false);
        setFormData({
          email: '',
          firstName: '',
          lastName: '',
          role: 'student',
          birthDate: '',
          gradeLevel: '',
          section: '',
          subject: '',
          StudentId: '',
          resetPassword: false
        });
        setCurrentStep(0);
        setNotification({ type: 'success', message: 'User created successfully' });
      }
    } catch (err) {
      toast.error(err?.response?.data?.error);
      setShowAddModal(false);
      setCurrentStep(0);
      setPreviewData(null);
      setNotification({
        type: 'error',
        message: err.response?.data?.message || previewData ? 'Failed to update user' : 'Failed to create user'
      });
    }
  };

  // Bulk upload functions
  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileLoading(true);
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        // Remove users whose email already exists in the current users list
        const existingEmails = users.map(u => u.email?.toLowerCase());
        const filteredData = results.data.filter(
          user => user.email && !existingEmails.includes(user.email.toLowerCase())
        );
        setBulkUploadData(filteredData);
        setShowBulkPreview(true);        
        setFileLoading(false);
        if (filteredData.length < results.data.length) {
          toast.info(`${results.data.length - filteredData.length} existing user(s) were removed from the upload.`);
        }
      },
      error: (error) => {
        setNotification({
          type: 'error',
          message: error.message || 'Error parsing CSV file'
        });
        toast.error(error.message || 'Error Parsing File');
        
        setFileLoading(false);
      }
    });
    
  };

  const confirmBulkUpload = async () => {
    try {
      const response = await api.post('/users/bulk-register', 
     {
        users: bulkUploadData.map(user => ({
          ...user}))
      }
    );
      fetchUsers();
      setShowBulkPreview(false);
      setBulkUploadData([]);
      setNotification({
        type: 'success',
        message: `${response.data.length} users created successfully`
      });
      toast.success(`${response.data.count} users created successfully`);
      
      } catch (err) {
      toast.error(err?.response?.data?.error);
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to bulk create users'
      });
      toast.error(err.response?.data?.message || 'Failed to create users');
    }
  };

  // Form handling
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const validateStep = (step) => {
    switch (step) {
      case 0: // Role selection
        return !!formData.role;
      case 1: // Basic info
        return !!formData.email && !!formData.firstName && !!formData.lastName;
      default:
        return true;
    }
  };


  // UI components
  const renderRoleSelection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Select User Role</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['student', 'teacher', 'parent', 'admin'].map(role => (
          <button
            key={role}
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                role,
                gradeLevel: '',
                section: '',
                subject: '',
                StudentId: ''
              }));
              nextStep();
            }}
            className={`p-4 border rounded-lg transition-all ${
              formData.role === role 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <div className="flex items-center">
              <div className={`p-2 rounded-full mr-3 ${
                formData.role === role ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {role === 'student' && <AcademicCapIcon className="h-5 w-5" />}
                {role === 'teacher' && <BookOpenIcon className="h-5 w-5" />}
                {role === 'parent' && <UsersIcon className="h-5 w-5" />}
                {role === 'admin' && <UserIcon className="h-5 w-5" />}
              </div>
              <div className="text-left">
                <h4 className="font-medium capitalize">{role}</h4>
                <p className="text-sm text-gray-500">
                  {role === 'student' && 'Register a new student'}
                  {role === 'teacher' && 'Add a teacher to the system'}
                  {role === 'parent' && 'Create parent account'}
                  {role === 'admin' && 'Create administrator account'}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="pl-10 w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="First Name"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="pl-10 w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Last Name"
              required
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="text-black pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Email"
            required
          />
        </div>
      </div>
      {previewData && (
        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="resetPassword"
              checked={formData.resetPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, resetPassword: e.target.checked }))}
              className="h-4 text-black w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Reset password to default (School@123)</span>
          </label>
        </div>
      )}
    </div>
  );

  const renderRoleSpecificInfo = () => {
    switch (formData.role) {
      case 'student':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Student Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className="pl-10 text-black w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                <select
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleInputChange}
                  className="w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select grade</option>
                  {Array.from({ length: 4 }, (_, i) => (
                    <option key={i+9} value={i+9}>Grade {i+9}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IdentificationIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="section"
                  value={formData.section}
                  onChange={handleInputChange}
                  className="pl-10 w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  placeholder="Section (A-Z)"
                  maxLength={1}
                />
              </div>
            </div>
          </div>
        );
      case 'teacher':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Teacher Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Subject</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full text-black border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Mathematics, Science"
              />
            </div>
          </div>
        );
      case 'parent':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Parent Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Child's Student ID (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IdentificationIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="childStudentId"
                  value={formData.StudentId}
                  onChange={handleInputChange}
                  className="pl-10 text-black w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="STU-12345"
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderPreview = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Review Information</h3>
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700">Basic Information</h4>
            <div className="mt-2 space-y-1 text-sm">
              <p><span className="text-gray-500">Name:</span> {formData.firstName} {formData.lastName}</p>
              <p><span className="text-gray-500">Email:</span> {formData.email}</p>
              <p><span className="text-gray-500">Role:</span> <span className="capitalize">{formData.role}</span></p>
              {formData.resetPassword && (
                <p className="text-yellow-600">Password will be reset to default</p>
              )}
            </div>
          </div>
          {formData.role === 'student' && (
            <div>
              <h4 className="font-medium text-gray-700">Student Details</h4>
              <div className="mt-2 space-y-1 text-sm">
                <p><span className="text-gray-500">Birth Date:</span> {formData.birthDate || '-'}</p>
                <p><span className="text-gray-500">Grade:</span> {formData.gradeLevel || '-'}</p>
                <p><span className="text-gray-500">Section:</span> {formData.section || '-'}</p>
              </div>
            </div>
          )}
          {formData.role === 'teacher' && (
            <div>
              <h4 className="font-medium text-gray-700">Teacher Details</h4>
              <div className="mt-2 space-y-1 text-sm">
                <p><span className="text-gray-500">Subject:</span> {formData.subject || '-'}</p>
              </div>
            </div>
          )}
          {formData.role === 'parent' && (
            <div>
              <h4 className="font-medium text-gray-700">Parent Details</h4>
              <div className="mt-2 space-y-1 text-sm">
                <p><span className="text-gray-500">Child ID:</span> {formData.studentId || '-'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {(!previewData || formData.resetPassword) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                A default password will be set for this user (School@123). The user will be prompted to change it on first login.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const steps = [
    { title: 'Select Role', content: renderRoleSelection() },
    { title: 'Basic Info', content: renderBasicInfo() },
    { title: 'Details', content: renderRoleSpecificInfo() },
    { title: 'Preview', content: renderPreview() }
  ];

  // Table sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Selection management
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (notification.type) {
      const timer = setTimeout(() => {
        setNotification({ type: null, message: null });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Notification Banner */}
      {notification.type && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${
          notification.type === 'error' 
            ? 'bg-red-100 border border-red-400 text-red-700' 
            : 'bg-green-100 border border-green-400 text-green-700'
        }`}>
          {notification.type === 'error' ? (
            <ExclamationCircleIcon className="h-5 w-5 mr-2" />
          ) : (
            <CheckCircleIcon className="h-5 w-5 mr-2" />
          )}
          {notification.message}
        </div>
      )}

      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-600">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
            {selectedUsers.length > 0 && ` (${selectedUsers.length} selected)`}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              setShowAddModal(true);
              setPreviewData(null);
              setFormData({
                email: '',
                firstName: '',
                lastName: '',
                role: 'student',
                birthDate: '',
                gradeLevel: '',
                section: '',
                subject: '',
                studentId: '',
                password: 'School@123',
                resetPassword: false
              });
              setCurrentStep(0);
            }}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <UserPlusIcon className="h-5 w-5" />
            Add User
          </button>

          <label className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">
            <CloudArrowUpIcon className="h-5 w-5" />
            Bulk Upload
            <input
              type="file"
              accept=".csv"
              onChange={handleBulkUpload}
              className="hidden"
              disabled={fileLoading}
            />
          </label>

          {selectedUsers.length > 0 && (
            <>
              <button
                onClick={() => {
                  if (window.confirm(`Reset password to default for ${selectedUsers.length} user(s)?`)) {
                    Promise.all(selectedUsers.map(userId => resetPassword(userId)))
                      .then(() => setSelectedUsers([]));
                  }
                }}
                className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <LockClosedIcon className="h-5 w-5" />
                Reset Passwords
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)?`)) {
                    deleteUsers();
                  }
                }}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <TrashIcon className="h-5 w-5" />
                Delete Selected
              </button>
            </>
          )}
          
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex text-white items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
            ) : (
              <ArrowPathIcon className="h-5 w-5" />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 text-black pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-white justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition-colors"
          >
            <FunnelIcon className="h-5 w-5" />
            Filters
            {showFilters ? (
              <ChevronUpIcon className="ml-1 h-4 w-4" />
            ) : (
              <ChevronDownIcon className="ml-1 h-4 w-4" />
            )}
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            #
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <input
              type="checkbox"
              checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
              </th>
              <th 
            scope="col" 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            onClick={() => requestSort('email')}
              >
            <div className="flex items-center">
              Email
              {sortConfig.key === 'email' && (
                sortConfig.direction === 'asc' ? (
              <ChevronUpIcon className="ml-1 h-4 w-4" />
                ) : (
              <ChevronDownIcon className="ml-1 h-4 w-4" />
                )
              )}
            </div>
              </th>
              <th 
            scope="col" 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            onClick={() => requestSort('firstName')}
              >
            <div className="flex items-center">
              First Name
              {sortConfig.key === 'firstName' && (
                sortConfig.direction === 'asc' ? (
              <ChevronUpIcon className="ml-1 h-4 w-4" />
                ) : (
              <ChevronDownIcon className="ml-1 h-4 w-4" />
                )
              )}
            </div>
              </th>
              <th 
            scope="col" 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            onClick={() => requestSort('lastName')}
              >
            <div className="flex items-center">
              Last Name
              {sortConfig.key === 'lastName' && (
                sortConfig.direction === 'asc' ? (
              <ChevronUpIcon className="ml-1 h-4 w-4" />
                ) : (
              <ChevronDownIcon className="ml-1 h-4 w-4" />
                )
              )}
            </div>
              </th>
              <th 
            scope="col" 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            onClick={() => requestSort('role')}
              >
            <div className="flex items-center">
              Role
              {sortConfig.key === 'role' && (
                sortConfig.direction === 'asc' ? (
              <ChevronUpIcon className="ml-1 h-4 w-4" />
                ) : (
              <ChevronDownIcon className="ml-1 h-4 w-4" />
                )
              )}
            </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
            <td colSpan="7" className="px-6 py-4 text-center">
              <div className="flex justify-center">
                <ArrowPathIcon className="h-5 w-5 animate-spin text-gray-500" />
              </div>
            </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
            <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
              No users found
            </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
            <tr key={user.id} className={selectedUsers.includes(user.id) ? 'bg-blue-50' : ''}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">000{user.id}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
              type="checkbox"
              checked={selectedUsers.includes(user.id)}
              onChange={() => toggleUserSelection(user.id)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{user.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{user.first_name || '-'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{user.last_name || '-'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 capitalize">{user.role || '-'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  setFormData({
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                birthDate: user.birthDate || '',
                gradeLevel: user.gradeLevel || '',
                section: user.section || '',
                subject: user.subject || '',
                studentId: user.studentId || '',
                password: 'School@123',
                resetPassword: false
                  });
                  setPreviewData(user);
                  setShowAddModal(true);
                  setCurrentStep(0);
                }}
                className="text-blue-600 hover:text-blue-900"
                title="Edit"
              >
                <PencilSquareIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Reset password to default for this user?')) {
                resetPassword(user.id);
                  }
                }}
                className="text-purple-600 hover:text-purple-900"
                title="Reset Password"
              >
                <LockClosedIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this user?')) {
                deleteUsers([user.id]);
                  }
                }}
                className="text-red-600 hover:text-red-900"
                title="Delete"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
                </div>
                </td>
                </tr>
                )))}
         </tbody>
                
        </table>
        
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {previewData ? 'Edit User' : 'Add New User'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setCurrentStep(0);
                    setPreviewData(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Stepper */}
              <div className="mb-6">
                <nav className="flex items-center justify-center">
                  <ol className="flex items-center space-x-4">
                    {steps.map((step, index) => (
                      <li key={step.title} className="flex items-center">
                        <span
                          className={`flex items-center justify-center w-8 h-8 rounded-full ${
                            currentStep === index
                              ? 'bg-blue-600 text-white border border-blue-600'
                              : currentStep > index
                              ? 'bg-green-100 text-green-800 border border-green-300'
                              : 'bg-gray-100 text-gray-500 border border-gray-300'
                          }`}
                        >
                          {index + 1}
                        </span>
                        {index < steps.length - 1 && (
                          <span className="ml-4 block w-10 h-0.5 bg-gray-300"></span>
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>
                <div className="mt-2 text-center text-sm text-gray-500">
                  {steps[currentStep].title}
                </div>
              </div>

              {/* Step Content */}
              <div className="mb-6">
                {steps[currentStep].content}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <div>
                  {currentStep > 0 && (
                    <button
                      onClick={prevStep}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Back
                    </button>
                  )}
                </div>
                <div>
                  {currentStep < steps.length - 1 ? (
                    <button
                      onClick={nextStep}
                      disabled={!validateStep(currentStep)}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        !validateStep(currentStep) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={createUser}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      {previewData ? 'Update User' : 'Create User'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Preview Modal */}
      {showBulkPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Bulk Upload Preview</h2>
                <button
                  onClick={() => {
                    setShowBulkPreview(false);
                    setBulkUploadData([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {bulkUploadData.length} users will be created with default password "School@123".
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birth Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Child Student ID</th>

                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bulkUploadData.length == 0 && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">Users Exist</td>
                    )}
                    {bulkUploadData.slice(0, 100).map((user, index) => (
                      <tr key={index}>                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{user.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.firstName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.lastName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user?.birthDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user?.gradeLevel}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user?.section}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user?.subject}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user?.childStudentId}</td>
                      </tr>
                    ))}
                    {bulkUploadData.length > 100 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                          + {bulkUploadData.length - 100} more users
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowBulkPreview(false);
                    setBulkUploadData([]);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkUpload}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Confirm Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
