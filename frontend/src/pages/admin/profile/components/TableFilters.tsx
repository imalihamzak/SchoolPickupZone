import { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { AdminSelect } from '@/components/ui/admin-controls';

interface FiltersProps {
  onSearch: (value: string) => void;
  onFilter: (filters: FilterValues) => void;
}

interface FilterValues {
  status: string;
  grade: string;
  membersCount: string;
}

export default function TableFilters({ onSearch, onFilter }: FiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    status: '',
    grade: '',
    membersCount: ''
  });

  const handleFilterChange = (key: keyof FilterValues, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const statusOptions = [
    { value: '', label: 'Status' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'inactive', label: 'Inactive' },
  ];
  const gradeOptions = [
    { value: '', label: 'Grade' },
    { value: '1', label: 'Grade 1' },
    { value: '2', label: 'Grade 2' },
    { value: '3', label: 'Grade 3' },
  ];
  const familySizeOptions = [
    { value: '', label: 'Family Size' },
    { value: 'small', label: 'Small (2-3)' },
    { value: 'medium', label: 'Medium (4-5)' },
    { value: 'large', label: 'Large (6+)' },
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search families..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) => onSearch(e.target.value)}
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <FunnelIcon className="h-5 w-5" />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
          <AdminSelect
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            options={statusOptions}
            className="full"
            ariaLabel="Status filter"
          />

          <AdminSelect
            value={filters.grade}
            onChange={(value) => handleFilterChange('grade', value)}
            options={gradeOptions}
            className="full"
            ariaLabel="Grade filter"
          />

          <AdminSelect
            value={filters.membersCount}
            onChange={(value) => handleFilterChange('membersCount', value)}
            options={familySizeOptions}
            className="full"
            ariaLabel="Family size filter"
          />
        </div>
      )}
    </div>
  );
}
