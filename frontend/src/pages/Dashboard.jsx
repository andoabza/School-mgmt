import {
  CalendarIcon,
  BookOpenIcon,
  CheckCircleIcon,
  BellIcon,
  UsersIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const Dashboard = ({ user, notifications }) => {
  // Dashboard stats
  const stats = [
    { name: 'Upcoming Classes', value: 3, icon: CalendarIcon, change: '+2', changeType: 'positive' },
    { name: 'Pending Assignments', value: 5, icon: BookOpenIcon, change: '-1', changeType: 'negative' },
    { name: 'Unread Messages', value: notifications.filter(n => !n.read).length, icon: BellIcon, change: '+3', changeType: 'positive' },
    { name: 'Attendance Rate', value: '92%', icon: CheckCircleIcon, change: '+2%', changeType: 'positive' }
  ];

  // Recent activity
  const recentActivity = [
    { id: 1, title: 'Math Class', description: 'New assignment posted', time: '2 hours ago', icon: BookOpenIcon },
    { id: 2, title: 'School Event', description: 'Parent-teacher meeting', time: '1 day ago', icon: UsersIcon },
    { id: 3, title: 'Science Class', description: 'Lab report deadline extended', time: '2 days ago', icon: DocumentTextIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user.firstName}!</h2>
        <p className="mt-1 text-gray-500">Here's what's happening today in your school.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-indigo-500 p-3">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd>
                      <div className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.change}
                        </div>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {recentActivity.map((activity) => (
            <li key={activity.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <activity.icon className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-500">{activity.description}</p>
                </div>
                <div className="ml-auto text-sm text-gray-500">
                  {activity.time}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Upcoming events */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Upcoming Events</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="border-l-4 border-indigo-500 pl-4 py-2">
            <p className="text-sm font-medium text-gray-900">Parent-Teacher Meeting</p>
            <p className="text-sm text-gray-500">Friday, 3:00 PM</p>
          </div>
          <div className="border-l-4 border-green-500 pl-4 py-2 mt-2">
            <p className="text-sm font-medium text-gray-900">Science Fair</p>
            <p className="text-sm text-gray-500">Next Monday, All Day</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;