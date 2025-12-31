import DashboardLayout from '@/components/layouts/dashboard-layout'
import { UsersIcon, QrCodeIcon, ClockIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

const stats = [
  { name: 'Total Parents', value: '128', icon: UsersIcon },
  { name: 'Active QR Codes', value: '98', icon: QrCodeIcon },
  { name: 'Today\'s Pickups', value: '45', icon: ClockIcon },
  { name: 'Active Guards', value: '4', icon: ShieldCheckIcon },
]

const pendingApprovals = [
  { id: 1, type: 'Parent', name: 'Sarah Wilson', status: 'Pending', time: '2 hours ago' },
  { id: 2, type: 'Sub-Parent', name: 'Mike Brown', status: 'Pending', time: '4 hours ago' },
]

export default function AdminDashboard() {
  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="bg-white px-6 py-8 rounded-lg shadow"
            >
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-primary-50">
                  <stat.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="ml-4 text-sm font-medium text-gray-900">{stat.name}</h3>
              </div>
              <p className="mt-6 text-3xl font-semibold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Approvals */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-base font-semibold text-gray-900">Pending Approvals</h2>
              <div className="mt-6 flow-root">
                <ul role="list" className="-my-5 divide-y divide-gray-200">
                  {pendingApprovals.map((item) => (
                    <li key={item.id} className="py-5">
                      <div className="flex items-center gap-x-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.type} • {item.time}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <button className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500">
                            Review
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-base font-semibold text-gray-900">Today's Activity</h2>
              <div className="mt-6 flow-root">
                <ul role="list" className="-my-5 divide-y divide-gray-200">
                  <li className="py-5">
                    <div className="flex items-center gap-x-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          John Doe picked up by Guard Mike
                        </p>
                        <p className="text-sm text-gray-500">
                          10 minutes ago
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                          Completed
                        </span>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}