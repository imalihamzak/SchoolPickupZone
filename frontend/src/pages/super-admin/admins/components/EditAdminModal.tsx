import { useEffect, useState } from 'react';
import {
  BuildingOfficeIcon,
  XMarkIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '@/lib/api/link';
type Props = {
  isOpen: boolean;
  onClose: () => void;
  adminId: number;
  onSave: () => void;
};

type School = {
  id: number;
  name: string;
};

export default function EditAdminModal({ isOpen, onClose, adminId, onSave }: Props) {
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchSchools = async () => {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/superadmin/schools`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchools(res.data);
    };

    const fetchAdminDetails = async () => {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/superadmin/admins/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Admin data:', res.data); 

      const data = res.data;
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setEmail(data.email);
      setPhone(data.phone || '');
      setPassword('');
      setSchoolId(data.school_id);
    };

    fetchSchools();
    fetchAdminDetails();
  }, [isOpen, adminId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      await axios.put(
        `${API_BASE_URL}/superadmin/admins/${adminId}`,
        {
          firstName,
          lastName,
          email,
          phone,
          password,
          school_id: schoolId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('Admin updated successfully');
      onSave();
      onClose();
    } catch (err: any) {
      console.error('Failed to update admin:', err);
      if (err.response?.status === 409) {
        toast.error('Email already exists. Please use a different one.');
      } else {
        toast.error('Failed to update admin. Please try again.');
      }
    }
  };

  if (!isOpen) return null;

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
              <BuildingOfficeIcon className="h-6 w-6 text-amber-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Edit Admin</h3>
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
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 px-4 py-2.5"
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
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 px-4 py-2.5"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 px-4 py-2.5"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 px-4 py-2.5"
                  />
                </div>

                {/* <div className="sm:col-span-3 relative">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 px-4 py-2.5 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-9 text-gray-500"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div> */}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-x-3 border-t border-gray-200">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary-600 hover:bg-primary-700">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
