import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { API_BASE_URL } from '@/lib/api/link';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserIcon,
  DeviceTabletIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline';
import CreateUserModal from './components/CreateUserModal';
import DeviceManagementModal from './components/DeviceManagementModal';
import GenerateQRModal from './components/GenerateQRModal';
import Loader from '@/components/Loader';
import EditUserModal from './components/EditUserModal';
import DeleteUserModal from './components/DeleteUserModal';


import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [qrGuardName, setQrGuardName] = useState('');
  const [loading, setLoading] = useState(false); 
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUserData, setEditUserData] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
const [userToDelete, setUserToDelete] = useState<any>(null);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Unauthorized');
      }

      const data = await response.json();
      const formatted = data
      .filter((u: any) => u.role === 'parent' || u.role === 'guard')
      .map((u: any) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone,
        name: `${u.firstName} ${u.lastName}`,
        role: u.role,
        status: u.status,
        createdAt: new Date(u.created_at).toISOString().split('T')[0],
        deviceCount: u.role === 'guard' ? u.deviceCount || 0 : 0,
      }));
    

      setUsers(formatted);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (userData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Failed to create user');
      } else {
        toast.success('User created successfully');
        const fullName = `${userData.firstName} ${userData.lastName}`;
        const newUser = {
          ...userData,
          id: (users.length + 1).toString(),
          name: fullName,
          createdAt: new Date().toISOString().split('T')[0],
          deviceCount: 0,
        };
        setUsers([...users, newUser]);
        setIsCreateModalOpen(false);
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleGenerateQR = async (guardId: string, guardName: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/generate-device-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ guard_id: guardId }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to generate link');
      } else {
        setQrUrl(data.registrationUrl);
        setQrGuardName(guardName);
        setQrModalOpen(true);
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/admin/parentguard/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete user');
      } else {
        toast.success('User deleted successfully');
        setUsers(users.filter(u => u.id !== userToDelete.id));
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      }
    } catch (err: any) {
      toast.error('Something went wrong');
    }
  };
  
  const openDeviceModal = (user: any) => {
    setSelectedUser(user);
    setIsDeviceModalOpen(true);
  };

  const handleUpdateDevices = (userId: string, deviceCount: number) => {
    setUsers(users.map((user) => (user.id === userId ? { ...user, deviceCount } : user)));
  };

  return (
    <DashboardLayout role="admin">
      {loading ? (
        <div className="flex justify-center items-center h-[300px]">
          <Loader />
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
                <p className="mt-1 text-sm text-gray-600">Manage all users and their device permissions</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <PlusIcon className="h-5 w-5" />
                Add User
              </button>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex gap-4">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="block w-32 pr-3 py-2 border border-gray-300 rounded-md sm:text-sm"
                  >
                    <option value="all">All Roles</option>
                    <option value="parent">Parent</option>
                    <option value="guard">Guard</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-32 pr-3 py-2 border border-gray-300 rounded-md sm:text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Devices</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created On</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No users found</td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center">
                                {user.role === 'guard' ? (
                                  <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
                                ) : (
                                  <UserIcon className="h-6 w-6 text-indigo-600" />
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === 'guard'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role === 'guard' ? 'Guard' : 'Parent'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.role === 'guard' ? (
                              <button
                                onClick={() => openDeviceModal(user)}
                                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
                              >
                                <DeviceTabletIcon className="h-4 w-4" />
                                <span>{user.deviceCount} devices</span>
                              </button>
                            ) : (
                              <span className="text-gray-500">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{user.createdAt}</td>
                          <td className="px-6 py-4 text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                            <button
  className="text-indigo-600 hover:text-indigo-900"
  onClick={() => {
    setEditUserData(user); 
    setIsEditModalOpen(true);
  }}
>
  <PencilIcon className="h-5 w-5" />
</button>

<button
  onClick={() => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  }}
  className="text-red-600 hover:text-red-900"
>
  <TrashIcon className="h-5 w-5" />
</button>

                              {user.role === 'guard' && (
                                <button
                                  onClick={() => handleGenerateQR(user.id, user.name)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                  title="Generate QR Code"
                                >
                                  <QrCodeIcon className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUser}
      />

      <GenerateQRModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        url={qrUrl}
        guardName={qrGuardName}
      />

      {isDeviceModalOpen && selectedUser && (
        <DeviceManagementModal
          key={selectedUser.id}
          onClose={() => {
            setIsDeviceModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onUpdate={(deviceCount) => handleUpdateDevices(selectedUser.id, deviceCount)}
        />
      )}

      {isEditModalOpen && editUserData && (
  <EditUserModal
    isOpen={isEditModalOpen}
    onClose={() => {
      setIsEditModalOpen(false);
      setEditUserData(null);
    }}
    userData={editUserData}
    onUpdate={(updatedUser) => {
      setUsers(users.map(u => u.id === updatedUser.id
        ? {
            ...updatedUser,
            name: `${updatedUser.firstName} ${updatedUser.lastName}`,
            createdAt: u.createdAt, // preserve original
            deviceCount: u.deviceCount // preserve deviceCount
          }
        : u));
    }}
  />
)}


{isDeleteModalOpen && userToDelete && (
  <DeleteUserModal
    isOpen={isDeleteModalOpen}
    onClose={() => {
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }}
    user={userToDelete}
    onDelete={handleDeleteUser}
  />
)}



      <ToastContainer />
    </DashboardLayout>
  );
}
