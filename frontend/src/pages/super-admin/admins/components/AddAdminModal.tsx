import { useState, useEffect } from 'react';
import {
  BuildingOfficeIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '@/lib/api/link';
type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type School = {
  id: number;
  name: string;
};

export default function AddAdminModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const [schools, setSchools] = useState<School[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/superadmin/schools`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSchools(res.data);
      } catch (err) {
        console.error('Failed to fetch schools:', err);
      }
    };

    fetchSchools();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      await axios.post(
        `${API_BASE_URL}/superadmin/admins`,
        { firstName, lastName, email, phone, school_id: schoolId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Admin created successfully and email sent');
      onClose();
    } catch (err: any) {
      console.error('Failed to create admin:', err);
      if (err.response?.status === 409) {
        toast.error('Email already exists. Please use a different email.');
      } else {
        toast.error('Failed to create admin. Please try again.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all max-w-3xl w-full">
          <div className="bg-gray-50 py-4 px-6 flex items-center justify-between border-b border-gray-200">
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-6 w-6 text-primary-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Add New Admin</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">School</label>
                  <select
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    <option value="">Select School</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. John"
                    required
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 px-4 py-2.5"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Smith"
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 px-4 py-2.5"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 px-4 py-2.5"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (123) 456-7890"
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 px-4 py-2.5"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-x-3 border-t border-gray-200">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary-600 hover:bg-primary-700">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Create Admin
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
