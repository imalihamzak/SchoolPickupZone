import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import axios from 'axios';
import { UserCircleIcon, ArrowLeftIcon, ClockIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { API_BASE_URL, LOCAL_BASE } from '@/lib/api/link';
export default function ChildDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [child, setChild] = useState<any>(null);
  const [pickupLogs, setPickupLogs] = useState<any[]>([]);

  const fetchChild = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/children/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChild(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load child info');
    }
  };

  const fetchPickupLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/pickups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const childLogs = res.data.filter((log: any) => log.child_id.toString() === id);
      setPickupLogs(childLogs);
    } catch (err: any) {
      toast.error('Failed to load pickup logs');
    }
  };

  useEffect(() => {
    fetchChild();
    fetchPickupLogs();
  }, []);

  const lastPickup = pickupLogs[0];

  return (
    <DashboardLayout role="parent">
      <div className="max-w-3xl mx-auto mt-10 bg-white shadow-md rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back
          </button>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Child Profile</h1>

        <div className="flex items-center gap-6">
          {child?.photo_path ? (
            <img
              src={`${LOCAL_BASE}/${child.photo_path}`}
              alt={child.full_name}
              className="h-24 w-24 rounded-full object-cover border"
            />
          ) : (
            <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center">
              <UserCircleIcon className="h-16 w-16 text-blue-600" />
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold text-gray-800">{child?.full_name}</h2>
            <p className="text-gray-600">Age: {child?.age} years</p>
            <p className="text-gray-600">Grade: {child?.grade}</p>
          </div>
        </div>

        {child?.medical_info && (
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-2">Medical Information</h3>
            <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {child.medical_info}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-md font-semibold text-gray-800 mb-2">Pickup Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Pickups</p>
              <p className="text-base text-gray-900 font-medium">{pickupLogs.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Pickup</p>
              <p className="text-base text-gray-900 font-medium">
                {lastPickup
                  ? new Date(lastPickup.pickup_time).toLocaleString()
                  : 'No recent pickup'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
