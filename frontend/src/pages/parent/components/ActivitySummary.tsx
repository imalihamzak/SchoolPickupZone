import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { ClockIcon, TruckIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { API_BASE_URL } from '@/lib/api/link'
interface Activity {
  id: number
  type: string
  date: string
  time: string
  guard: string
  status: string
}

export default function ActivitySummary() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get(`${API_BASE_URL}/pickups`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const mapped = res.data.map((log: any) => {
          const pickupDate = new Date(log.pickup_time)
          return {
            id: log.id,
            type: 'pickup',
            date: pickupDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
            time: pickupDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
            guard: log.guardian_name,
            status: log.status || 'Completed'
          }
        })

        setActivities(mapped)
        setLoading(false)
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Failed to fetch pickup logs')
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : activities.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No recent activities</p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-200">
              {activities.map((activity) => (
                <li key={activity.id} className="p-5 hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {activity.type === 'pickup' ? (
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <TruckIcon className="h-6 w-6 text-green-600" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <CalendarIcon className="h-6 w-6 text-blue-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          Pickup by {activity.guard}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          ${activity.status === 'Completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {activity.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <ClockIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                        <p>{activity.date} at {activity.time}</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="bg-gray-50 px-5 py-3 text-right">
              <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
                View All Activities
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
