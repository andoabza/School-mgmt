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
import AttendanceTracker from './components/AttendanceTracker';
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