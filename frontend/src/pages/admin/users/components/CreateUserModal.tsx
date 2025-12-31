import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '@/lib/api/link';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => Promise<void>; 
}


export default function CreateUserModal({ isOpen, onClose, onSubmit }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',     
    role: 'parent',
    status: 'inactive'
  });
  

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Failed to create user');
      } else {
        toast.success('User created successfully');
        onClose();
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          phone: '',          
          role: 'parent',
          status: 'inactive'
        });
        
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add New User</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="flex gap-4">
  <div className="w-1/2">
    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
    <input
      type="text"
      name="firstName"
      value={formData.firstName}
      onChange={handleChange}
      className={`w-full border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2.5`}
      placeholder="Enter first name"
    />
    {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
  </div>

  <div className="w-1/2">
    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
    <input
      type="text"
      name="lastName"
      value={formData.lastName}
      onChange={handleChange}
      className={`w-full border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2.5`}
      placeholder="Enter last name"
    />
    {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
  </div>
</div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2.5`}
              placeholder="Enter email address"
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
          </div>
          {/* Mobile Number */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
  <input
    type="text"
    name="phone"
    value={formData.phone}
    onChange={handleChange}
    className="w-full border border-gray-300 rounded-lg p-2.5"
    placeholder="Enter mobile number"
  />
</div>


          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2.5`}
              placeholder="Enter password"
            />
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
          </div>

{/* Role and Status in one row */}
<div className="flex gap-4">
  <div className="w-1/2">
    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
    <select
      name="role"
      value={formData.role}
      onChange={handleChange}
      className="w-full border border-gray-300 rounded-lg p-2.5"
    >
      <option value="parent">Parent</option>
      <option value="guard">Guard</option>
    </select>
  </div>

  <div className="w-1/2">
    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
    <select
      name="status"
      value={formData.status}
      onChange={handleChange}
      className="w-full border border-gray-300 rounded-lg p-2.5"
    >
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
    </select>
  </div>
</div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
