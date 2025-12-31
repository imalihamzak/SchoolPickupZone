// pages/admin/profiles/components/PendingProfiles.tsx
import type { Family } from '../types';
import { CheckCircleIcon, XCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface PendingProfilesProps {
  families: Family[];
  onView: (family: Family) => void;
  onApprove?: (family: Family) => void;
  onDeny?: (family: Family) => void;
}

export default function PendingProfiles({ families, onView, onApprove, onDeny }: PendingProfilesProps) {
  if (families.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No pending family profiles found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {families.map((family) => (
        <div 
          key={family.id} 
          className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{family.familyName}</h3>
              <p className="text-sm text-gray-500">
                Submitted: {new Date(family.submittedAt).toLocaleDateString()}
              </p>
              <div className="mt-2 flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {family.children.length} {family.children.length === 1 ? 'child' : 'children'}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {family.guardians.length} {family.guardians.length === 1 ? 'guardian' : 'guardians'}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onView(family)}
                className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <DocumentTextIcon className="h-4 w-4 mr-1" />
                Review
              </button>
              {onDeny && (
                <button
                  onClick={() => onDeny(family)}
                  className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 hover:text-red-800 border border-gray-300 rounded-md hover:bg-red-50"
                >
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  Deny
                </button>
              )}
              {onApprove && (
                <button
                  onClick={() => onApprove(family)}
                  className="inline-flex items-center px-3 py-1.5 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Approve
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}