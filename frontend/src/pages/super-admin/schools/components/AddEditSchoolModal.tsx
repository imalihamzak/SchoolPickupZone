import { useState, useEffect } from 'react';
import { BuildingOfficeIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '@/lib/api/link';
type School = {
    id: string;
    name: string;
    address?: string; // used locally in modal
    location?: string; // from backend
    studentCount?: number; // used in modal
    student_count?: number; // from backend
    parentCount: number;
    status: string;
    subscriptionEnds: string;
  };
  

type Props = {
  isOpen: boolean;
  onClose: () => void;
  selectedSchool: School | null;
  onSave: (updatedSchool: School) => void;
};

export default function AddEditSchoolModal({ isOpen, onClose, selectedSchool, onSave }: Props) {
  if (!isOpen) return null;

  const isEdit = !!selectedSchool;

  const [schoolName, setSchoolName] = useState('');
  const [address, setAddress] = useState('');
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    if (selectedSchool) {
      setSchoolName(selectedSchool.name);
      setAddress(selectedSchool.location || selectedSchool.address || '');
      setStudentCount(selectedSchool.student_count || selectedSchool.studentCount || 0);
    } else {
      setSchoolName('');
      setAddress('');
      setStudentCount(0);
    }
  }, [selectedSchool]);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const schoolData = {
      name: schoolName,
      location: address,
      student_count: studentCount,
    };

    const updatedSchool: School = {
        id: selectedSchool?.id || Math.random().toString(),
        name: schoolName,
        address, // this stays for UI purposes
        studentCount,
        parentCount: selectedSchool?.parentCount || 0,
        status: selectedSchool?.status || 'active',
        subscriptionEnds: selectedSchool?.subscriptionEnds || 'Dec 31, 2025',
      };
      

    const token = localStorage.getItem('token');

    try {
      if (selectedSchool) {
        await axios.put(
          `${API_BASE_URL}/superadmin/schools/${selectedSchool.id}`,
          schoolData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('School updated successfully!');
      } else {
        await axios.post(
          `${API_BASE_URL}/superadmin/schools`,
          schoolData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('School created successfully!');
      }

      onSave(updatedSchool);
      onClose();
    } catch (error) {
      console.error('Failed to save school:', error);
      toast.error('Failed to save school. Check console for details.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all max-w-3xl w-full">
          {/* Header */}
          <div className="bg-gray-50 py-4 px-6 flex items-center justify-between border-b border-gray-200">
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-6 w-6 text-indigo-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">{isEdit ? 'Edit School' : 'Add New School'}</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="school-name" className="block text-sm font-medium text-gray-700">School Name</label>
                  <input
                    type="text"
                    id="school-name"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Enter school name"
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St"
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="student-count" className="block text-sm font-medium text-gray-700">Number of Students</label>
                  <input
                    type="number"
                    id="student-count"
                    value={studentCount}
                    onChange={(e) => setStudentCount(parseInt(e.target.value))}
                    placeholder="e.g., 300"
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-x-3 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                {isEdit ? 'Update School' : 'Add School'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
