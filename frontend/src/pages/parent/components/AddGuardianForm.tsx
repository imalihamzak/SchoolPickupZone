import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '@/lib/api/link';
interface AddGuardianFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function AddGuardianForm({ isOpen, onClose, onSubmit }: AddGuardianFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    relation: '',
    phone: '',
    vehicle: {
      name: '',
      make: '',
      model: '',
      color: '',
      plate_number: '',
      year: ''
    }
  });

  const [errors, setErrors] = useState({
    name: '',
    relation: '',
    phone: '',
    vehicle: {
      name: '',
      make: '',
      model: '',
      color: '',
      plate_number: '',
      year: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [isOpen]);

  const validateForm = () => {
    const vehicleErrors = {
      name: formData.vehicle.name ? '' : 'Vehicle name is required',
      make: formData.vehicle.make ? '' : 'Make is required',
      model: formData.vehicle.model ? '' : 'Model is required',
      color: formData.vehicle.color ? '' : 'Color is required',
      plate_number: formData.vehicle.plate_number ? '' : 'Plate number is required',
      year: formData.vehicle.year ? '' : 'Year is required'
    };

    const newErrors = {
      name: formData.name ? '' : 'Name is required',
      relation: formData.relation ? '' : 'Relation is required',
      phone: formData.phone ? '' : 'Phone number is required',
      vehicle: vehicleErrors
    };

    setErrors(newErrors);

    const isGuardianValid = !newErrors.name && !newErrors.relation && !newErrors.phone;
    const isVehicleValid = !Object.values(vehicleErrors).some(err => err);

    return isGuardianValid && isVehicleValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = validateForm();
    if (!isValid) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/guardians`, {
        full_name: formData.name,
        relation: formData.relation,
        phone: formData.phone,
        vehicle: formData.vehicle
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      toast.success('Guardian added successfully');
      onSubmit(response.data);
      onClose();
      setFormData({
        name: '',
        relation: '',
        phone: '',
        vehicle: {
          name: '',
          make: '',
          model: '',
          color: '',
          plate_number: '',
          year: ''
        }
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to add guardian');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Add Guardian</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Guardian Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2.5`}
              placeholder="Guardian's full name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Relation to Child</label>
              <select
                value={formData.relation}
                onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                className={`w-full border ${errors.relation ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2.5`}
              >
                <option value="">Select Relation</option>
                <option value="Grandparent">Grandparent</option>
                <option value="Aunt">Aunt</option>
                <option value="Uncle">Uncle</option>
                <option value="Family Friend">Family Friend</option>
                <option value="Sibling">Sibling</option>
                <option value="Other">Other</option>
              </select>
              {errors.relation && <p className="mt-1 text-sm text-red-500">{errors.relation}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2.5`}
                placeholder="Contact phone number"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="pt-2">
            <h3 className="text-md font-semibold text-gray-700 mb-2">Vehicle Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['name', 'make', 'model', 'color', 'plate_number', 'year'].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                    {field.replace('_', ' ')}
                  </label>
                  <input
                    type="text"
                    value={(formData.vehicle as any)[field]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vehicle: { ...formData.vehicle, [field]: e.target.value }
                      })
                    }
                    className={`w-full border ${
                      (errors.vehicle as any)[field] ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg p-2.5`}
                    placeholder={
                      field === 'name'
                        ? 'e.g. BMW X7'
                        : field === 'make'
                        ? 'e.g. BMW'
                        : field === 'model'
                        ? 'e.g. M60i xDrive'
                        : field === 'color'
                        ? 'e.g. Black'
                        : field === 'plate_number'
                        ? 'e.g. LUX-786, XYZ-1234'
                        : field === 'year'
                        ? 'e.g. 2024'
                        : ''
                    }
                    
                  />
                  {(errors.vehicle as any)[field] && (
                    <p className="mt-1 text-sm text-red-500">{(errors.vehicle as any)[field]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            By adding a guardian, you authorize this person to pick up your children from school.
            They will receive a QR code that can be scanned at pickup time.
          </p>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Add Guardian
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
