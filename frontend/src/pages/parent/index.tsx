import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { UserCircleIcon, PlusIcon, UserGroupIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '@/lib/api/link';
// Component Imports
import ChildrenView from './components/ChildrenView';
import GuardiansView from './components/GuardiansView';
import AddChildForm from './components/AddChildForm';
import AddGuardianForm from './components/AddGuardianForm';
import ActivitySummary from './components/ActivitySummary';

export default function ParentDashboard() {
  const [children, setChildren] = useState<any[]>([]);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [addChildModalOpen, setAddChildModalOpen] = useState(false);
  const [addGuardianModalOpen, setAddGuardianModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('children');
  const [qrCode, setQrCode] = useState<any>(null);
  const [pickupLogs, setPickupLogs] = useState<any[]>([]);

  
const fetchPickupLogs = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(`${API_BASE_URL}/pickups`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setPickupLogs(res.data);
  } catch (err: any) {
    toast.error(err.response?.data?.error || 'Failed to fetch pickup logs');
  }
};

  const fetchQRCode = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/qrcode/count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQrCode(res.data); // will be null if not found
    } catch (err: any) {
      setQrCode(null); // safe fallback
    }
  };
  
  const fetchChildren = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/children`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChildren(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to fetch children');
    }
  };

  const fetchGuardians = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/guardians`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGuardians(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to fetch guardians');
    }
  };

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/pickups`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const mapped = res.data.map((log: any) => {
        const pickupDate = new Date(log.pickup_time);
        return {
          id: log.id,
          type: 'pickup',
          date: pickupDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
          time: pickupDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
          guard: log.guardian_name,
          status: log.status || 'Completed'
        };
      });

      setActivities(mapped);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to fetch activity logs');
    }
  };

  useEffect(() => {
    fetchChildren();
    fetchGuardians();
    fetchActivities();
    fetchQRCode(); 
    fetchPickupLogs();


  }, []);

  const stats = [
    { name: 'Children', value: `${children.length}`, icon: <UserCircleIcon className="h-8 w-8 text-blue-600" /> },
    { name: 'Guardians', value: `${guardians.length}`, icon: <UserGroupIcon className="h-8 w-8 text-purple-600" /> },
    {
      name: 'Active QR Codes',
      value: qrCode?.count ?? '0',
      icon: <QrCodeIcon className="h-8 w-8 text-green-600" />
    }
    
      ];

  return (
    <DashboardLayout role="parent">
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
            <div className="flex gap-4">
              <button
                onClick={() => setAddChildModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5" />
                Add Child
              </button>
              <button
                onClick={() => setAddGuardianModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <PlusIcon className="h-5 w-5" />
                Add Guardian
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat) => (
              <div key={stat.name} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  {stat.icon}
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="border-b border-gray-200">
              <nav className="flex" aria-label="Tabs">
                {['children', 'guardians', 'activity'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } flex-1 sm:flex-none whitespace-nowrap py-4 px-8 border-b-2 text-sm font-medium capitalize transition-colors`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'children' && (
                <ChildrenView
  children={children}
  pickupLogs={pickupLogs}
  onUpdate={fetchChildren}
/>
              )}
              {activeTab === 'guardians' && (
                <GuardiansView guardians={guardians} onUpdate={fetchGuardians} />
              )}
              {activeTab === 'activity' && (
                <ActivitySummary />
              )}
            </div>
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


            <Link to="/parent/profiles" className="bg-white rounded-xl shadow-sm p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <UserGroupIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Manage Profiles</h3>
                  <p className="text-sm text-gray-500 mt-1">View and manage children and guardians</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Add Child Modal */}
      {addChildModalOpen && (
        <AddChildForm
          isOpen={addChildModalOpen}
          onClose={() => setAddChildModalOpen(false)}
          onSuccess={fetchChildren}
        />
      )}

      {/* Add Guardian Modal */}
      {addGuardianModalOpen && (
        <AddGuardianForm
          isOpen={addGuardianModalOpen}
          onClose={() => setAddGuardianModalOpen(false)}
          onSubmit={fetchGuardians}
        />
      )}
    </DashboardLayout>
  );
}
