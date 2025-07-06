import React, { useState, useEffect } from 'react';
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

const MainLayout = ({ children, user, menuItems, sidebarOpen, setSidebarOpen,
                    handleLogout, notifications, setNotificationOpen, ws}) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="bg-gray-50 w-full">
      {/* Mobile sidebar */}
      <MobileSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        menuItems={menuItems}
        handleLogout={handleLogout}
        navigate={navigate}
        location={location}
      />

      {/* Static sidebar for desktop */}
      <DesktopSidebar
        menuItems={menuItems}
        handleLogout={handleLogout}
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
        setNotificationOpen={setNotificationOpen}
        notifications={notifications}
        ws={ws}
      />
    </div>
  );
};

const MobileSidebar = ({ sidebarOpen, setSidebarOpen, menuItems, handleLogout, navigate, location }) => (
  <div className={`md:hidden fixed inset-0 z-40 ${sidebarOpen ? 'block' : 'hidden'}`}>
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
    <div className="relative flex flex-col w-72 max-w-xs h-full bg-indigo-700">
      <div className="flex items-center justify-between h-16 px-4">
        <span className="text-white text-xl font-bold">School Portal</span>
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
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-2 py-3 text-sm font-medium rounded-md text-indigo-100 hover:bg-indigo-600"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
          Logout
        </button>
      </nav>
    </div>
  </div>
);

const DesktopSidebar = ({ menuItems, handleLogout, navigate, location }) => (
  <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
    <div className="flex flex-col flex-grow pt-5 bg-indigo-700 overflow-y-auto">
      <div className="flex items-center flex-shrink-0 px-4">
        <span className="text-white text-xl font-bold">School Portal</span>
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
        <div className="px-2 pb-4">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-2 py-3 text-sm font-medium rounded-md text-indigo-100 hover:bg-indigo-600"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </div>
    </div>
  </div>
);

const TopNavigation = ({ setSidebarOpen, setNotificationOpen, notifications, user }) => (
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

        <div className="relative ml-3">
          <div className="flex items-center space-x-2">
            <span className="hidden md:block text-sm font-medium text-gray-700">
              {user.firstName} {user.lastName}
            </span>
            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const NotificationCenterWrapper = ({
  notificationOpen,
  setNotificationOpen,
  notifications,
  markAsRead,
  markAllAsRead,
  ws
}) => (
  <div className={notificationOpen ? '' : 'hidden'}>
    <NotificationCenter
      open={notificationOpen}
      onClose={() => setNotificationOpen(false)}
      notifications={notifications}
      markAsRead={markAsRead}
      markAllAsRead={markAllAsRead}
      ws={ws}
    />
  </div>
);

const AppRoutes = ({ user, notifications }) => (
  <Routes>
    <Route path="/" element={<Dashboard user={user} notifications={notifications} />} />

    <Route path="/dashboard" element={<Dashboard user={user} notifications={notifications} />} />
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
{/*     <Route path="*" element={<Navigate to="/dashboard" />} /> */}
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
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
  );
}
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
{/*         <Route path="*" element={<Navigate to="/login" replace />} /> */}
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
