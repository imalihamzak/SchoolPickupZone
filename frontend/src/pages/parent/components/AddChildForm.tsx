import { useState, useRef } from 'react'
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import { toast } from 'react-toastify'
import { API_BASE_URL } from '@/lib/api/link'
interface AddChildFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function AddChildForm({ isOpen, onClose, onSuccess }: AddChildFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    grade: '',
    medical: '',
    photo: null as File | null
  })

  const [errors, setErrors] = useState({
    name: '',
    grade: '',
    photo: ''
  })

  const [photoName, setPhotoName] = useState('')
  const [loading, setLoading] = useState(false)

  const validateForm = () => {
    const newErrors = {
      name: formData.name ? '' : 'Name is required',
      grade: formData.grade ? '' : 'Grade is required',
      photo: formData.photo ? '' : 'Child photo is required'
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormData({ ...formData, photo: file })
      setPhotoName(file.name)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const payload = new FormData()

      payload.append('full_name', formData.name)
      payload.append('age', formData.age)
      payload.append('grade', formData.grade)
      payload.append('medical_info', formData.medical)
      payload.append('photo', formData.photo as File)

      await axios.post(`${API_BASE_URL}/children`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      toast.success('Child added successfully')
      setFormData({ name: '', age: '', grade: '', medical: '', photo: null })
      setPhotoName('')
      onClose()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add child')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
  <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Add Child</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2.5`}
              placeholder="Child's full name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5"
                placeholder="Age in years"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className={`w-full border ${errors.grade ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2.5`}
              >
                <option value="">Select Grade</option>
                {[...Array(8)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Grade {i + 1}</option>
                ))}
              </select>
              {errors.grade && <p className="mt-1 text-sm text-red-500">{errors.grade}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Medical Information (Optional)</label>
            <textarea
              value={formData.medical}
              onChange={(e) => setFormData({ ...formData, medical: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2.5"
              placeholder="Any allergies or medical conditions"
              rows={3}
            />
            <p className="mt-1 text-xs text-gray-500">
              Please share any medical information that school staff should be aware of.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Child Photo <span className="text-red-500">*</span>
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${errors.photo ? 'border-red-500' : 'border-gray-300'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                className="hidden"
                accept="image/jpeg,image/png,image/jpg"
              />
              {photoName ? (
                <div className="flex items-center justify-center space-x-3">
                  <PhotoIcon className="h-8 w-8 text-blue-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{photoName}</p>
                    <p className="text-xs text-gray-500">Click to change photo</p>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <PhotoIcon className="h-8 w-8 mx-auto text-gray-400" />
                  <p className="text-sm font-medium text-gray-700 mt-1">Upload child's photo</p>
                  <p className="text-xs text-gray-500">JPG or PNG (max 5MB)</p>
                </div>
              )}
            </div>
            {errors.photo && <p className="mt-1 text-sm text-red-500">{errors.photo}</p>}
          </div>

          <div className="flex justify-end gap-4 pt-4">
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {loading ? 'Adding...' : 'Add Child'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
