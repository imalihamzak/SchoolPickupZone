import { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import {
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import AddEditSchoolModal from './components/AddEditSchoolModal';
import Loader from '../../../components/Loader';
import { API_BASE_URL } from '@/lib/api/link';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';

interface School {
  id: number;
  name: string;
  location: string;
  student_count: number;
  subscription_status?: string | null;
  next_billing_date?: string | null;
}

export default function SchoolsManagement() {
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
  const [isAddSchoolModalOpen, setIsAddSchoolModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/superadmin/schools`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchools(res.data);
    } catch (err) {
      console.error('Failed to fetch schools:', err);
    } finally {
      setLoading(false);
    }
  };
  

  const openAddSchoolModal = () => {
    setSelectedSchool(null);
    setIsAddSchoolModalOpen(true);
  };

  const openEditSchoolModal = (school: School) => {
    setSelectedSchool(school);
    setIsAddSchoolModalOpen(true);
  };
  
  const openDeleteModal = (school: School) => {
    setSelectedSchool(school);
    setIsDeleteModalOpen(true);
  };
  

  const handleDeleteSchool = async () => {
    if (!selectedSchool) return;
  
    try {
      await axios.delete(`${API_BASE_URL}/superadmin/schools/${selectedSchool.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchools(schools.filter((s) => s.id !== selectedSchool.id));
      setIsDeleteModalOpen(false);
      setSelectedSchool(null);
    } catch (err) {
      console.error('Failed to delete school:', err);
    }
  };
  

  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout role="super-admin">
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Schools Management</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage all schools in the system, their admins, and subscription status.
              </p>
            </div>
            <button
              onClick={openAddSchoolModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Add School
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex gap-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search schools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
  {loading ? (
    <tr>
      <td colSpan={5}>
        <Loader />
      </td>
    </tr>
  ) : filteredSchools.length > 0 ? (
    filteredSchools.map((school) => (
      <tr key={school.id} className="hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 rounded-md text-indigo-500">
              <BuildingOfficeIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{school.name}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">{school.location}</td>
        <td className="px-6 py-4 text-sm text-gray-500">{school.student_count}</td>
        <td className="px-6 py-4 text-sm text-gray-500 capitalize">
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              school.subscription_status === 'Active'
                ? 'bg-green-100 text-green-800'
                : school.subscription_status === 'Expiring Soon'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {school.subscription_status || 'Inactive'}
          </span>
          {school.next_billing_date && (
            <div className="text-xs text-gray-400">
              Next: {new Date(school.next_billing_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          )}
        </td>
        <td className="px-6 py-4 text-right text-sm font-medium">
          <div className="flex items-center justify-end space-x-2">
            <button onClick={() => openEditSchoolModal(school)} className="p-1 hover:bg-gray-100 rounded-md">
              <PencilIcon className="h-5 w-5 text-indigo-600" />
            </button>
            <button onClick={() => openDeleteModal(school)} className="p-1 hover:bg-gray-100 rounded-md">
              <TrashIcon className="h-5 w-5 text-red-600" />
            </button>
          </div>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan={5} className="text-center py-6 text-gray-500">
        No schools available.
      </td>
    </tr>
  )}
</tbody>

              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteConfirmationModal
  isOpen={isDeleteModalOpen}
  onClose={() => setIsDeleteModalOpen(false)}
  entityName={selectedSchool?.name || ''}
  onDelete={handleDeleteSchool}
/>


      <AddEditSchoolModal
  isOpen={isAddSchoolModalOpen}
  onClose={() => setIsAddSchoolModalOpen(false)}
  selectedSchool={selectedSchool as any}
  onSave={(updatedSchool) => fetchSchools()}
/>

    </DashboardLayout>
  );
}
