import { useState, useRef } from 'react';
import { XMarkIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '@/lib/api/link';

interface Child {
  id: string;
  full_name: string;
}

interface Document {
  id: string;
  type: string;
  childId?: string; 
  fileName?: string;
  status?: string;
  required?: boolean;
}


interface UploadDocumentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  requiredTypes: string[];
  existingDocuments: Document[];
  children: Child[];
  
}

export default function UploadDocumentForm({
  isOpen,
  onClose,
  onUploadSuccess,
  requiredTypes,
  existingDocuments,
  children,
}: UploadDocumentFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    type: '',
    customType: '',
    childId: '',
    required: false,
    file: null as File | null,
  });

  const [errors, setErrors] = useState({
    type: '',
    file: '',
  });

  const [fileName, setFileName] = useState('');

  const requiredDocumentsStatus = requiredTypes.map((type) => {
    if (type === 'Child Photo') {
      const childrenWithPhotos = children.filter((child) =>
        existingDocuments.some((doc) => doc.type.startsWith('Child Photo') && doc.childId === child.id)
      );
      

      return {
        type,
        uploaded: childrenWithPhotos.length === children.length,
        options: children.map((child) => ({
          id: child.id,
          label: `Child Photo (${child.full_name})`,
          uploaded: existingDocuments.some((doc) => doc.type.startsWith('Child Photo') && doc.childId === child.id),
        })),
      };
    }

    const hasDocument = existingDocuments.some((doc) => doc.type === type);
    return { type, uploaded: hasDocument };
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, file });
      setFileName(file.name);
    }
  };

  const validateForm = () => {
    const newErrors = {
      type: formData.type ? '' : 'Document type is required',
      file: formData.file ? '' : 'Please select a file to upload',
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const getActualDocumentType = () => {
    if (formData.type === 'Child Photo') {
      const child = children.find((c) => c.id === formData.childId);
      return child ? `Child Photo (${child.full_name})` : formData.type;
    }

    if (formData.type === 'Other') {
      return formData.customType;
    }

    return formData.type;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const token = localStorage.getItem('token');
    const actualType = getActualDocumentType();

    const form = new FormData();
    form.append('type', actualType);
    form.append('required', String(requiredTypes.includes(formData.type) || formData.type === 'Child Photo'));
    if (formData.type === 'Child Photo') {
      form.append('child_id', formData.childId);
    }
    if (formData.file) {
      form.append('file', formData.file);
    }

    try {
      await axios.post(`${API_BASE_URL}/documents`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Document uploaded successfully');
      setFormData({
        type: '',
        customType: '',
        childId: '',
        required: false,
        file: null,
      });
      setFileName('');
      onUploadSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Upload failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Upload Document</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Document Type Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value,
                  childId: '',
                })
              }
              className={`w-full border ${errors.type ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2.5`}
            >
              <option value="">Select Document Type</option>
              <optgroup label="Required Documents">
                {requiredDocumentsStatus.map((doc, index) =>
                  doc.type !== 'Child Photo' ? (
                    <option key={index} value={doc.type} disabled={doc.uploaded}>
                      {doc.type} {doc.uploaded ? '(Already uploaded)' : ''}
                    </option>
                  ) : null
                )}
                {(() => {
  const childPhotoStatus = requiredDocumentsStatus.find(doc => doc.type === 'Child Photo');
  return (
    <option value="Child Photo" disabled={childPhotoStatus?.uploaded}>
      Child Photo {childPhotoStatus?.uploaded ? '(Already uploaded)' : ''}
    </option>
  );
})()}

              </optgroup>
              <optgroup label="Additional Documents">
                {['Insurance Card', 'School ID', 'Medical Form', 'Other'].map((type) => {
                  const uploaded = existingDocuments.some((doc) => doc.type === type);
                  return (
                    <option key={type} value={type} disabled={uploaded}>
                      {type} {uploaded ? '(Already uploaded)' : ''}
                    </option>
                  );
                })}
              </optgroup>
            </select>
            {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type}</p>}
          </div>

          {/* Child Select (for child photo) */}
          {formData.type === 'Child Photo' && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">Select Child</label>
    <div className="text-sm text-gray-600 mb-2">
  {(() => {
    const uploadedCount = requiredDocumentsStatus.find(d => d.type === 'Child Photo')?.options?.filter(c => c.uploaded).length || 0;
    const total = children.length;
    return `Child Photos Uploaded: ${uploadedCount} of ${total}`;
  })()}
</div>

    <select
      value={formData.childId}
      onChange={(e) => setFormData({ ...formData, childId: e.target.value })}
      className="w-full border border-gray-300 rounded-lg p-2.5"
    >
      <option value="">Select Child</option>
      {
        // 💡 Use requiredDocumentsStatus[Child Photo].options to ensure accurate uploaded detection
        requiredDocumentsStatus.find(d => d.type === 'Child Photo')?.options?.map((option) => (
          <option key={option.id} value={option.id} disabled={option.uploaded}>
            {option.label} {option.uploaded ? '(Photo already uploaded)' : ''}
          </option>
        ))
      }
    </select>
  </div>
)}


          {/* Custom Document Type Input */}
          {formData.type === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specify Document Type</label>
              <input
                type="text"
                value={formData.customType}
                onChange={(e) => setFormData({ ...formData, customType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5"
                placeholder="Enter document type"
              />
            </div>
          )}

          {/* File Upload Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
                errors.file ? 'border-red-500' : 'border-gray-300'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
              />
              <DocumentArrowUpIcon className="h-10 w-10 mx-auto text-gray-400" />
              {fileName ? (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900">{fileName}</p>
                  <p className="text-xs text-gray-500">Click to change file</p>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Click to upload</p>
                  <p className="text-xs text-gray-500">JPG, PNG or PDF (max 5MB)</p>
                </div>
              )}
            </div>
            {errors.file && <p className="mt-1 text-sm text-red-500">{errors.file}</p>}
          </div>

          {/* Note */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Parent's license, vehicle photos, and child photos are required documents.
            </p>
          </div>

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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Upload Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
