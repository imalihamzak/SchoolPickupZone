import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import type { Family, FilterValues } from './types';
import ActiveProfiles from './components/ActiveProfiles';
import PendingProfiles from './components/PendingProfiles';
import FamilyView from './components/FamilyView';
import TableFilters from './components/TableFilters';
import { filterFamilies, searchFamilies } from './utils';
import { API_BASE_URL } from '@/lib/api/link';
import { toast } from 'react-toastify';

export default function FamilyProfiles() {
  const [activeTab, setActiveTab] = useState('active');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [filteredFamilies, setFilteredFamilies] = useState<Family[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterValues>({
    status: '',
    grade: '',
    membersCount: ''
  });

  const fetchFamilies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/family/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) throw new Error('Failed to fetch families');
  
      const data = await response.json();
      if (!Array.isArray(data)) {
        console.error('Unexpected response:', data);
        return;
      }
  
      setFamilies(data);
      setFilteredFamilies(data);
    } catch (error) {
      console.error('Error fetching family profiles:', error);
      toast.error('Failed to fetch families');
    }
  };
  const handleApproveFamily = async (family: Family) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/family/${family.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!res.ok) throw new Error('Approval failed');
  
      toast.success('Family approved successfully');
      await fetchFamilies(); // 🔁 refresh after approval
    } catch (error) {
      console.error('Error approving family:', error);
      toast.error('Error approving family');
    }
  };
  
  const handleDenyFamily = async (family: Family, reason?: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/family/${family.id}/deny`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
  
      if (!res.ok) throw new Error('Denial failed');
  
      toast.success('Family denied successfully');
      await fetchFamilies(); // 🔁 refresh after denial
    } catch (error) {
      console.error('Error denying family:', error);
      toast.error('Error denying family');
    }
  };
  useEffect(() => {
    fetchFamilies();
  }, []);
      
  

  // 🔍 Search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    applyFiltersAndSearch(value, filters);
  };

  // 🧰 Filters
  const handleFilter = (newFilters: FilterValues) => {
    setFilters(newFilters);
    applyFiltersAndSearch(searchTerm, newFilters);
  };

  const applyFiltersAndSearch = (search: string, filterValues: FilterValues) => {
    let result = [...families];

    if (search) {
      result = searchFamilies(result, search);
    }

    if (Object.values(filterValues).some(value => value !== '')) {
      result = filterFamilies(result, filterValues);
    }

    setFilteredFamilies(result);
  };


  return (
    <DashboardLayout role="admin">
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Family Profiles</h1>
          </div>

          <TableFilters onSearch={handleSearch} onFilter={handleFilter} />

          <div className="bg-white rounded-xl shadow-sm">
            <div className="border-b border-gray-200">
              <nav className="flex" aria-label="Tabs">
                {['active', 'pending'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } flex-1 sm:flex-none whitespace-nowrap py-4 px-8 border-b-2 text-sm font-medium capitalize transition-colors`}
                  >
                    {tab} Profiles
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'active' ? (
                <ActiveProfiles
                  families={filteredFamilies.filter(f => f.status === 'Active')}
                  onView={(family) => {
                    setSelectedFamily(family);
                    setViewModalOpen(true);
                  }}
                />
              ) : (
                <PendingProfiles
                  families={filteredFamilies.filter(f => f.status === 'Pending')}
                  onView={(family) => {
                    setSelectedFamily(family);
                    setViewModalOpen(true);
                  }}
                  onApprove={handleApproveFamily}
                  onDeny={handleDenyFamily}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal View */}
      {selectedFamily && viewModalOpen && (
        <FamilyView
          data={{
            id: selectedFamily.id,
            familyName: selectedFamily.familyName,
            status: selectedFamily.status,
            submittedAt: selectedFamily.submittedAt,
            parent: selectedFamily.parent,
            guardians: selectedFamily.guardians,
            children: selectedFamily.children,
            documents: selectedFamily.documents?.map(doc => ({
              id: doc.id || '',
              name: doc.name,
              type: doc.type,
              status: doc.status,
              file_path: doc.file_path, // ✅ include it
              url: doc.url              // ✅ optional if you're using it
            }))
            
          }}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedFamily(null);
          }}
          onApprove={() => handleApproveFamily(selectedFamily)}
          onDeny={(_, reason) => handleDenyFamily(selectedFamily, reason)}
        />
      )}
    </DashboardLayout>
  );
}
