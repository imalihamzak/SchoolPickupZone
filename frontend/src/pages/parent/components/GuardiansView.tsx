import { useState } from 'react';
import {
  UserGroupIcon, PhoneIcon, PencilIcon, TrashIcon, TruckIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '@/lib/api/link';
import DeleteGuardianModal from './DeleteGuardianModal'; 

interface Vehicle {
  id?: number;
  name: string;
  make: string;
  model: string;
  color: string;
  plate_number: string;
  year: string;
}

interface Guardian {
  id: number;
  full_name: string;
  relation: string;
  phone: string;
  status: string;
  vehicle?: Vehicle | null;
}

interface GuardiansViewProps {
  guardians: Guardian[];
  onUpdate: () => void;
}

export default function GuardiansView({ guardians, onUpdate }: GuardiansViewProps) {
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
  const [guardianToDelete, setGuardianToDelete] = useState<Guardian | null>(null);

  const [form, setForm] = useState({
    full_name: '',
    relation: '',
    phone: '',
    status: 'Active',
    vehicle: {
      name: '',
      make: '',
      model: '',
      color: '',
      plate_number: '',
      year: ''
    }
  });

  const handleEditClick = (g: Guardian) => {
    setEditingGuardian(g);
    setForm({
      full_name: g.full_name,
      relation: g.relation,
      phone: g.phone,
      status: g.status,
      vehicle: g.vehicle ?? {
        name: '',
        make: '',
        model: '',
        color: '',
        plate_number: '',
        year: ''
      }
    });
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/guardians/${editingGuardian?.id}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Guardian updated');
      setEditingGuardian(null);
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Authorized Guardians</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guardians.map((guardian) => (
          <div key={guardian.id} className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="p-5">
              <div className="flex justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <UserGroupIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">{guardian.full_name}</h3>
                    <p className="text-sm text-gray-500">{guardian.relation}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="text-gray-400 hover:text-gray-600" onClick={() => handleEditClick(guardian)} title="Edit">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    className="text-gray-400 hover:text-red-600"
                    title="Delete"
                    onClick={() => setGuardianToDelete(guardian)}
                    >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t space-y-2 text-sm text-gray-700">
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <span className="ml-2">{guardian.phone}</span>
                </div>

                {guardian.vehicle && (
                  <div className="mt-2 border-t pt-2 space-y-1">
                    <div className="flex items-center font-medium text-gray-800">
                      <TruckIcon className="h-5 w-5 mr-2" />
                      Vehicle: {guardian.vehicle.name}
                    </div>
                    <div>Make: {guardian.vehicle.make}</div>
                    <div>Model: {guardian.vehicle.model}</div>
                    <div>Color: {guardian.vehicle.color}</div>
                    <div>Plate: {guardian.vehicle.plate_number}</div>
                    <div>Year: {guardian.vehicle.year}</div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t mt-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${guardian.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {guardian.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Guardian Modal */}
      {editingGuardian && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-bold mb-4">Edit Guardian Info</h2>

            <div className="space-y-3">
              {['full_name', 'relation', 'phone', 'status'].map((field) => (
                <div key={field}>
                  <label className="block text-sm text-gray-700 capitalize">{field.replace('_', ' ')}</label>
                  {field === 'relation' || field === 'status' ? (
                    <select
                      className="w-full border p-2 rounded"
                      value={(form as any)[field]}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    >
                      <option value="">Select {field}</option>
                      {field === 'relation' && ['Grandparent', 'Aunt', 'Uncle', 'Family Friend', 'Sibling', 'Other'].map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                      {field === 'status' && ['Active', 'Inactive'].map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="w-full border p-2 rounded"
                      value={(form as any)[field]}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    />
                  )}
                </div>
              ))}

              <h3 className="pt-2 font-semibold text-gray-800">Vehicle Info</h3>
              {Object.entries(form.vehicle).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm text-gray-700 capitalize">{key.replace('_', ' ')}</label>
                  <input
                    className="w-full border p-2 rounded"
                    value={value}
                    onChange={(e) =>
                      setForm({ ...form, vehicle: { ...form.vehicle, [key]: e.target.value } })
                    }
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditingGuardian(null)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
                Cancel
              </button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

{guardianToDelete && (
  <DeleteGuardianModal
    isOpen={true}
    onClose={() => setGuardianToDelete(null)}
    guardian={guardianToDelete}
    onDelete={async () => {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/guardians/${guardianToDelete.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Guardian deleted');
        setGuardianToDelete(null);
        onUpdate();
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Delete failed');
      }
    }}
  />
)}

    </div>
  );
}
