import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import {
  PlusIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

import AddAdminModal from './components/AddAdminModal';
import EditAdminModal from './components/EditAdminModal';
import DeleteAdminModal from './components/DeleteAdminModal';
import Loader from '../../../components/Loader';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '@/lib/api/link';
type Admin = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  school_name: string;
  location: string;
  subscription_status: string;
  next_billing_date: string;
};


export default function Admins() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token'); 
  
      const res = await axios.get(`${API_BASE_URL}/superadmin/admins`, {
        headers: {
          Authorization: `Bearer ${token}`, 
        },
      });
  
      if (Array.isArray(res.data)) {
        setAdmins(res.data);
      } else {
        setAdmins([]);
        console.error('Unexpected data structure:', res.data);
      }
    } catch (err) {
      console.error('Failed to fetch admins', err);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchAdmins();
  }, []);

  const openEditModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsDeleteModalOpen(true);
  };

  return (
    <DashboardLayout role="super-admin">
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Admin Accounts</h1>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 transition-colors flex items-center gap-1.5"
          >
            <PlusIcon className="h-5 w-5" />
            Add New Admin
          </Button>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
  <tr>
    <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900">Name</th>
    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900">School</th>
    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900">Location</th>
    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900">Subscription</th>
    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900">Next Payment</th>
    <th className="px-4 py-3.5 text-center text-sm font-semibold text-gray-900">Actions</th>
  </tr>
</thead>

<tbody className="divide-y divide-gray-200 bg-white">
  {loading ? (
    <tr>
      <td colSpan={7}>
        <Loader />
      </td>
    </tr>
  ) : Array.isArray(admins) && admins.length > 0 ? (
    admins.map((admin) => (
      <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
        <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-gray-900">
          {admin.firstName} {admin.lastName}
        </td>
        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">{admin.email}</td>
        <td className="whitespace-nowrap px-4 py-4 text-sm">{admin.school_name}</td>
        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">{admin.location}</td>
        <td className="whitespace-nowrap px-4 py-4 text-sm">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              admin.subscription_status === 'Active'
                ? 'bg-green-100 text-green-700'
                : admin.subscription_status === 'Cancelled'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {admin.subscription_status || 'N/A'}
          </span>
        </td>
        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
          {admin.next_billing_date
            ? new Date(admin.next_billing_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'N/A'}
        </td>
        <td className="whitespace-nowrap px-4 py-4 text-sm text-right">
          <div className="flex justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditModal(admin)}
              className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 flex items-center"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openDeleteModal(admin)}
              className="text-red-600 hover:text-red-800 hover:bg-red-50 flex items-center"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan={7} className="text-center py-6 text-gray-500">
        No admins available.
      </td>
    </tr>
  )}
</tbody>

            </table>
          </div>
        </div>
      </div>

      <AddAdminModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {selectedAdmin && (
        <EditAdminModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          adminId={selectedAdmin.id}
          onSave={() => {
            setIsEditModalOpen(false);
            fetchAdmins(); // Refresh list after update
          }}
        />
      )}
      {selectedAdmin && (
        <DeleteAdminModal
  isOpen={isDeleteModalOpen}
  onClose={() => setIsDeleteModalOpen(false)}
  admin={{
    id: selectedAdmin.id,
    name: `${selectedAdmin.firstName} ${selectedAdmin.lastName}`
  }}
  onDelete={async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_BASE_URL}/superadmin/admins/${selectedAdmin.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setIsDeleteModalOpen(false);
      fetchAdmins();
    } catch (error) {
      console.error('Failed to delete admin:', error);
      toast('Failed to delete admin');
    }
  }}
/>

      )}
    </DashboardLayout>
  );
}
