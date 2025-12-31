import { useState, useEffect } from 'react';
import { UserCircleIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { API_BASE_URL, LOCAL_BASE } from '@/lib/api/link';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import DeleteChildModal from './DeleteChildModal';

interface Child {
  id: number;
  full_name: string;
  age: number;
  grade: number;
  medical_info?: string;
  photo_path?: string;
}

interface PickupLog {
  child_id: number;
  pickup_time: string;
  status: string;
}

interface ChildrenViewProps {
  children: Child[];
  pickupLogs: PickupLog[];
  onUpdate: () => void;
}

export default function ChildrenView({ children, pickupLogs, onUpdate }: ChildrenViewProps) {
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    grade: '',
    medical_info: '',
    photo: null as File | null,
  });
  const [preview, setPreview] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleEditClick = (child: Child) => {
    setEditingChild(child);
    setFormData({
      full_name: child.full_name,
      age: child.age.toString(),
      grade: child.grade.toString(),
      medical_info: child.medical_info || '',
      photo: null,
    });
    setPreview(child.photo_path ? `${LOCAL_BASE}/${child.photo_path}` : null);
  };

  function getMedicalSeverityColor(info: string) {
    const safeKeywords = [
      'no issue', 'clear', 'healthy', 'none', 'normal', 'fine', 'okay', 'fit'
    ];
    const dangerKeywords = [
      'asthma', 'epilepsy', 'diabetes', 'seizure', 'cancer', 'heart', 'allergy',
      'anaphylaxis', 'condition', 'disease', 'medication', 'syndrome', 'disorder'
    ];
  
    const text = info.toLowerCase();
  
    const isSafe = safeKeywords.some(kw => text.includes(kw));
    const isDanger = dangerKeywords.some(kw => text.includes(kw));
  
    if (isDanger && !isSafe) return 'danger';
    if (isSafe && !isDanger) return 'safe';
  
    // Mixed/uncertain → treat as warning/danger
    return 'danger';
  }
  

  useEffect(() => {
    if (formData.photo) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(formData.photo);
    }
  }, [formData.photo]);

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('full_name', formData.full_name);
      fd.append('age', formData.age);
      fd.append('grade', formData.grade);
      fd.append('medical_info', formData.medical_info);
      if (formData.photo) {
        fd.append('photo', formData.photo);
      } else {
        fd.append('photo_path', editingChild?.photo_path || '');
      }

      await axios.put(`${API_BASE_URL}/children/${editingChild?.id}`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Child updated successfully');
      setEditingChild(null);
      setPreview(null);
      onUpdate(); // refresh list
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update child');
    }
  };
  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/children/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Child deleted successfully');
      setChildToDelete(null);
      onUpdate(); // refresh list
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete child');
    }
  };
  
  

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">My Children</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {children.map((child) => {
          const logs = (pickupLogs ?? []).filter(log => log.child_id === child.id);
          const pickupCount = logs.length;
          const lastPickup = logs[0];

          return (
            <div key={child.id} className="bg-white border rounded-xl shadow-sm overflow-hidden">
              <div className="flex justify-between items-start p-5 border-b">
                <div className="flex items-center">
                  {child.photo_path ? (
                    <img
  src={`${LOCAL_BASE}/${child.photo_path}`}
  alt={child.full_name}
  className="h-12 w-12 rounded-full object-cover"
/>

                  ) : (
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserCircleIcon className="h-8 w-8 text-blue-600" />
                    </div>
                  )}
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{child.full_name}</h3>
                    <p className="text-sm text-gray-500">
                      Grade {child.grade} • {child.age} years old
                    </p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600" onClick={() => handleEditClick(child)}>
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  className="text-gray-400 hover:text-red-600"
                  title="Delete"
                  onClick={() => setChildToDelete(child)}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>


              </div>

              <div className="p-5 space-y-4">
              {child.medical_info && (
  <div>
    <h4 className="text-sm font-medium text-gray-600">Medical Information</h4>
    {(() => {
      const severity = getMedicalSeverityColor(child.medical_info || '');

      const bgClass =
        severity === 'safe'
          ? 'bg-green-50 border-green-100 text-green-700'
          : 'bg-red-50 border-red-100 text-red-700';

      return (
        <div className={`mt-1 p-2 rounded border ${bgClass}`}>
          <p className="text-sm">{child.medical_info}</p>
        </div>
      );
    })()}
  </div>
)}



                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-600">Pickup Records</h4>
                    <p className="text-gray-900 mt-1">
                      {pickupCount > 0
                        ? `${pickupCount} pickup${pickupCount > 1 ? 's' : ''} recorded`
                        : 'No pickup records'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t flex justify-end">
                <button
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
  onClick={() => navigate(`/parent/child/${child.id}`)}
>
  View Full Details
</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {editingChild && (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center overflow-auto">
    <div className="bg-white rounded-lg w-full max-w-md mx-auto my-10 p-6 max-h-[90vh] overflow-y-auto">
      <h2 className="text-lg font-bold mb-4">Edit Child Info</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
          <input
            type="number"
            value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Medical Info</label>
          <textarea
            value={formData.medical_info}
            onChange={(e) => setFormData({ ...formData, medical_info: e.target.value })}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
          <input
            type="file"
            onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] || null })}
          />
          {preview && (
            <img src={preview} alt="Preview" className="mt-2 h-20 rounded object-cover" />
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={() => {
            setEditingChild(null);
            setPreview(null);
          }}
          className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}
{childToDelete && (
  <DeleteChildModal
    isOpen={true}
    onClose={() => setChildToDelete(null)}
    child={childToDelete}
    onDelete={async () => {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/children/${childToDelete.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Child deleted successfully');
        setChildToDelete(null);
        onUpdate();
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Failed to delete child');
      }
    }}
  />
)}


    </div>
  );
}
