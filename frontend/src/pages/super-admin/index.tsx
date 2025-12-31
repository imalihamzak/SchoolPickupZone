import DashboardLayout from '@/components/layouts/dashboard-layout'
import { 
  BanknotesIcon, 
  UserGroupIcon, 
  QrCodeIcon,
  UsersIcon,
  UserIcon,
  ArrowUpIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/link'
type Stats = {
  totalSchools: number
  totalRevenue: number
  activeAdmins: number
  totalStudents: number
  totalParents: number
}




const recentActivities = [
  { id: 1, type: 'subscription', school: 'Lincoln High', action: 'Renewed subscription', date: '1 hour ago' },
  { id: 2, type: 'admin', school: 'Washington Prep', action: 'Added new admin', date: '2 hours ago' },
  { id: 3, type: 'student', school: 'St. Mary School', action: 'Bulk student import', date: '3 hours ago' },
  { id: 4, type: 'parent', school: 'Riverside Elementary', action: 'New parent registrations', date: '5 hours ago' }
]

const quickActions = [
  { name: 'Add New Admin', color: 'bg-indigo-600 hover:bg-indigo-700', icon: UserIcon },
  { name: 'View Subscriptions', color: 'bg-violet-600 hover:bg-violet-700', icon: BanknotesIcon },
  { name: 'Add New School', color: 'bg-blue-600 hover:bg-blue-700', icon: BuildingOfficeIcon },
  { name: 'Generate Report', color: 'bg-emerald-600 hover:bg-emerald-700', icon: ArrowUpIcon },
  { name: 'Invite Admin', color: 'bg-orange-600 hover:bg-orange-700', icon: UserGroupIcon },
]




export default function SuperAdminDashboard() {


  const [stats, setStats] = useState<Stats>({
    totalSchools: 0,
    totalRevenue: 0,
    activeAdmins: 0,
    totalStudents: 0,
    totalParents: 0,
  })
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/superadmin/dashboard-stats`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })
        setStats(response.data)
      } catch (err) {
        console.error('Dashboard stats error:', err)
      }
    }
  
    fetchStats()
  }, [])
  
  const statsDisplay = [
    { name: 'Total Schools', value: stats.totalSchools, color: 'text-blue-500 bg-blue-50' },
    { name: 'Total Revenue', value: `$${stats.totalRevenue}`, color: 'text-green-500 bg-green-50' },
    { name: 'Active Admins', value: stats.activeAdmins, color: 'text-purple-500 bg-purple-50' },
    { name: 'Total Students', value: stats.totalStudents, color: 'text-yellow-500 bg-yellow-50' },
    { name: 'Total Parents', value: stats.totalParents, color: 'text-pink-500 bg-pink-50' },
  ]

  return (
    <DashboardLayout role="super-admin">
      <div className="space-y-8 bg-gray-50 p-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
      {statsDisplay.map((stat) => (
  <div
    key={stat.name}
    className={`rounded-xl shadow-md border border-gray-100 transition-all duration-200 hover:shadow-lg p-6 ${stat.color}`}
  >
    <p className="text-sm font-medium">{stat.name}</p>
    <p className="text-2xl font-bold mt-1">{stat.value}</p>
  </div>
))}

        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 transition-all duration-200 hover:shadow-lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <div className="mt-6 space-y-6">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-gray-900">{activity.school}</p>
                      <p className="text-sm text-gray-500">{activity.action}</p>
                    </div>
                    <span className="text-sm text-gray-400">{activity.date}</span>
                  </div>
                ))}
                <button className="w-full py-2.5 px-4 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-600 transition-colors">
                  View All Activity
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-100 transition-all duration-200 hover:shadow-lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <div className="mt-6 grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
  <button
    key={action.name}
    className={`flex items-center gap-2 justify-center py-2.5 px-4 ${action.color} text-white rounded-lg text-sm font-medium 
    transition-all duration-200 shadow-sm hover:shadow-md active:scale-95`}
  >
    <action.icon className="w-5 h-5" />
    {action.name}
  </button>
))}

              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}