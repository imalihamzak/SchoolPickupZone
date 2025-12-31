import { useState } from 'react'
import { XMarkIcon, PlusCircleIcon, MinusCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import type { Plan } from '../types/subscription.types'
import axios from 'axios'
import { toast } from 'react-toastify'
import { API_BASE_URL } from '@/lib/api/link'
interface PlanFormProps {
  plan?: Plan | null
  onClose: () => void
  onSubmit: (data: Partial<Plan>) => void
}

export function PlanForm({ plan, onClose, onSubmit }: PlanFormProps) {
  const [features, setFeatures] = useState<string[]>(plan?.features || [''])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
  
    const data = {
      name: formData.get('name') as string,
      price: Number(formData.get('price')),
      billing_interval: formData.get('interval') as 'monthly' | 'yearly',
      features: features.filter(f => f.trim() !== '').join(', '),
    }
  
    try {
      if (plan) {
        // Edit existing plan
        await axios.put(
          `${API_BASE_URL}/superadmin/plans/${plan.id}`,
          data,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        )
        toast.success('Plan updated successfully')
      } else {
        // Create new plan
        await axios.post(
          `${API_BASE_URL}/superadmin/plans`,
          data,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        )
        toast.success('Plan created successfully')
      }
  
      onClose()
    } catch (error: any) {
      const message =
        error.response?.data?.error || 'Failed to save plan. Please try again.'
      toast.error(message)
    }
  }
  
  const addFeature = () => {
    setFeatures([...features, ''])
  }

  const removeFeature = (index: number) => {
    const newFeatures = features.filter((_, i) => i !== index)
    if (newFeatures.length === 0) newFeatures.push('')
    setFeatures(newFeatures)
  }

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...features]
    newFeatures[index] = value
    setFeatures(newFeatures)
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-2xl transform transition-all">
        <div className="bg-primary-50 px-6 py-4 flex items-center justify-between border-b border-primary-100">
          <div className="flex items-center">
            <div className="bg-primary-100 p-2 rounded-md mr-3">
              {plan ? (
                <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {plan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="plan-name" className="block text-sm font-medium text-gray-700">
                Plan Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="name"
                  id="plan-name"
                  defaultValue={plan?.name}
                  placeholder="e.g. Basic, Pro, Enterprise"
                  className="block w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="plan-price" className="block text-sm font-medium text-gray-700">
                Price
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="price"
                  id="plan-price"
                  defaultValue={plan?.price}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="block w-full rounded-md border-2 border-gray-300 pl-8 pr-3 py-2.5 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="plan-interval" className="block text-sm font-medium text-gray-700">
                Billing Interval
              </label>
              <div className="mt-1">
                <select
                  name="interval"
                  id="plan-interval"
                  defaultValue={plan?.interval || 'monthly'}
                  className="block w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Plan Features
              </label>
              <button
                type="button"
                onClick={addFeature}
                className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800"
              >
                <PlusCircleIcon className="h-5 w-5 mr-1" />
                Add Feature
              </button>
            </div>
            <div className="mt-3 border border-gray-200 rounded-md p-4 bg-gray-50">
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-shrink-0 text-green-500">
                      <CheckCircleIcon className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      className="block w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="e.g. 24/7 support, API access"
                    />
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <MinusCircleIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {plan ? 'Save Changes' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}