//App.jsx
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import {
  Routes, Route, Navigate, useNavigate, useLocation
} from 'react-router-dom';
import {
  BellIcon, CalendarIcon, BookOpenIcon, CheckCircleIcon, UsersIcon,
  Cog6ToothIcon, ArrowRightOnRectangleIcon, HomeIcon, UserIcon,
  ChartBarIcon, ChevronDownIcon, Bars3Icon, XMarkIcon, ListBulletIcon
} from '@heroicons/react/24/outline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth, AuthProvider } from './context/authContext';
import { useUser, UserProvider } from './context/userContext';

// Components
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import UserManagement from './components/UserManagement';
import Scheduler from './components/Scheduler';
import AttendanceTracker from './components/attendance/AttendanceTracker';
import Gradebook from './components/Gradebook';
import ParentPortal from './components/ParentPortal';
import NotificationCenter from './components/NotificationCenter';
import ClassManagement from './components/ClassManagement';
import ClassEnrollment from './components/ClassEnrollment';
import TeacherClassAssignment from './components/TeacherClassAssignment';

// Updated Logo with requested name and colors
const Logo = () => (
  <div className="flex items-center">
    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-600">
      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v10" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19l3-3m-3 3l-3-3" />
      </svg>
    </div>
    <div className="ml-3 flex items-baseline">
      <span className="text-indigo-300 text-lg font-bold">12.xyz </span>
      <span className="text-emerald-300 text-lg font-bold">School</span>
      <span className="text-indigo-300 text-lg font-bold">Sync</span>
    </div>
  </div>
);

const MainLayout = ({ children, user, menuItems, sidebarOpen, setSidebarOpen,
                    handleLogout, notifications, setNotificationOpen, ws,
                    markAsRead, markAllAsRead, notificationOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="bg-gray-50 w-full">
      {/* Mobile sidebar */}
      <MobileSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        menuItems={menuItems}
        navigate={navigate}
        location={location}
      />

      {/* Static sidebar for desktop */}
      <DesktopSidebar
        menuItems={menuItems}
        navigate={navigate}
        location={location}
      />

      {/* Main content */}
      <div className="md:pl-64 flex flex-col w-full">
        {/* Top navigation */}
        <TopNavigation
          setSidebarOpen={setSidebarOpen}
          setNotificationOpen={setNotificationOpen}
          notifications={notifications}
          user={user}
          handleLogout={handleLogout}
        />

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Notification center */}
      <NotificationCenterWrapper
        notificationOpen={notificationOpen}
        setNotificationOpen={setNotificationOpen}
        notifications={notifications}
        markAsRead={markAsRead}
        markAllAsRead={markAllAsRead}
        ws={ws}
      />
    </div>
  )};

const MobileSidebar = ({ sidebarOpen, setSidebarOpen, menuItems, navigate, location }) => (
  <div className={`md:hidden fixed inset-0 z-40 ${sidebarOpen ? 'block' : 'hidden'}`}>
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
    <div className="relative flex flex-col w-72 max-w-xs h-full bg-indigo-700">
      <div className="flex items-center justify-between h-16 px-4">
        <Logo />
        <button
          type="button"
          className="text-white hover:text-gray-300"
          onClick={() => setSidebarOpen(false)}
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {menuItems.map((item) => (
          <a
            key={item.key}
            href={item.path}
            onClick={(e) => {
              e.preventDefault();
              navigate(item.path);
              setSidebarOpen(false);
            }}
            className={`flex items-center px-2 py-3 text-sm font-medium rounded-md ${location.pathname === item.path ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-600'}`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  </div>
);

const DesktopSidebar = ({ menuItems, navigate, location }) => (
  <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
    <div className="flex flex-col flex-grow pt-5 bg-indigo-700 overflow-y-auto">
      <div className="flex items-center flex-shrink-0 px-4">
        <Logo />
      </div>
      <div className="mt-5 flex-1 flex flex-col">
        <nav className="flex-1 px-2 pb-4 space-y-1">
          {menuItems.map((item) => (
            <a
              key={item.key}
              href={item.path}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.path);
              }}
              className={`flex items-center px-2 py-3 text-sm font-medium rounded-md ${location.pathname === item.path ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-600'}`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  </div>
);

const TopNavigation = ({ setSidebarOpen, setNotificationOpen, notifications, user, handleLogout }) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <button
        type="button"
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" />
      </button>
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          <h1 className="text-xl font-semibold text-gray-900 capitalize">
            {location.pathname.split('/')[1] || 'Dashboard'}
          </h1>
        </div>
        <div className="ml-4 flex items-center md:ml-6 space-x-4">
          <button
            type="button"
            className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 relative"
            onClick={() => setNotificationOpen(true)}
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
            )}
          </button>

          <div className="relative ml-3" ref={dropdownRef}>
            <button
              type="button"
              className="flex items-center space-x-2"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            >
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {user.firstName}
              </span>
              <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                {user.avatar ? (
                  <img src={user.avatar} alt="User" className="h-8 w-8 rounded-full" />
                ) : (
                  <UserIcon className="h-4 w-4 text-white" />
                )}
              </div>
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            </button>
            
            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <a 
                  href="#" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/profile');
                    setProfileDropdownOpen(false);
                  }}
                >
                  <UserIcon className="h-4 w-4 mr-2 inline" />
                  Your Profile
                </a>
                <a 
                  href="#" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                    setProfileDropdownOpen(false);
                  }}
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2 inline" />
                  Sign out
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationCenterWrapper = ({
  notificationOpen,
  setNotificationOpen,
  notifications,
  markAsRead,
  markAllAsRead,
  ws
}) => (
  notificationOpen && (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setNotificationOpen(false)}></div>
        <div className="fixed inset-y-0 right-0 max-w-full flex">
          <div className="relative w-screen max-w-md">
            <div className="h-full flex flex-col bg-white shadow-xl">
              <NotificationCenter
                open={notificationOpen}
                onClose={() => setNotificationOpen(false)}
                notifications={notifications}
                markAsRead={markAsRead}
                markAllAsRead={markAllAsRead}
                ws={ws}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
);

const ProfilePage = () => {
  const { user } = useUser();

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center mb-6">
        <div className="h-16 w-16 rounded-full bg-indigo-500 flex items-center justify-center text-white mr-4">
          {user.avatar ? (
            <img src={user.avatar} alt="User" className="h-16 w-16 rounded-full" />
          ) : (
            <UserIcon className="h-8 w-8 text-white" />
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{user.firstName} {user.lastName}</h2>
          <p className="text-gray-600">{user.email}</p>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 capitalize mt-1">
            {user.role}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Personal Information</h3>
          <div className="space-y-2">
            <p><span className="font-medium">First Name:</span> {user.firstName}</p>
            <p><span className="font-medium">Last Name:</span> {user.lastName}</p>
            <p><span className="font-medium">Email:</span> {user.email}</p>
            <p><span className="font-medium">Phone:</span> {user.phone || 'N/A'}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Account Information</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Role:</span> <span className="capitalize">{user.role}</span></p>
            <p><span className="font-medium">Status:</span> <span className="text-green-600">Active</span></p>
            <p><span className="font-medium">Member Since:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppRoutes = ({ user, notifications }) => (
  <Routes>
    <Route path="/" element={<Dashboard user={user} notifications={notifications} />} />
    <Route path="/dashboard" element={<Dashboard user={user} notifications={notifications} />} />
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/users" element={
      user.role === 'admin' ?
        <UserManagement /> :
        <Navigate to="/dashboard" />
    } />
    <Route path="/schedule" element={<Scheduler />} />
    <Route path="/attendance" element={<AttendanceTracker />} />
    <Route path="/student-enrollment" element={
      user.role === 'admin' ?
        <ClassEnrollment /> :
        <Navigate to="/dashboard" />
    } />
    <Route path="/teacher-enrollment" element={
      user.role === 'admin' ?
        <TeacherClassAssignment /> :
        <Navigate to="/dashboard" />
    } />
    <Route path="/grades" element={<Gradebook />} />
    <Route path="/parent" element={
      user.role === 'parent' ?
        <ParentPortal parentId={user.id} /> :
        <Navigate to="/dashboard" />
    } />
    <Route path="/classes" element={
      ['admin', 'teacher'].includes(user.role) ?
        <ClassManagement /> :
        <Navigate to="/dashboard" />
    } />
    <Route path="/reports" element={
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900">Reports Dashboard</h2>
      </div>
    } />
    <Route path="/settings" element={
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900">Account Settings</h2>
      </div>
    } />
  </Routes>
);

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [ws, setWs] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { user } = useUser();
  
  // WebSocket connection for real-time notifications
  useEffect(() => {
    if (!user) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${localStorage.getItem('token')}`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      setNotifications(prev => [{ ...notification, id: Date.now(), read: false }, ...prev]);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setTimeout(() => setWs(null), 15000);
    };

    return () => websocket.close();
  }, [user]);

  const handleLogout = () => {
    if (ws) ws.close();
    logout();
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )};

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
  );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Menu items based on user role
  const menuItems = [
    { key: 'dashboard', icon: <HomeIcon className="h-5 w-5" />, label: 'Dashboard', show: true, path: '/dashboard' },
    { key: 'users', icon: <UserIcon className="h-5 w-5" />, label: 'User Management', show: user.role === 'admin', path: '/users' },
    { key: 'schedule', icon: <CalendarIcon className="h-5 w-5" />, label: 'Class Schedule', show: ['admin', 'teacher', 'student'].includes(user.role), path: '/schedule' },
    { key: 'attendance', icon: <CheckCircleIcon className="h-5 w-5" />, label: 'Attendance', show: ['admin', 'teacher', 'student'].includes(user.role), path: '/attendance' },
    { key: 'enrollment', icon: <ListBulletIcon className="h-5 w-5" />, label: 'Students', show: user.role === 'admin', path: '/student-enrollment' },
    { key: 'enrollment', icon: <ListBulletIcon className="h-5 w-5" />, label: 'Teachers', show: user.role === 'admin', path: '/teacher-enrollment' },
    { key: 'grades', icon: <BookOpenIcon className="h-5 w-5" />, label: 'Gradebook', show: ['admin', 'teacher', 'student'].includes(user.role), path: '/grades' },
    { key: 'parent', icon: <UsersIcon className="h-5 w-5" />, label: 'Parent Portal', show: user.role === 'parent', path: '/parent' },
    { key: 'classes', icon: <HomeIcon className="h-5 w-5" />, label: 'Classes', show: ['admin', 'teacher'].includes(user.role), path: '/classes' },
    { key: 'reports', icon: <ChartBarIcon className="h-5 w-5" />, label: 'Reports', show: ['admin', 'teacher', 'student'].includes(user.role), path: '/reports' },
    { key: 'settings', icon: <Cog6ToothIcon className="h-5 w-5" />, label: 'Settings', show: true, path: '/settings' }
  ].filter(item => item.show);

  return (
    <MainLayout
      user={user}
      menuItems={menuItems}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      handleLogout={handleLogout}
      notifications={notifications}
      setNotificationOpen={setNotificationOpen}
      notificationOpen={notificationOpen}
      markAsRead={markAsRead}
      markAllAsRead={markAllAsRead}
      ws={ws}
    >
      <AppRoutes user={user} notifications={notifications} />
    </MainLayout>
  );
}


export default function AppWrapper() {
  return (
    <UserProvider>
      <AuthProvider>
        <App />
        <ToastContainer position="top-right" autoClose={5000} />
      </AuthProvider>
    </UserProvider>
  );
};


//AttendanceTracker.jsx


import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/userContext';
import moment from 'moment';
import api from '../../axiosConfig';
import { toast } from 'react-toastify';
import { 
  FiUser, FiCalendar, FiCheckCircle, FiXCircle, 
  FiClock, FiAlertCircle, FiEdit, FiTrash2,
  FiPlus, FiSearch, FiChevronDown, FiChevronUp,
  FiDownload, FiFilter, FiBarChart2, FiTrendingUp,
  FiAward, FiRefreshCw, FiSave
} from 'react-icons/fi';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';

const AttendanceSystem = () => {
  const { user } = useUser();
  const [view, setView] = useState('daily');
  const [date, setDate] = useState(moment().format('YYYY-MM-DD'));
  const [month, setMonth] = useState(moment().format('YYYY-MM'));
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Admin/Teacher states
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('present');
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Parent states
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  
  // Student states
  const [studentAttendance, setStudentAttendance] = useState([]);

  // Statistics
  const [stats, setStats] = useState({
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    attendanceRate: 0,
    currentStreak: 0,
    bestStreak: 0
  });

  // Fetch data based on role
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (user?.role === 'admin') {
          const classesRes = await api.get('/classes');
          setClasses(classesRes.data);
          if (classesRes.data.length > 0) {
            setSelectedClass(classesRes.data[0].id);
          }
        } 
        else if (user?.role === 'teacher') {
          const classesRes = await api.get(`/teacher/${user.id}/classes`);
          setClasses(classesRes.data);
          if (classesRes.data.length > 0) {
            setSelectedClass(classesRes.data[0].id);
          }
        } 
        else if (user?.role === 'parent') {
          const childrenRes = await api.get(`/parents/${user.id}/children`);
          setChildren(childrenRes.data);
          if (childrenRes.data.length > 0) {
            setSelectedChild(childrenRes.data[0].id);
          }
        } 
        else if (user?.role === 'student') {
          const attendanceRes = await api.get(`/attendance?studentId=${user.id}&date=${date}`);
          setStudentAttendance(attendanceRes.data);
        }
      } catch (error) {
        toast.error(error.response.data.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Fetch class students when class is selected
  useEffect(() => {
    if (selectedClass && (user?.role === 'admin' || user?.role === 'teacher')) {
      fetchClassStudents();
    }
  }, [selectedClass]);

  // Fetch attendance records when date/month changes
  useEffect(() => {
    if (view === 'daily' && date) {
      fetchAttendanceRecords();
    } else if (view === 'monthly' && month) {
      fetchMonthlyAttendance();
    }
  }, [view, date, month, selectedClass, selectedChild]);

  // Calculate statistics when records change
  useEffect(() => {
    calculateStatistics();
  }, [attendanceRecords]);

  const fetchClassStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/class/${selectedClass}/students`);
      setStudents(res.data);
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      let endpoint = `/attendance?date=${date}`;
      if (selectedClass) endpoint += `&classId=${selectedClass}`;
      if (user?.role === 'student') endpoint += `&studentId=${user.id}`;
      if (user?.role === 'parent' && selectedChild) endpoint += `&studentId=${selectedChild}`;
      
      const res = await api.get(endpoint);
      setAttendanceRecords(res.data.records || []);
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyAttendance = async () => {
    try {
      setLoading(true);
      let endpoint = `/attendance/monthly?month=${month}`;
      if (selectedClass) endpoint += `&classId=${selectedClass}`;
      if (user?.role === 'student') endpoint += `&studentId=${user.id}`;
      if (user?.role === 'parent' && selectedChild) endpoint += `&studentId=${selectedChild}`;
      
      const res = await api.get(endpoint);
      setAttendanceRecords(res.data);
    } catch (error) {
      toast.error('Failed to load monthly attendance');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = () => {
    if (attendanceRecords.length === 0) {
      setStats({
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        attendanceRate: 0,
        currentStreak: 0,
        bestStreak: 0
      });
      return;
    }

    if (user?.role === 'admin' || user?.role === 'teacher') {
      const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
      const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
      const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
      const total = attendanceRecords.length;
      const attendanceRate = Math.round((presentCount / total) * 100);

      setStats({
        presentCount,
        absentCount,
        lateCount,
        attendanceRate,
        currentStreak: 0,
        bestStreak: 0
      });
    } else {
      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;
      
      const sortedRecords = [...attendanceRecords].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      
      sortedRecords.forEach(record => {
        if (record.status === 'present') {
          tempStreak++;
          currentStreak = tempStreak;
          if (tempStreak > bestStreak) {
            bestStreak = tempStreak;
          }
        } else {
          tempStreak = 0;
        }
      });

      const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
      const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
      const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
      const total = presentCount + absentCount + lateCount;
      const attendanceRate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

      setStats({
        presentCount,
        absentCount,
        lateCount,
        attendanceRate,
        currentStreak,
        bestStreak
      });
    }
  };

  const handleBulkStatusChange = (status) => {
    setBulkStatus(status);
  };

  const applyBulkStatus = () => {
    if (!selectedClass || !date) {
      toast.error('Please select a class and date first');
      return;
    }

    const updatedRecords = students.map(student => {
      const existingRecord = attendanceRecords.find(r => r.student_id === student.id);
      
      return {
        ...(existingRecord || {}),
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        date,
        class_id: selectedClass,
        status: bulkStatus,
        remark: bulkStatus === 'absent' ? 'Bulk marked absent' : 
                bulkStatus === 'late' ? 'Bulk marked late' : 'Bulk marked present'
      };
    });

    setAttendanceRecords(updatedRecords);
    setShowBulkActions(false);
    toast.success(`Bulk status applied: ${bulkStatus}`);
  };

  const saveBulkChanges = async () => {
    try {
      if (!selectedClass || !date) {
        throw new Error('Class and date are required');
      }

      setLoading(true);
      
      const response = await api.post('/attendance', {
        classId: selectedClass,
        date,
        remark: `Bulk attendance for ${moment(date).format('LL')}`,
        records: attendanceRecords.map(record => ({
          studentId: record.student_id,
          status: record.status,
          details: record.remark || null
        }))
      });

      if (response.data.success) {
        toast.success('Attendance saved successfully');
        fetchAttendanceRecords();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save attendance');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      setLoading(true);
      let endpoint = `/attendance/export?month=${month}`;
      if (selectedClass) endpoint += `&classId=${selectedClass}`;
      
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_${month}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRecord = (studentId, field, value) => {
    setAttendanceRecords(prev => prev.map(record => 
      record.student_id === studentId ? { ...record, [field]: value } : record
    ));
  };

  const renderStatsCards = () => {
    if (user?.role === 'student' || user?.role === 'parent') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-80">Attendance Rate</p>
                <p className="text-3xl font-bold">{stats.attendanceRate}%</p>
              </div>
              <FiTrendingUp className="text-2xl" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-80">Current Streak</p>
                <p className="text-3xl font-bold">{stats.currentStreak} days</p>
              </div>
              <FiAward className="text-2xl" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-80">Best Streak</p>
                <p className="text-3xl font-bold">{stats.bestStreak} days</p>
              </div>
              <FiBarChart2 className="text-2xl" />
            </div>
          </div>
        </div>
      );
    } else if (user?.role === 'admin' || user?.role === 'teacher') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Present</p>
                <p className="text-2xl font-bold text-green-600">{stats.presentCount}</p>
              </div>
              <FiCheckCircle className="text-2xl text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-red-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Absent</p>
                <p className="text-2xl font-bold text-red-600">{stats.absentCount}</p>
              </div>
              <FiXCircle className="text-2xl text-red-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-yellow-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lateCount}</p>
              </div>
              <FiClock className="text-2xl text-yellow-500" />
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderAttendanceChart = () => {
    if (view !== 'monthly') return null;

    const labels = Array.from({ length: moment(month).daysInMonth() }, (_, i) => i + 1);
    
    const presentData = labels.map(day => {
      const dateStr = moment(month).date(day).format('YYYY-MM-DD');
      return attendanceRecords.filter(r => r.date === dateStr && r.status === 'present').length;
    });

    const absentData = labels.map(day => {
      const dateStr = moment(month).date(day).format('YYYY-MM-DD');
      return attendanceRecords.filter(r => r.date === dateStr && r.status === 'absent').length;
    });

    const data = {
      labels,
      datasets: [
        {
          label: 'Present',
          data: presentData,
          backgroundColor: '#10B981',
          borderRadius: 4
        },
        {
          label: 'Absent',
          data: absentData,
          backgroundColor: '#EF4444',
          borderRadius: 4
        }
      ]
    };

    return (
      <div className="bg-white rounded-xl p-4 shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Attendance Overview</h3>
        <Bar 
          data={data} 
          options={{
            responsive: true,
            scales: {
              x: {
                stacked: true,
                grid: {
                  display: false
                }
              },
              y: {
                stacked: true,
                beginAtZero: true,
                ticks: {
                  precision: 0
                }
              }
            },
            plugins: {
              legend: {
                position: 'top',
              },
              tooltip: {
                callbacks: {
                  afterBody: (context) => {
                    const day = context[0].label;
                    const dateStr = moment(month).date(day).format('YYYY-MM-DD');
                    const lateCount = attendanceRecords.filter(r => r.date === dateStr && r.status === 'late').length;
                    return lateCount > 0 ? [`Late: ${lateCount}`] : [];
                  }
                }
              }
            }
          }}
        />
      </div>
    );
  };

  const renderStatusDistribution = () => {
    if (view !== 'monthly') return null;

    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'late').length;

    const data = {
      labels: ['Present', 'Absent', 'Late'],
      datasets: [
        {
          data: [presentCount, absentCount, lateCount],
          backgroundColor: [
            '#10B981',
            '#EF4444',
            '#F59E0B'
          ],
          borderWidth: 1
        }
      ]
    };

    return (
      <div className="bg-white rounded-xl p-4 shadow-md">
        <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
        <div className="h-64">
          <Pie 
            data={data} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const label = context.label || '';
                      const value = context.raw || 0;
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = Math.round((value / total) * 100);
                      return `${label}: ${value} (${percentage}%)`;
                    }
                  }
                }
              }
            }}
          />
        </div>
      </div>
    );
  };

  const renderAdminTeacherView = () => (
    <div className="space-y-6">
      {/* Header and controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={selectedClass || ''}
            onChange={(e) => setSelectedClass(e.target.value || null)}
            className="p-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Class</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name} - Grade {cls.grade_level}
              </option>
            ))}
          </select>
          
          <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm">
            <button onClick={() => setView('daily')} className={`px-3 py-1 rounded-md transition-all ${view === 'daily' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
              Daily
            </button>
            <button onClick={() => setView('monthly')} className={`px-3 py-1 rounded-md transition-all ${view === 'monthly' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
              Monthly
            </button>
          </div>
          
          {view === 'daily' ? (
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="p-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="p-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 transition-all"
          >
            <FiDownload /> Export
          </button>
          {view === 'daily' && selectedClass && (
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-all"
            >
              <FiRefreshCw /> Bulk Actions
            </button>
          )}
        </div>
      </div>
      
      {showBulkActions && (
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkStatusChange('present')}
                className={`px-3 py-1 rounded-md border ${bulkStatus === 'present' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-300'}`}
              >
                Mark All Present
              </button>
              <button
                onClick={() => handleBulkStatusChange('absent')}
                className={`px-3 py-1 rounded-md border ${bulkStatus === 'absent' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-gray-300'}`}
              >
                Mark All Absent
              </button>
              <button
                onClick={() => handleBulkStatusChange('late')}
                className={`px-3 py-1 rounded-md border ${bulkStatus === 'late' ? 'bg-yellow-100 border-yellow-500 text-yellow-700' : 'bg-white border-gray-300'}`}
              >
                Mark All Late
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={applyBulkStatus}
                className="flex items-center gap-2 px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <FiRefreshCw /> Apply
              </button>
              <button
                onClick={saveBulkChanges}
                className="flex items-center gap-2 px-4 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <FiSave /> Save
              </button>
              <button
                onClick={() => setShowBulkActions(false)}
                className="flex items-center gap-2 px-4 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {selectedClass ? (
        <div className="space-y-6">
          {renderStatsCards()}
          
          {view === 'daily' ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {moment(date).format('dddd, MMMM D, YYYY')}
                </h3>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students
                      .filter(student => {
                        const searchLower = searchTerm.toLowerCase();
                        return (
                          student.first_name.toLowerCase().includes(searchLower) ||
                          student.last_name.toLowerCase().includes(searchLower) ||
                          student.student_id.toLowerCase().includes(searchLower)
                        );
                      })
                      .map(student => {
                        const record = attendanceRecords.find(r => r.student_id === student.id);
                        return (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                  {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.first_name} {student.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500">ID: {student.student_id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={record?.status || ''}
                                onChange={(e) => handleEditRecord(student.id, 'status', e.target.value)}
                                className={`p-1 rounded border ${
                                  record?.status === 'present' ? 'bg-green-50 border-green-200' :
                                  record?.status === 'absent' ? 'bg-red-50 border-red-200' :
                                  record?.status === 'late' ? 'bg-yellow-50 border-yellow-200' :
                                  'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                                <option value="late">Late</option>
                                <option value="excused">Excused</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="text"
                                value={record?.remark || ''}
                                onChange={(e) => handleEditRecord(student.id, 'remark', e.target.value)}
                                placeholder="Add remark..."
                                className="p-1 border rounded w-full"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={saveBulkChanges}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <FiSave size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {renderAttendanceChart()}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <MonthlyAttendanceView 
                    students={students} 
                    records={attendanceRecords} 
                    month={month}
                  />
                </div>
                <div>
                  {renderStatusDistribution()}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <FiUser className="text-gray-400 text-2xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No class selected</h3>
          <p className="mt-1 text-sm text-gray-500">Please select a class to view attendance records</p>
        </div>
      )}
    </div>
  );
  const renderStudentView = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setView('daily')}
            className={`px-3 py-1 rounded ${view === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Daily
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`px-3 py-1 rounded ${view === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Monthly
          </button>
        </div>
        
        {view === 'daily' ? (
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-2 border rounded"
          />
        ) : (
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="p-2 border rounded"
          />
        )}
      </div>
      
      {view === 'daily' ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              {moment(date).format('dddd, MMMM D, YYYY')}
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
              <div>
                <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                <div className="text-sm text-gray-500">ID: {user?.studentId}</div>
              </div>
            </div>
          </div>
          
          {attendanceRecords.length > 0 ? (
            <div className="space-y-4">
              {attendanceRecords.map(record => (
                <div key={record.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {record.class_name} - Grade {record.grade_level}
                      </div>
                      <div className={`inline-block px-3 py-1 rounded-full text-sm mt-2 ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' :
                        record.status === 'absent' ? 'bg-red-100 text-red-800' :
                        record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {record.status}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {moment(record.date).format('h:mm A')}
                      </div>
                    </div>
                  </div>
                  {record.remark && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <p className="text-sm">{record.remark}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No attendance records found for this date
            </div>
          )}
        </div>
      ) : (
        <MonthlyAttendanceCalendar 
          records={attendanceRecords} 
          month={month}
        />
      )}
    </div>
  );

  const renderParentView = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center">
        <select
          value={selectedChild || ''}
          onChange={(e) => setSelectedChild(e.target.value || null)}
          className="p-2 border rounded"
        >
          <option value="">Select Child</option>
          {children.map(child => (
            <option key={child.id} value={child.id}>
              {child.first_name} {child.last_name}
            </option>
          ))}
        </select>
        
        <div className="flex gap-2">
          <button
            onClick={() => setView('daily')}
            className={`px-3 py-1 rounded ${view === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Daily
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`px-3 py-1 rounded ${view === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Monthly
          </button>
        </div>
        
        {view === 'daily' ? (
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-2 border rounded"
          />
        ) : (
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="p-2 border rounded"
          />
        )}
      </div>
      
      {selectedChild ? (
        view === 'daily' ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {moment(date).format('dddd, MMMM D, YYYY')}
              </h2>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                <div>
                  <div className="font-medium">
                    {children.find(c => c.id === selectedChild)?.first_name} 
                    {' '}
                    {children.find(c => c.id === selectedChild)?.last_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    ID: {children.find(c => c.id === selectedChild)?.student_id}
                  </div>
                </div>
              </div>
            </div>
            
            {attendanceRecords.length > 0 ? (
              <div className="space-y-4">
                {attendanceRecords.map(record => (
                  <div key={record.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">
                          {record.class_name} - Grade {record.grade_level}
                        </div>
                        <div className={`inline-block px-3 py-1 rounded-full text-sm mt-2 ${
                          record.status === 'present' ? 'bg-green-100 text-green-800' :
                          record.status === 'absent' ? 'bg-red-100 text-red-800' :
                          record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {record.status}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {moment(record.date).format('h:mm A')}
                        </div>
                      </div>
                    </div>
                    {record.remark && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm">{record.remark}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No attendance records found for this date
              </div>
            )}
          </div>
        ) : (
          <MonthlyAttendanceCalendar 
            records={attendanceRecords} 
            month={month}
          />
        )
      ) : (
        <div className="text-center py-8 text-gray-500">
          Please select a child to view attendance
        </div>
      )}
    </div>
  );
  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Attendance System</h1>
        <div className="text-sm text-gray-500">
          {user?.role === 'admin' ? 'Administrator' : 
           user?.role === 'teacher' ? 'Teacher' : 
           user?.role === 'student' ? 'Student' : 
           user?.role === 'parent' ? 'Parent' : 'Guest'} View
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading attendance data...</p>
        </div>
      ) : user?.role === 'admin' || user?.role === 'teacher' ? (
        renderAdminTeacherView()
      ) : user?.role === 'student' ? (
        renderStudentView()
      ) : user?.role === 'parent' ? (
        renderParentView()
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <FiAlertCircle className="text-gray-400 text-2xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Access Restricted</h3>
          <p className="mt-1 text-sm text-gray-500">Please log in to view attendance records</p>
        </div>
      )}
    </div>
  );
};
const MonthlyAttendanceView = ({ students, records, month }) => {
  const daysInMonth = moment(month).daysInMonth();
  const monthName = moment(month).format('MMMM YYYY');
  
  // Calculate summary statistics
  const summary = students.map(student => {
    const studentRecords = records.filter(r => r.student_id === student.id);
    return {
      id: student.id,
      name: `${student.first_name} ${student.last_name}`,
      studentId: student.student_id,
      present: studentRecords.filter(r => r.status === 'present').length,
      absent: studentRecords.filter(r => r.status === 'absent').length,
      late: studentRecords.filter(r => r.status === 'late').length,
      excused: studentRecords.filter(r => r.status === 'excused').length,
      records: studentRecords
    };
  });

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">{monthName} Attendance Details</h3>
        <p className="text-sm text-gray-500">Daily status for each student</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              {Array.from({ length: daysInMonth }).map((_, i) => (
                <th 
                  key={i} 
                  className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {i + 1}
                </th>
              ))}
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="text-green-600">P</span>
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="text-red-600">A</span>
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="text-yellow-600">L</span>
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {summary.map(student => {
              const totalDays = student.present + student.absent + student.late + student.excused;
              const attendanceRate = totalDays > 0 
                ? Math.round((student.present / totalDays) * 100)
                : 0;

              return (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {student.name}
                    </div>
                    <div className="text-xs text-gray-500">{student.studentId}</div>
                  </td>
                  
                  {Array.from({ length: daysInMonth }).map((_, day) => {
                    const date = moment(month).date(day + 1).format('YYYY-MM-DD');
                    const record = student.records.find(r => r.date === date);
                    const dayOfWeek = moment(date).day();
                    
                    return (
                      <td 
                        key={day} 
                        className={`px-1 py-2 text-center text-xs ${
                          dayOfWeek === 0 || dayOfWeek === 6 ? 'bg-gray-50' : ''
                        }`}
                      >
                        {record ? (
                          <div 
                            className={`mx-auto w-6 h-6 rounded-full flex items-center justify-center ${
                              record.status === 'present' ? 'bg-green-100 text-green-800' :
                              record.status === 'absent' ? 'bg-red-100 text-red-800' :
                              record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}
                            title={`${moment(date).format('ddd, MMM D')}: ${record.status}`}
                          >
                            {record.status.charAt(0).toUpperCase()}
                          </div>
                        ) : (
                          <div 
                            className="mx-auto w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"
                            title={`${moment(date).format('ddd, MMM D')}: No record`}
                          >
                            -
                          </div>
                        )}
                      </td>
                    );
                  })}
                  
                  <td className="px-2 py-3 text-center text-sm font-medium text-green-600">
                    {student.present}
                  </td>
                  <td className="px-2 py-3 text-center text-sm font-medium text-red-600">
                    {student.absent}
                  </td>
                  <td className="px-2 py-3 text-center text-sm font-medium text-yellow-600">
                    {student.late}
                  </td>
                  <td className="px-2 py-3 text-center text-sm font-medium">
                    <span className={`${
                      attendanceRate >= 90 ? 'text-green-600' :
                      attendanceRate >= 75 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {attendanceRate}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MonthlyAttendanceCalendar = ({ records, month }) => {
  const daysInMonth = moment(month).daysInMonth();
  const firstDay = moment(month).startOf('month').day();
  const monthName = moment(month).format('MMMM YYYY');
  // Calculate summary statistics // filter(r => r.status === 'present').length
  const presentDays = records.data?.records[0]?.presentCount;
  const absentDays = records.data?.records[0]?.absentCount;

  const lateDays = records.data?.records[0]?.lateCount;
  const excusedDays = records.data?.records[0]?.excusedCount;
  const totalDays = records.data?.records[0]?.totalDays;
  const attendanceRate = records.data?.records[0]?.attendanceRate;

  // Find current streak
  let currentStreak = 0;
  let tempStreak = 0;
  const sortedRecords = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  sortedRecords.forEach(record => {
    if (record.status === 'present') {
      tempStreak++;
      if (tempStreak > currentStreak) {
        currentStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-lg font-semibold mb-2">{monthName} Calendar View</h3>
        
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div 
              key={day} 
              className="text-center font-medium text-sm py-2 bg-gray-50 rounded"
            >
              {day}
            </div>
          ))}
          
          {Array.from({ length: firstDay }).map((_, i) => (
            <div 
              key={`empty-${i}`} 
              className="h-10 bg-gray-50 rounded"
            />
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const date = moment(month).date(i + 1).format('YYYY-MM-DD');
            const dayRecords = records.filter(r => r.date === date);
            const isWeekend = moment(date).day() === 0 || moment(date).day() === 6;
            
            return (
              <div 
                key={i} 
                className={`h-12 border rounded flex flex-col items-center justify-center relative ${
                  isWeekend ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                <div className="text-xs absolute top-1 left-1">
                  {i + 1}
                </div>
                {dayRecords.length > 0 && (
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      dayRecords[0].status === 'present' ? 'bg-green-100 text-green-800' :
                      dayRecords[0].status === 'absent' ? 'bg-red-100 text-red-800' :
                      dayRecords[0].status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}
                    title={`${moment(date).format('ddd, MMM D')}: ${dayRecords[0].status}`}
                  >
                    {dayRecords[0].status.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-100 border border-green-300 mr-2"></div>
              <span className="text-sm">Present</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-100 border border-red-300 mr-2"></div>
              <span className="text-sm">Absent</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-yellow-100 border border-yellow-300 mr-2"></div>
              <span className="text-sm">Late</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-100 border border-blue-300 mr-2"></div>
              <span className="text-sm">Excused</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
              <span className="text-sm font-medium">Current Streak: </span>
              <span className="ml-1 font-bold text-green-600">{currentStreak} days</span>
            </div>
            <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
              <span className="text-sm font-medium">Attendance Rate: </span>
              <span className={`ml-1 font-bold ${
                attendanceRate >= 90 ? 'text-green-600' :
                attendanceRate >= 75 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {attendanceRate}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 border-t-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Present Days</p>
              <p className="text-2xl font-bold text-green-600">{presentDays}</p>
            </div>
            <FiCheckCircle className="text-2xl text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-4 border-t-4 border-red-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Absent Days</p>
              <p className="text-2xl font-bold text-red-600">{absentDays}</p>
            </div>
            <FiXCircle className="text-2xl text-red-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-4 border-t-4 border-yellow-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Late Days</p>
              <p className="text-2xl font-bold text-yellow-600">{lateDays}</p>
            </div>
            <FiClock className="text-2xl text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-4 border-t-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Days</p>
              <p className="text-2xl font-bold text-blue-600">{totalDays}</p>
            </div>
            <FiCalendar className="text-2xl text-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
export default AttendanceSystem;

//ClassManagement.jsx
import React, { useState, useEffect } from 'react';
import api from '../axiosConfig';
import { useUser } from '../context/userContext';
import ClassroomManagement from './ClassroomManagement';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/classes');
      setClasses(response.data);
    } catch (error) {
      setError('Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/users?role=teacher');
      setTeachers(response.data);
    } catch (error) {
      setError('Failed to fetch teachers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const values = Object.fromEntries(formData.entries());
    
    try {
      if (editingClass) {
        await api.put(`/classes/${editingClass.id}`, values);
        setSuccess('Class updated successfully');
      } else {
        await api.post('/classes', values);
        setSuccess('Class created successfully');
      }
      
      setTimeout(() => setSuccess(''), 3000);
      setIsModalOpen(false);
      setEditingClass(null);
      fetchClasses();
    } catch (error) {
      setError(error.response?.data?.error || 'Operation failed');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await api.delete(`/classes/${id}`);
        setSuccess('Class deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
        fetchClasses();
      } catch (error) {
        setError('Failed to delete class');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  // Filter classes based on search and filters
  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         cls.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGrade = gradeFilter === 'all' || cls.grade_level == gradeFilter;
    const matchesSubject = subjectFilter === 'all' || cls.subject === subjectFilter;
    const matchesTeacher = teacherFilter === 'all' || cls.teacher_id == teacherFilter;
    
    return matchesSearch && matchesGrade && matchesSubject && matchesTeacher;
  });

  // Get unique subjects for filter dropdown
  const uniqueSubjects = [...new Set(classes.map(cls => cls.subject))].filter(Boolean);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClasses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);

  // Get teacher name by ID
  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Not assigned';
  };

  return (
    <div className="container mx-auto p-4">
      {/* Classroom Management Section */}
      <ClassroomManagement />

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Class Management</h1>
          <p className="text-gray-600">Manage all school classes and assignments</p>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => {
              setEditingClass(null);
              setIsModalOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FiPlus className="mr-2" />
            Add New Class
          </button>
        )}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md border border-green-200">
          {success}
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Grade Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Grades</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(grade => (
                <option key={grade} value={grade}>Grade {grade}</option>
              ))}
            </select>
          </div>
          
          {/* Subject Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Subjects</option>
              {uniqueSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
          
          {/* Teacher Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Teachers</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.first_name} {teacher.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-gray-500 text-sm">Total Classes</div>
          <div className="text-2xl font-bold">{classes.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-gray-500 text-sm">Filtered Classes</div>
          <div className="text-2xl font-bold">{filteredClasses.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-gray-500 text-sm">Teachers</div>
          <div className="text-2xl font-bold">{teachers.length}</div>
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <FiFilter className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No classes found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    {isAdmin && (
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map(cls => (
                    <tr key={cls.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{cls.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-700">{cls.subject}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Grade {cls.grade_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-700">{getTeacherName(cls.teacher_id)}</div>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(cls)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            <FiEdit className="inline mr-1" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(cls.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash2 className="inline mr-1" /> Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(indexOfLastItem, filteredClasses.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredClasses.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">First</span>
                        <FiChevronLeft className="h-5 w-5" />
                        <FiChevronLeft className="h-5 w-5 -ml-2" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <FiChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <FiChevronRight className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Last</span>
                        <FiChevronRight className="h-5 w-5" />
                        <FiChevronRight className="h-5 w-5 -ml-2" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingClass ? 'Edit Class' : 'Add New Class'}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingClass(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Class Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    defaultValue={editingClass?.name || ''}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    defaultValue={editingClass?.subject || ''}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="grade_level" className="block text-sm font-medium text-gray-700 mb-1">
                    Grade Level
                  </label>
                  <select
                    id="grade_level"
                    name="grade_level"
                    defaultValue={editingClass?.grade_level || ''}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Grade</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(grade => (
                      <option key={grade} value={grade}>Grade {grade}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label htmlFor="teacher_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Teacher
                  </label>
                  <select
                    id="teacher_id"
                    name="teacher_id"
                    defaultValue={editingClass?.teacher_id || ''}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Teacher (Optional)</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingClass(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingClass ? 'Update Class' : 'Create Class'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;


//ClassroomManagement.jsx

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

//GradeBook.jsx

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

//UserManagement.jsx
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
    password: '',
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
      await api.patch(`/users/${userId}/role`, updatedData);
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

//ParentPortal

import React, { useState, useEffect } from 'react';
import { useUser } from '../context/userContext';
import api from '../axiosConfig.js';

export default function ParentPortal() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState({
    children: true,
    grades: false,
    attendance: false
  });
  const [addChildVisible, setAddChildVisible] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [error, setError] = useState(null);
  const { user } = useUser();

  // Fetch parent's children
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await api.get(`/parents/${user.id}/children`);
        
        if (response.data.length > 0) {
          setChildren(response.data);
          setSelectedChild(response.data[0].id);
        }
      } catch (err) {
        setError('Failed to load children data');
      } finally {
        setLoading(prev => ({ ...prev, children: false }));
      }
    };

    fetchChildren();
  }, [user]);

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
        api.get(`/parents/child/${childId}/grades`),
        api.get(`/parents/child/${childId}/attendance`)
      ]);

      setGrades(gradesRes.data);
      setAttendance(attendanceRes.data);
    } catch (err) {
      setError('Failed to load child data');
    } finally {
      setLoading(prev => ({ ...prev, grades: false, attendance: false }));
    }
  };

  const handleAddChild = async () => {
    if (!emailInput) {
      setError('Please enter a valid email address');
      return;
    }
    
    try {
      await api.post(`/parents/${user.id}/add-child`, { email: emailInput });
      
      // Refresh children list
      const response = await api.get(`/parents/${user.id}/children`);
      setChildren(response.data);
      setAddChildVisible(false);
      setEmailInput('');
      
      // Show success message
      setError(null);
      alert('Child added successfully!');
      
    } catch (err) {
      const errorMsg = err.response?.data?.message || 
                      err.response?.data?.error || 
                      'Failed to add child. Please check the email and try again.';
      setError(errorMsg);
    }
  };

  const handleRemoveChild = async (childId) => {
    if (window.confirm('Are you sure you want to remove this child?')) {
      try {
        await api.delete(`/parents/${user.id}/${childId}`);
        const updatedChildren = children.filter(child => child.id !== childId);
        setChildren(updatedChildren);
        if (updatedChildren.length > 0 && selectedChild === childId) {
          setSelectedChild(updatedChildren[0].id);
        } else if (updatedChildren.length === 0) {
          setSelectedChild(null);
        }
        alert('Child removed successfully');
      } catch (err) {
        setError('Failed to remove child');
      }
    }
  };

  const gradeColumns = [
    { Header: 'Subject', accessor: 'class_name' },
    { Header: 'Assignment', accessor: 'name' },
    { 
      Header: 'Score', 
      accessor: 'score',
      Cell: ({ row }) => {
        const score = row.original.score;
        const maxScore = row.original.max_score;
        const percentage = (score / maxScore * 100).toFixed(1);
        return (
          <span className={percentage >= 70 ? 'text-green-600' : 'text-red-600'}>
            {score} / {maxScore} 
            <span className="ml-2 text-gray-500">({percentage}%)</span>
          </span>
        );
      }
    },
    { Header: 'Teacher', accessor: 'teacher_name' },
    { 
      Header: 'Date', 
      accessor: 'due_date',
      Cell: ({ value }) => new Date(value).toLocaleDateString()
    },
  ];

  const attendanceColumns = [
    { 
      Header: 'Date', 
      accessor: 'date',
      Cell: ({ value }) => new Date(value).toLocaleDateString()
    },
    { Header: 'Class', accessor: 'class_name' },
    { 
      Header: 'Status', 
      accessor: 'status',
      Cell: ({ value }) => {
        const colorMap = {
          present: 'bg-green-100 text-green-800',
          absent: 'bg-red-100 text-red-800',
          late: 'bg-yellow-100 text-yellow-800',
          excused: 'bg-blue-100 text-blue-800'
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorMap[value] || 'bg-gray-100'}`}>
            {value.toUpperCase()}
          </span>
        );
      }
    },
    { Header: 'Teacher', accessor: 'teacher_name' },
  ];

  
  // Calculate overall performance
  const overallPerformance = children.map(child => {
    const childGrades = grades.filter(g => g.student_id === child.id);
    const totalScore = childGrades.reduce((sum, grade) => sum + (grade.score / grade.max_score), 0);
    const average = childGrades.length > 0 ? (totalScore / childGrades.length * 100).toFixed(1) : 0;
    
    const childAttendance = attendance.filter(a => a.student_id === child.id);
    const presentCount = childAttendance.filter(a => a.status === 'present').length;
    const attendanceRate = childAttendance.length > 0 
      ? (presentCount / childAttendance.length * 100).toFixed(1)
      : 0;
    
    return {
      id: child.id,
      name: `${child.first_name} ${child.last_name}`,
      average,
      attendanceRate
    };
  });

  // Calculate attendance summary
  const attendanceSummary = attendance.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center md:text-left">
          Parent Portal
        </h2>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{error}</p>
          </div>
        )}

        {/* Summary Dashboard */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Family Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold">{children.length}</p>
              <p className="text-gray-600">Children</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold">
                {overallPerformance.length > 0 
                  ? (overallPerformance.reduce((sum, p) => sum + parseFloat(p.average), 0) / overallPerformance.length).toFixed(1) 
                  : '0.0'}
                <span className="text-lg">%</span>
              </p>
              <p className="text-gray-600">Avg. Performance</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold">
                {overallPerformance.length > 0 
                  ? (overallPerformance.reduce((sum, p) => sum + parseFloat(p.attendanceRate), 0) / overallPerformance.length).toFixed(1) 
                  : '0.0'}
                <span className="text-lg">%</span>
              </p>
              <p className="text-gray-600">Avg. Attendance</p>
            </div>
          </div>
        </div>

        {/* Children Management */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <h3 className="text-lg font-semibold mb-2 md:mb-0">My Children</h3>
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center"
              onClick={() => setAddChildVisible(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Child
            </button>
          </div>
          
          {loading.children ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : children.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="flex overflow-x-auto border-b">
                {children.map(child => (
                  <button
                    key={child.id}
                    className={`px-4 py-3 font-medium flex items-center whitespace-nowrap ${
                      selectedChild === child.id 
                        ? 'bg-blue-100 border-b-2 border-blue-500 text-blue-700' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedChild(child.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    {child.first_name} {child.last_name}
                    <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                      Grade {child.grade_level}
                    </span>
                    <button 
                      className="ml-2 text-gray-500 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveChild(child.id);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="mt-4 text-gray-600">No children linked to your account</p>
              <button 
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                onClick={() => setAddChildVisible(true)}
              >
                Add Your First Child
              </button>
            </div>
          )}
        </div>

        {/* Child Details */}
        {selectedChild && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Academic Performance */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-lg font-semibold">Academic Performance</h3>
              </div>
              
              {loading.grades ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : grades.length > 0 ? (
                <div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {gradeColumns.map((column, index) => (
                            <th 
                              key={index}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {column.Header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {grades
                          .filter(g => g.student_id === selectedChild)
                          .map((grade, index) => (
                            <tr key={index}>
                              {gradeColumns.map((column, colIndex) => (
                                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm">
                                  {column.Cell ? 
                                    column.Cell({ row: { original: grade } }) : 
                                    grade[column.accessor]}
                                </td>
                              ))}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Performance Summary */}
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Overall Performance</h4>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ 
                          width: `${grades.filter(g => g.student_id === selectedChild)
                            .reduce((sum, grade) => sum + (grade.score / grade.max_score), 0) / 
                            Math.max(grades.filter(g => g.student_id === selectedChild).length, 1) * 100}%` 
                        }}
                      ></div>
                    </div>
                    
                    <h4 className="font-medium mb-2">Assignment Breakdown</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {['A', 'B', 'C', 'D', 'F'].map(grade => {
                        const count = grades.filter(g => 
                          g.student_id === selectedChild && 
                          g.score / g.max_score >= 
                          { 'A': 0.9, 'B': 0.8, 'C': 0.7, 'D': 0.6 }[grade] &&
                          g.score / g.max_score < 
                          ({ 'A': 1.1, 'B': 0.9, 'C': 0.8, 'D': 0.7, 'F': 0.6 }[grade])
                        ).length;
                        
                        return (
                          <div key={grade} className="bg-gray-50 rounded p-3 text-center">
                            <p className="text-lg font-semibold">Grade {grade}</p>
                            <p className="text-2xl font-bold">{count}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-2 text-gray-600">No grade records found</p>
                </div>
              )}
            </div>

            {/* Attendance Records */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold">Attendance Records</h3>
              </div>
              
              {loading.attendance ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : attendance.length > 0 ? (
                <div>
                  <div className="overflow-x-auto mb-6">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {attendanceColumns.map((column, index) => (
                            <th 
                              key={index}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {column.Header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendance
                          .filter(a => a.student_id === selectedChild)
                          .map((record, index) => (
                            <tr key={index}>
                              {attendanceColumns.map((column, colIndex) => (
                                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm">
                                  {column.Cell ? 
                                    column.Cell({ value: record[column.accessor] }) : 
                                    record[column.accessor]}
                                </td>
                              ))}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Attendance Summary */}
                  <div>
                    <h4 className="font-medium mb-4">Attendance Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {Object.entries({
                        present: 'bg-green-100 text-green-800',
                        absent: 'bg-red-100 text-red-800',
                        late: 'bg-yellow-100 text-yellow-800',
                        excused: 'bg-blue-100 text-blue-800'
                      }).map(([status, classes]) => (
                        <div key={status} className={`rounded-lg p-4 text-center ${classes}`}>
                          <p className="text-xl font-bold">{attendanceSummary[status] || 0}</p>
                          <p className="capitalize">{status}</p>
                        </div>
                      ))}
                    </div>
                    
                    <h4 className="font-medium mb-2">Attendance Rate</h4>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ 
                          width: `${(attendanceSummary.present || 0) / attendance.length * 100}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-right">
                      {((attendanceSummary.present || 0) / attendance.length * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-2 text-gray-600">No attendance records found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Child Modal */}
        {addChildVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold">Add Child to Your Account</h3>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Child's Email
                  </label>
                  <input 
                    type="email"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter child's email address"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                  />
                  <p className="mt-1 text-gray-500 text-sm">
                    Use the email associated with your child's school account
                  </p>
                </div>
              </div>
              <div className="flex justify-end px-6 py-4 bg-gray-50 rounded-b-lg">
                <button 
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  onClick={() => setAddChildVisible(false)}
                >
                  Cancel
                </button>
                <button 
                  className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  onClick={handleAddChild}
                  disabled={!emailInput}
                >
                  Add Child
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

//scedule.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import moment from 'moment';
import { useUser } from '../context/userContext';
import Modal from './Modal';
import ClassDropdown from './ClassDropdown';
import api from '../axiosConfig.js';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  PlusIcon, ChevronLeftIcon, ChevronRightIcon, 
  CalendarIcon, ViewColumnsIcon as ViewGridIcon, EyeIcon as ViewListIcon,
  UserIcon, AcademicCapIcon, BuildingOffice2Icon,
  XMarkIcon, ClockIcon, ArrowPathIcon, FunnelIcon
} from '@heroicons/react/24/outline';
import AttendanceModal from './AttendanceModal';

export default function Scheduler() {
  const userContext = useUser();
  const [events, setEvents] = useState([]);
  const [resources, setResources] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week');
  const [filter, setFilter] = useState({
    teacher: null,
    class: null
  });
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [children, setChildren] = useState([]); // For parent role
  const [classTeacherMap, setClassTeacherMap] = useState({}); // Map class IDs to teachers

  const calendarRef = useRef(null);

  const currentUser = userContext?.user;
  const isAdmin = currentUser?.role === 'admin';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';
  const isParent = currentUser?.role === 'parent';
  
  // Determine edit permissions
  const canEdit = isAdmin || isTeacher;
  const canTakeAttendance = isTeacher || isAdmin;

  // Fetch data from API
  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let schedulesData = [], classList = [], teacherList = [], filteredList = [], classroomsData = [];

      if (isStudent) {
        // Student: fetch enrolled classes
        const enrolledRes = await api.get(`enrollments/${currentUser.id}`);
        const enrolledClassIds = enrolledRes.data.map(cls => cls.class_id)

        // Fetch schedules for enrolled classes
        const schedulesRes = await api.get('/schedules');
        schedulesData = schedulesRes.data.filter(s => 
          enrolledClassIds.includes(s.class_id)
        );

        // Get classes from enrollment data
        classList = enrolledRes.data;
        
        // Fetch teachers and classrooms
        const [teachersRes, classroomsRes] = await Promise.all([
          api.get('/teacher'),
          api.get('/classrooms')
        ]);
        filteredList = teachersRes.data.filter(teacher => teacher.classes.some(cls => enrolledClassIds.includes(cls.id)));
        teacherList = teachersRes.data;
        classroomsData = classroomsRes.data;

      } else if (isTeacher) {
        // Teacher: fetch classes taught by this teacher
        const classesRes = await api.get(`/teacher/${currentUser.id}/classes`);
        const teacherClassIds = classesRes.data.map(c => c.id);
        
        // Fetch schedules for teacher's classes
        const schedulesRes = await api.get('/schedules');
        schedulesData = schedulesRes.data.filter(s => 
          teacherClassIds.includes(s.class_id)
        );
        
        classList = classesRes.data;

        // Fetch teachers and classrooms
        const [teachersRes, classroomsRes] = await Promise.all([
          api.get('/teacher'),
          api.get('/classrooms')
        ]);
        teacherList = teachersRes.data;
        classroomsData = classroomsRes.data;

      } else if (isParent) {
        // Parent: fetch children and their schedules
        const childrenRes = await api.get(`/parent/${currentUser.id}/children`);
        const childrenIds = childrenRes.data.map(child => child.id);
        setChildren(childrenRes.data);
        
        // Fetch enrollments for all children
        const enrollments = [];
        for (const childId of childrenIds) {
          const enrollmentRes = await api.get(`enrollments/${childId}`);
          enrollments.push(...enrollmentRes.data);
        }
        
        const enrolledClassIds = [...new Set(enrollments.map(e => e.class_id))];
        
        // Fetch schedules for these classes
        const schedulesRes = await api.get('/schedules');
        schedulesData = schedulesRes.data.filter(s => 
          enrolledClassIds.includes(s.class_id)
        );
        
        // Get classes, teachers, and classrooms
        const [classesRes, teachersRes, classroomsRes] = await Promise.all([
          api.get('/classes'),
          api.get('/teacher'),
          api.get('/classrooms')
        ]);
        
        classList = classesRes.data.filter(c => 
          enrolledClassIds.includes(c.id)
        );
        teacherList = teachersRes.data;
        classroomsData = classroomsRes.data;

      } else if (isAdmin) {
        // Admin: fetch all data
        const [schedulesRes, classesRes, teachersRes, classroomsRes] = await Promise.all([
          api.get('/schedules'),
          api.get('/classes'),
          api.get('/teacher'),
          api.get('/classrooms')
        ]);
        schedulesData = schedulesRes.data;
        classList = classesRes.data;
        teacherList = teachersRes.data;
        classroomsData = classroomsRes.data;
      }
      // Create class-teacher map
      const classTeacherMapping = {};
      classList.forEach(cls => {
        classTeacherMapping[cls.id] = cls.teacher_id;
      });
      setClassTeacherMap(classTeacherMapping);

      // Process events
      const processedEvents = schedulesData.map(sched => {
        const teacher = teacherList.find(t => t.id === sched.teacher_id);
        const teacherName = teacher ? `${teacher.first_name} ${teacher.last_name}` : '' ;

        const startDate = moment().day(sched.day_of_week).set({
          hour: moment(sched.start_time, 'HH:mm:ss').hour(),
          minute: moment(sched.start_time, 'HH:mm:ss').minute(),
          second: 0
        }).toDate();

        const endDate = moment().day(sched.day_of_week).set({
          hour: moment(sched.end_time, 'HH:mm:ss').hour(),
          minute: moment(sched.end_time, 'HH:mm:ss').minute(),
          second: 0
        }).toDate();

        return {
          id: sched.id,
          title: `${sched.class_name} - ${sched.subject}`,
          start: startDate,
          end: endDate,
          resourceId: sched.classroom_id,
          classId: sched.class_id,
          teacherId: sched.teacher_id,
          dayOfWeek: sched.day_of_week,
          startTime: sched.start_time,
          endTime: sched.end_time,
          teacherName,
          className: sched.class_name,
          subject: sched.subject,
          color: `hsl(${(sched.class_id * 137) % 360}, 70%, 50%)`
        };
      });

      setEvents(processedEvents);
      setResources(classroomsData);
      setClasses(classList);
      setTeachers(teacherList || filteredList);
    } catch (error) {
      console.error('Error fetching data:', error);
      console.log(error);
      toast.error('Failed to load schedule data');
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation functions
  const navigate = (action) => {
    switch (action) {
      case 'PREV':
        setCurrentDate(moment(currentDate).subtract(1, view === 'day' ? 'day' : 'week').toDate());
        break;
      case 'NEXT':
        setCurrentDate(moment(currentDate).add(1, view === 'day' ? 'day' : 'week').toDate());
        break;
      case 'TODAY':
        setCurrentDate(new Date());
        break;
      default:
        break;
    }
  };

  // Handle view change
  const handleViewChange = (newView) => {
    setView(newView);
  };

  // Handle slot selection
  const handleSelectSlot = (resourceId, dayIndex, time) => {
    if (!canEdit) {
      toast.info('Only admins and teachers can create schedules');
      return;
    }

    const selectedDate = new Date(currentDate);
    selectedDate.setDate(selectedDate.getDate() + (dayIndex - selectedDate.getDay()));

    // Prevent creating events for past days
    if (selectedDate < new Date().setHours(0, 0, 0, 0)) {
      toast.error("Cannot create schedules for past dates");
      return;
    }

    const start = new Date(selectedDate);
    start.setHours(time, 0, 0, 0);

    const end = new Date(start);
    end.setHours(time + 1, 0, 0, 0);

    setCurrentEvent({
      start,
      end,
      resourceId,
      dayOfWeek: dayIndex,
      startTime: moment(start).format('HH:mm:ss'),
      endTime: moment(end).format('HH:mm:ss'),
      classId: null
    });
    setIsModalOpen(true);
  };

  // Handle event selection
  const handleSelectEvent = (event) => {
    // Prevent teachers from editing other teachers' classes
    if (isTeacher &&
        event.teacherId !== currentUser.id) {
      // Show event details for teacher (view only)
      const eventDetails = (
        <div className="p-3">
          <h3 className="font-bold text-lg mb-2">{event.title}</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center">
              <UserIcon className="w-4 h-4 mr-2 text-gray-500" />
              <span>{event.teacherName}</span>
            </div>
            <div className="flex items-center">
              <BuildingOffice2Icon className="w-4 h-4 mr-2 text-gray-500" />
              <span>{resources.find(r => r.id === event.resourceId)?.name || 'Unknown Room'}</span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-2 text-gray-500" />
              <span>{moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}</span>
            </div>
            <div className="flex items-center">
              <AcademicCapIcon className="w-4 h-4 mr-2 text-gray-500" />
              <span>{event.subject}</span>
            </div>
          </div>
          {/*{canTakeAttendance && (
            <button
              onClick={() => {
                toast.dismiss();
                setCurrentEvent(event);
                setIsAttendanceModalOpen(true);
              }}
              className="mt-2 w-full py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Take Attendance
            </button>
          )}*/}
        </div>
      );

      toast.info(eventDetails, {
        autoClose: false,
        closeButton: true,
        icon: <CalendarIcon className="w-5 h-5 text-blue-500" />
      });
      return;
    }

    // For students and parents, show event details without edit options
    if (isStudent || isParent) {
      const eventDetails = (
        <div className="p-3">
          <h3 className="font-bold text-lg mb-2">{event.title}</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center">
              <UserIcon className="w-4 h-4 mr-2 text-gray-500" />
              <span>{event.teacherName}</span>
            </div>
            <div className="flex items-center">
              <BuildingOffice2Icon className="w-4 h-4 mr-2 text-gray-500" />
              <span>{resources.find(r => r.id === event.resourceId)?.name || 'Unknown Room'}</span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-2 text-gray-500" />
              <span>{moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}</span>
            </div>
            <div className="flex items-center">
              <AcademicCapIcon className="w-4 h-4 mr-2 text-gray-500" />
              <span>{event.subject}</span>
            </div>
          </div>
          {isParent && (
            <div className="mt-2">
              <div className="font-medium text-sm">Your children in this class:</div>
              <ul className="list-disc pl-5">
                {children.filter(child => 
                  child.classes?.some(c => c.id === event.classId)
                ).map(child => (
                  <li key={child.id}>{child.first_name} {child.last_name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );

      toast.info(eventDetails, {
        autoClose: false,
        closeButton: true,
        icon: <CalendarIcon className="w-5 h-5 text-blue-500" />
      });
      return;
    }

    // For admins and teachers (editing their own classes)
    setCurrentEvent({
      id: event.id,
      classId: event.classId,
      start: new Date(event.start),
      end: new Date(event.end),
      resourceId: event.resourceId,
      dayOfWeek: event.dayOfWeek,
      startTime: event.startTime,
      endTime: event.endTime
    });
    setIsModalOpen(true);
  };

  // Open attendance modal
  const openAttendanceModal = (event) => {
    setCurrentEvent(event);
    setIsAttendanceModalOpen(true);
  };

  // Handle drag start
  const handleDragStart = (e, event) => {
    if (!canEdit) return;
    e.dataTransfer.setData("text/plain", event.id);
    setDraggedEvent(event);
  };

  // Handle drag over
  const handleDragOver = (e, resourceId, dayIndex, timeSlot) => {
    e.preventDefault();
    if (!canEdit) return;
    setDragOverSlot({ resourceId, dayIndex, timeSlot });
  };

  // Handle drop
  const handleDrop = async (e, resourceId, dayIndex, timeSlot) => {
    e.preventDefault();
    if (!canEdit || !draggedEvent) return;

    try {
      const eventId = e.dataTransfer.getData("text");
      const event = events.find(ev => ev.id === eventId);

      if (!event) return;

      const newStart = new Date(currentDate);
      newStart.setDate(newStart.getDate() + (dayIndex - newStart.getDay()));
      newStart.setHours(timeSlot, 0, 0, 0);

      // Prevent moving events to past dates
      if (newStart < new Date().setHours(0, 0, 0, 0)) {
        toast.error("Cannot move schedules to past dates");
        return;
      }

      const duration = moment(event.end).diff(moment(event.start), 'hours');
      const newEnd = new Date(newStart);
      newEnd.setHours(timeSlot + duration, 0, 0, 0);

      await api.patch(`/schedules/${event.id}`, {
        classroom_id: resourceId,
        day_of_week: dayIndex,
        start_time: moment(newStart).format('HH:mm:ss'),
        end_time: moment(newEnd).format('HH:mm:ss')
      });

      const updatedEvent = {
        ...event,
        start: newStart,
        end: newEnd,
        resourceId,
        dayOfWeek: dayIndex,
        startTime: moment(newStart).format('HH:mm:ss'),
        endTime: moment(newEnd).format('HH:mm:ss')
      };

      setEvents(events.map(ev => ev.id === event.id ? updatedEvent : ev));
      toast.success('Schedule updated successfully');
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update schedule');
    } finally {
      setDraggedEvent(null);
      setDragOverSlot(null);
    }
  };

  // Save event handler
  const handleSaveEvent = async () => {
    if (!currentEvent?.classId) {
      toast.error('Please select a class');
      return;
    }

    try {
      if (currentEvent.id) {
        await api.patch(`/schedules/${currentEvent.id}`, {
          class_id: currentEvent.classId,
          classroom_id: currentEvent.resourceId,
          day_of_week: currentEvent.dayOfWeek,
          start_time: currentEvent.startTime,
          end_time: currentEvent.endTime
        });

        setEvents(events.map(ev =>
          ev.id === currentEvent.id ? {
            ...ev,
            classId: currentEvent.classId,
            title: classes.find(c => c.id === currentEvent.classId)?.name || 'Unknown Class',
            start: currentEvent.start,
            end: currentEvent.end,
            resourceId: currentEvent.resourceId
          } : ev
        ));
        toast.success('Schedule updated successfully');
      } else {
        // Validate event date
        const eventDate = new Date(currentEvent.start);
        if (eventDate < new Date().setHours(0, 0, 0, 0)) {
          toast.error("Cannot create schedules for past dates");
          return;
        }

        const response = await api.post('/schedules', {
          class_id: currentEvent.classId,
          classroom_id: currentEvent.resourceId,
          day_of_week: currentEvent.dayOfWeek,
          start_time: currentEvent.startTime,
          end_time: currentEvent.endTime
        });
        const newEvent = response.data;
        const classInfo = classes.find(c => c.id === currentEvent.classId);
        const teacher = teachers.find(t => t.id === classTeacherMap[currentEvent.classId]);
        const teacherName = teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown Teacher';

        const newEventObj = {
          id: newEvent.id,
          title: `${classInfo?.name || 'Unknown'} - ${classInfo?.subject || ''}`,
          start: currentEvent.start,
          end: currentEvent.end,
          resourceId: currentEvent.resourceId,
          classId: currentEvent.classId,
          teacherId: classTeacherMap[currentEvent.classId],
          dayOfWeek: currentEvent.dayOfWeek,
          startTime: currentEvent.startTime,
          endTime: currentEvent.endTime,
          teacherName,
          className: classInfo?.name,
          subject: classInfo?.subject,
          color: classInfo 
            ? `hsl(${(classInfo.id * 137) % 360}, 70%, 50%)` 
            : '#cccccc'
        };

        setEvents([...events, newEventObj]);
        toast.success('Schedule created successfully');
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error(error.response?.data?.error || 'Failed to save schedule');
    }
  };

  // Delete event handler
  const handleDeleteEvent = async () => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;

    try {
      await api.delete(`/schedules/${currentEvent.id}`);
      setEvents(events.filter(ev => ev.id !== currentEvent.id));
      setIsModalOpen(false);
      toast.success('Schedule deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete schedule');
    }
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    return (
      (!filter.teacher || event.teacherId === filter.teacher) &&
      (!filter.class || event.classId === filter.class)
    );
  });

  // Clear all filters
  const clearFilters = () => {
    setFilter({
      teacher: null,
      class: null
    });
  };

  // Render calendar grid
  const renderCalendarGrid = () => {
    const timeSlots = Array.from({ length: 14 }, (_, i) => i + 7); // 7am to 8pm
    const days = Array.from({ length: 7 }, (_, i) => i); // Sunday to Saturday

    const currentDay = currentDate.getDay();
    const currentWeekStart = new Date(currentDate);
    currentWeekStart.setDate(currentDate.getDate() - currentDay);

    return (
      <div className="overflow-auto h-[calc(100vh-300px)]" ref={calendarRef}>
        <div className="grid grid-cols-8 gap-px bg-gray-200 border border-gray-200">
          {/* Header row */}
          <div className="bg-gray-100 p-2 sticky top-0 z-10 border-b border-gray-300">
            <div className="h-10 flex items-center justify-center">
              <span className="text-gray-500">Time</span>
            </div>
          </div>

          {days.map(dayIndex => {
            const day = new Date(currentWeekStart);
            day.setDate(day.getDate() + dayIndex);
            const isToday = moment(day).isSame(new Date(), 'day');
            const isPast = day < new Date().setHours(0, 0, 0, 0);

            return (
              <div
                key={dayIndex}
                className={`bg-blue-500 p-2 sticky top-0 z-10 border-b border-gray-300 ${isToday ? 'bg-blue-50' : ''} ${isPast ? 'opacity-70' : ''}`}
              >
                <div className={`text-center font-medium text-gray-700 ${isToday ? 'text-white bg-green-600 rounded' : ''} ${isPast ? 'opacity-70' : ''}`}>
                  {moment(day).format('ddd')}
                </div>
                <div className={`text-center text-sm ${isToday ? 'text-white' : ''}`}>
                  {moment(day).format('MMM D')}
                </div>
              </div>
            );
          })}

          {/* Time slots */}
          {timeSlots.map(time => (
            <React.Fragment key={time}>
              <div className="bg-gray-50 p-2 border-r border-gray-200 flex items-center justify-center text-sm text-gray-500 sticky left-0 z-10">
                {time > 12 ? `${time - 12} PM` : `${time === 12 ? 12 : time} AM`}
              </div>

              {days.map(dayIndex => {
                const eventsInSlot = filteredEvents.filter(event =>
                  event.dayOfWeek === dayIndex &&
                  moment(event.start).hours() <= time &&
                  moment(event.end).hours() > time
                );

                const day = new Date(currentWeekStart);
                day.setDate(day.getDate() + dayIndex);
                const isPast = day < new Date().setHours(0, 0, 0, 0);

                return (
                  <div
                    key={`${dayIndex}-${time}`}
                    className={`bg-white min-h-[60px] relative group ${dragOverSlot?.dayIndex === dayIndex && dragOverSlot?.timeSlot === time ? 'bg-blue-50' : ''} ${isPast ? 'bg-gray-50' : ''}`}
                    onDragOver={(e) => !isPast && canEdit && handleDragOver(e, resources[0]?.id, dayIndex, time)}
                    onDrop={(e) => !isPast && canEdit && handleDrop(e, resources[0]?.id, dayIndex, time)}
                  >
                    {eventsInSlot.map(event => (
                      <div
                        key={event.id}
                        className="absolute w-full p-1 rounded cursor-pointer"
                        style={{
                          top: `${(moment(event.start).minutes() / 60) * 100}%`,
                          height: `${moment.duration(moment(event.end).diff(moment(event.start))).asHours() * 60}px`,
                          backgroundColor: event.color,
                          zIndex: 10
                        }}
                        onClick={() => handleSelectEvent(event)}
                        draggable={canEdit && !isPast}
                        onDragStart={(e) => canEdit && !isPast && handleDragStart(e, event)}
                      >
                        <div className="bg-white bg-opacity-90 h-full rounded p-1.5">
                          <div className="font-medium text-xs truncate">{event.title}</div>
                          <div className="text-xs opacity-80">
                            {moment(event.start).format('h:mm')} - {moment(event.end).format('h:mm A')}
                          </div>
                        </div>
                      </div>
                    ))}

                    {canEdit && !isPast && (
                      <button
                        className="w-full h-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-gray-400 hover:text-blue-500"
                        onClick={() => handleSelectSlot(resources[0]?.id, dayIndex, time)}
                      >
                        <PlusIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <ArrowPathIcon className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="mt-4 text-lg text-gray-600">Loading schedule data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                  <CalendarIcon className="w-6 h-6 mr-2 text-blue-600" />
                  School Schedule Calendar
                </h1>
                <p className="text-gray-600 mt-1">
                  {moment(currentDate).format('ddd MMMM YYYY')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => navigate('PREV')}
                    className="p-2 rounded-lg hover:bg-gray-200"
                    aria-label="Previous"
                  >
                    <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                  </button>

                  <button
                    onClick={() => navigate('TODAY')}
                    className="px-3 py-1 text-sm bg-white text-blue-600 rounded-lg hover:bg-blue-50 border border-blue-100"
                  >
                    Today
                  </button>

                  <button
                    onClick={() => navigate('NEXT')}
                    className="p-2 rounded-lg hover:bg-gray-200"
                    aria-label="Next"
                  >
                    <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleViewChange('day')}
                    className={`px-3 py-2 text-sm flex items-center ${view === 'day' ? 'bg-blue-100 text-blue-600' : 'bg-white'}`}
                  >
                    <ViewListIcon className="w-4 h-4 mr-1" />
                    Day
                  </button>
                  <button
                    onClick={() => handleViewChange('week')}
                    className={`px-3 py-2 text-sm flex items-center ${view === 'week' ? 'bg-blue-100 text-blue-600' : 'bg-white'}`}
                  >
                    <ViewGridIcon className="w-4 h-4 mr-1" />
                    Week
                  </button>
                </div>

                <button
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                >
                  <FunnelIcon className="w-4 h-4" />
                  <span>Filters</span>
                </button>

                <button
                  onClick={fetchData}
                  className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  <span>Refresh</span>
                </button>

                {canEdit && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-md"
                  >
                    <PlusIcon className="w-5 h-5" />
                    <span>Add Schedule</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter Panel - Collapsible */}
          {showFilterPanel && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center">
                  <FunnelIcon className="w-5 h-5 mr-2 text-blue-500" />
                  Filter Schedules
                </h3>
                <button
                  onClick={() => setShowFilterPanel(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(isAdmin || isStudent || isParent) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <UserIcon className="w-4 h-4 mr-2 text-gray-500" />
                      Teacher
                    </label>
                    <select
                      className="w-full p-2 border rounded-lg bg-white"
                      value={filter.teacher || ''}
                      onChange={(e) => setFilter({...filter, teacher: e.target.value ? parseInt(e.target.value) : null})}
                    >
                      <option value="">All Teachers</option>
                      {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.first_name} {teacher.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {(isAdmin || isTeacher || isParent) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <AcademicCapIcon className="w-4 h-4 mr-2 text-gray-500" />
                      Class
                    </label>
                    <select
                      className="w-full p-2 border rounded-lg bg-white"
                      value={filter.class || ''}
                      onChange={(e) => setFilter({...filter, class: e.target.value ? parseInt(e.target.value) : null})}
                    >
                      <option value="">All Classes</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {(filter.teacher || filter.class) && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Calendar Grid */}
          <div className="p-4">
            {renderCalendarGrid()}
          </div>
        </div>
      </div>

      {/* Event Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {currentEvent?.id ? 'Edit Schedule' : 'Create New Schedule'}
            </h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Class:</label>
              <ClassDropdown
                classes={classes}
                currentUser={currentUser}
                value={currentEvent?.classId}
                onChange={(classId) => setCurrentEvent({...currentEvent, classId})}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Day of Week:</label>
              <select
                className="w-full p-2 border rounded-lg bg-gray-50"
                value={currentEvent?.dayOfWeek || 1}
                onChange={(e) => setCurrentEvent({...currentEvent, dayOfWeek: parseInt(e.target.value)})}
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Classroom:</label>
              <select
                className="w-full p-2 border rounded-lg bg-gray-50"
                value={currentEvent?.resourceId || ''}
                onChange={(e) => setCurrentEvent({...currentEvent, resourceId: parseInt(e.target.value)})}
              >
                <option value="">Select a classroom</option>
                {resources.map(resource => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name} ({resource.building}) - Capacity: {resource.capacity}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Start Time:</label>
                <input
                  type="time"
                  className="w-full p-2 border rounded-lg bg-gray-50"
                  value={currentEvent?.startTime || '08:00'}
                  onChange={(e) => setCurrentEvent({...currentEvent, startTime: e.target.value})}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">End Time:</label>
                <input
                  type="time"
                  className="w-full p-2 border rounded-lg bg-gray-50"
                  value={currentEvent?.endTime || '09:00'}
                  onChange={(e) => setCurrentEvent({...currentEvent, endTime: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            {currentEvent?.id && (
              <button
                onClick={handleDeleteEvent}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
              >
                <span>Delete</span>
              </button>
            )}
            <div className="flex space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                disabled={!currentEvent?.classId || !currentEvent?.resourceId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Attendance Modal */}
      {isAttendanceModalOpen && currentEvent && (
        <AttendanceModal
          event={currentEvent}
          onClose={() => setIsAttendanceModalOpen(false)}
        />
      )}
      </div>
  );
}

//TeacherClassAssignment.jsx
import React, { useState, useEffect, useMemo } from 'react';
import api from '../axiosConfig';
import { PlusIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TeacherClassAssignment = () => {
  // State management
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [classTeachers, setClassTeachers] = useState({});
  const [savingClassId, setSavingClassId] = useState(null);
  const [teacherSearch, setTeacherSearch] = useState('');

  // Fetch classes and teachers on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, teachersRes] = await Promise.all([
        api.get('/classes?include=teachers'),
        api.get('/users?role=teacher')
      ]);
      
      setClasses(classesRes.data);
      setTeachers(teachersRes.data);
      
      const initialAssignments = {};
      classesRes.data.forEach(cls => {
        initialAssignments[cls.id] = (cls.teachers || []).map(t => ({
          teacherId: t.id,
          subject: t.subject
        }));
      });
      setClassTeachers(initialAssignments);
    } catch (err) {
      toast.error('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle teacher assignment change
  const handleTeacherChange = (classId, index, field, value) => {
    setClassTeachers(prev => {
      const updatedAssignments = { ...prev };
      const classAssignments = [...(updatedAssignments[classId] || [])];
      
      classAssignments[index] = {
        ...classAssignments[index],
        [field]: value
      };
      
      updatedAssignments[classId] = classAssignments;
      return updatedAssignments;
    });
  };

  // Add new teacher assignment
  const addTeacherAssignment = (classId) => {
    setClassTeachers(prev => ({
      ...prev,
      [classId]: [
        ...(prev[classId] || []),
        { teacherId: '', subject: '' }
      ]
    }));
  };

  // Remove teacher assignment
  const removeTeacherAssignment = (classId, index) => {
    setClassTeachers(prev => {
      const updatedAssignments = { ...prev };
      updatedAssignments[classId] = (updatedAssignments[classId] || []).filter((_, i) => i !== index);
      return updatedAssignments;
    });
    
    toast.info('Assignment removed. Save to confirm changes.');
  };

  // Save teacher assignments for a class
  const saveClassTeachers = async (classId) => {
    try {
      setSavingClassId(classId);
      
      const currentAssignments = classTeachers[classId] || [];
      
      // Filter out empty assignments and remove duplicates
      const assignmentsToSave = [];
      const uniqueKeys = new Set();
      
      for (const assignment of currentAssignments) {
        if (assignment.teacherId && assignment.subject) {
          const key = `${assignment.teacherId}-${assignment.subject}`;
          if (!uniqueKeys.has(key)) {
            uniqueKeys.add(key);
            assignmentsToSave.push({
              teacherId: assignment.teacherId,
              subject: assignment.subject
            });
          }
        }
      }
      
      const response = await api.put(`/classes/${classId}/teachers`, {
        teachers: assignmentsToSave
      });
      
      // Update the class in the classes array
      setClasses(prev => prev.map(cls => 
        cls.id === classId 
          ? { 
              ...cls, 
              teachers: response.data.updatedAssignments || []
            } 
          : cls
      ));
      
      // Update our local assignments state with the saved data
      setClassTeachers(prev => ({
        ...prev,
        [classId]: (response.data.updatedAssignments || []).map(a => ({
          teacherId: a.teacher_id,
          subject: a.subject
        }))
      }));
      
      toast.success(`Teacher assignments updated successfully!`);
    } catch (err) {
      let errorMsg = 'Failed to update teacher assignments. Please try again.';
      
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
        if (err.response.data.details) {
          errorMsg += `: ${err.response.data.details}`;
        }
      }
      
      toast.error(errorMsg);
    } finally {
      setSavingClassId(null);
    }
  };

  // Filter classes based on search term
  const filteredClasses = classes.filter(cls => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Check class name and subject
    if (cls.name.toLowerCase().includes(searchLower) || 
        cls.subject.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Check teacher names
    if (cls.teachers && cls.teachers.some(teacher => {
      const teacherName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.toLowerCase();
      return teacherName.includes(searchLower);
    })) {
      return true;
    }
    
    return false;
  });

  // Filter teachers based on search term
  const filteredTeachers = useMemo(() => {
    if (!teacherSearch.trim()) return teachers;
    
    const searchLower = teacherSearch.toLowerCase();
    return teachers.filter(teacher => {
      const fullName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.toLowerCase();
      return fullName.includes(searchLower);
    });
  }, [teachers, teacherSearch]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedClasses = filteredClasses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);

  // Get teacher name by ID
  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown Teacher';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 rounded-lg shadow-lg">
      <ToastContainer position="bottom-right" autoClose={3000} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Teacher Class Assignment</h1>
        <p className="text-gray-600 mt-1">Assign teachers to classes by subject</p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search Classes
        </label>
        <input
          type="text"
          placeholder="Search by class name, subject, or teacher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="sr-only">Loading...</span>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No classes found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
          
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </div>
      ) : (
        <>
          {/* Classes Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                    Teacher Assignments
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedClasses.map(cls => (
                  <tr key={cls.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{cls.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{cls.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Grade {cls.grade_level}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-3">
                        {(Array.isArray(classTeachers[cls.id]) ? classTeachers[cls.id] : []).map((assignment, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="flex-1 relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                              </div>
                              <select
                                value={assignment.teacherId || ''}
                                onChange={(e) => handleTeacherChange(
                                  cls.id, 
                                  index, 
                                  'teacherId', 
                                  e.target.value
                                )}
                                className="w-full pl-10 p-2 border border-gray-300 rounded-md shadow-sm"
                                disabled={savingClassId === cls.id}
                              >
                                <option value="">Select a teacher</option>
                                {filteredTeachers.map(teacher => (
                                  <option key={teacher.id} value={teacher.id}>
                                    {teacher.first_name} {teacher.last_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <input
                              type="text"
                              value={assignment.subject || ''}
                              onChange={(e) => handleTeacherChange(
                                cls.id, 
                                index, 
                                'subject', 
                                e.target.value
                              )}
                              placeholder="Subject"
                              className="flex-1 p-2 border border-gray-300 rounded-md shadow-sm"
                              disabled={savingClassId === cls.id}
                            />
                            
                            <button
                              onClick={() => removeTeacherAssignment(cls.id, index)}
                              className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50"
                              title="Remove assignment"
                              disabled={savingClassId === cls.id}
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                        
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => addTeacherAssignment(cls.id)}
                            className="flex items-center text-blue-500 hover:text-blue-700 text-sm"
                            disabled={savingClassId === cls.id}
                          >
                            <PlusIcon className="w-4 h-4 mr-1" />
                            Add Teacher Assignment
                          </button>
                          
                          <div className="flex-1 max-w-xs ml-4">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                placeholder="Search teachers..."
                                value={teacherSearch}
                                onChange={(e) => setTeacherSearch(e.target.value)}
                                className="w-full pl-10 p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => saveClassTeachers(cls.id)}
                          disabled={savingClassId !== null}
                          className={`px-4 py-2 text-white rounded-md ${
                            savingClassId === cls.id 
                              ? 'bg-blue-400 cursor-not-allowed' 
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {savingClassId === cls.id ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Saving...
                            </span>
                          ) : (
                            'Save Assignments'
                          )}
                        </button>
                        
                        <button
                          onClick={fetchData}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                          Refresh All
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredClasses.length)} of {filteredClasses.length} classes
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === 1 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-700 px-3 py-1">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === totalPages 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeacherClassAssignment;

//NotoficationCenter.jsx
import { useEffect } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import { BellIcon } from '@heroicons/react/24/outline';

export default function NotificationCenter() {
  const { notifications, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected) {
      console.log('Attempting to connect to WebSocket...');
    }
  }, [isConnected]);

  // return (
  //   <div className="notification-center text-black">
      
  //     <ul>
  //       {notifications.map((notification, index) => (
  //         <li key={index}>
  //           {notification.type === 'system' ? '⚠️' : '✉️'} 
  //           {notification.message}
          
  //         </li>

  //       ))}
  //     </ul>
  //   </div>
  // );
}


