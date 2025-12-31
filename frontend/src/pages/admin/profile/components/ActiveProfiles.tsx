import type { Family } from '../types';

interface ActiveProfilesProps {
  families: Family[];
  onView: (family: Family) => void;
}

export default function ActiveProfiles({ families, onView }: ActiveProfilesProps) {
  if (families.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No active family profiles found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {families.map((family) => (
        <div
          key={family.id}
          onClick={() => onView(family)}
          className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onView(family);
          }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{family.familyName}</h3>
              <p className="text-sm text-gray-500">
                {family.children.length} children · {family.guardians.length} guardians
              </p>
            </div>
            <div className="text-sm text-blue-600 hover:text-blue-700">View Details</div>
          </div>
        </div>
      ))}
    </div>
  );
}
