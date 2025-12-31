// components/DeletePlanModal.tsx
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import type { Plan } from '../types/subscription.types'

type Props = {
  isOpen: boolean
  onClose: () => void
  plan: Plan
  onDelete: () => void
}

export default function DeletePlanModal({ isOpen, onClose, plan, onDelete }: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all max-w-md w-full">
          <div className="bg-red-50 py-4 px-6 flex items-center justify-between border-b border-red-100">
            <div className="flex items-center">
              <XMarkIcon className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-medium text-red-900">Delete Plan</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="px-6 py-5">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Are you sure you want to delete the plan?
            </h3>
            <p className="text-sm text-gray-600">
              You are about to delete the <strong>{plan.name}</strong> plan. This action cannot be undone.
              All schools using this plan will be affected.
            </p>
            <div className="bg-yellow-50 text-yellow-800 rounded-md p-3 mt-4 text-sm">
              <strong>Warning:</strong> Any subscriptions using this plan may become invalid.
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-x-3 border-t border-gray-200">
            <Button variant="outline" onClick={onClose} className="w-24">
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white w-24" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
