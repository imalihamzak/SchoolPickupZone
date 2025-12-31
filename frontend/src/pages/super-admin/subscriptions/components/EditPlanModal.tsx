import { PlanForm } from './PlanForm'
import type { Plan } from '../types/subscription.types'

interface EditPlanModalProps {
  plan: Plan
  onClose: () => void
  onSave: (updatedData: Partial<Plan>) => void
}

export function EditPlanModal({ plan, onClose, onSave }: EditPlanModalProps) {
  return (
    <PlanForm 
      plan={plan} 
      onClose={onClose} 
      onSubmit={onSave} 
    />
  )
}
