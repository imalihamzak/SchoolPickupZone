import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { PlusIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-toastify';

// Component Imports
import ChildrenView from './components/ChildrenView';
import GuardiansView from './components/GuardiansView';
import DocumentsView from './components/DocumentsView';
import AddChildForm from './components/AddChildForm';
import AddGuardianForm from './components/AddGuardianForm';
import UploadDocumentForm from './components/UploadDocumentForm';
import { API_BASE_URL } from '@/lib/api/link';

// Sample data for documents only
const documents = [
  {
    id: '1',
    type: 'Parent License',
    fileName: 'parent_license.jpg',
    uploadDate: '2024-01-15',
    status: 'Approved',
    required: true
  },
  {
    id: '2',
    type: 'Vehicle Photo',
    fileName: 'vehicle_photo.jpg',
    uploadDate: '2024-01-15',
    status: 'Approved',
    required: true
  },
  {
    id: '3',
    type: 'Child Photo (Emma)',
    fileName: 'emma_photo.jpg',
    uploadDate: '2024-01-15',
    status: 'Approved',
    required: true
  },
  {
    id: '4',
    type: 'Child Photo (Noah)',
    fileName: 'noah_photo.jpg',
    uploadDate: '2024-01-15',
    status: 'Approved',
    required: true
  },
  {
    id: '5',
    type: 'Insurance Card',
    fileName: 'insurance_card.pdf',
    uploadDate: '2024-01-20',
    status: 'Pending',
    required: false
  }
];

const requiredDocumentTypes = ['Parent License', 'Vehicle Photo', 'Child Photo'];

export default function ParentProfiles() {
  const [activeTab, setActiveTab] = useState('children');
  const [addChildModalOpen, setAddChildModalOpen] = useState(false);
  const [addGuardianModalOpen, setAddGuardianModalOpen] = useState(false);
  const [uploadDocumentModalOpen, setUploadDocumentModalOpen] = useState(false);
  const [allDocuments, setAllDocuments] = useState(documents);
  const [pickupLogs, setPickupLogs] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [guardians, setGuardians] = useState<any[]>([]);

  const fetchPickupLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/pickups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPickupLogs(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to fetch pickup logs');
    }
  };

  const fetchChildren = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/children`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChildren(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to fetch children');
    }
  };

  const fetchGuardians = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/guardians`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGuardians(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to fetch guardians');
    }
  };

  const handleUploadDocument = async (document: any) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('type', document.type);
      formData.append('required', document.required.toString());
  
      if (document.type.startsWith('Child Photo')) {
        const match = document.type.match(/\((.*?)\)/);
        const childName = match?.[1];
        const matchedChild = children.find((child) => child.name === childName);
        if (matchedChild) {
          formData.append('child_id', matchedChild.id);
        }
      }
  
      formData.append('file', document.file);
  
      await axios.post(`${API_BASE_URL}/documents/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
  
      toast.success('Document uploaded successfully');
      setUploadDocumentModalOpen(false);
      fetchDocuments(); // Refresh the list from backend
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Upload failed');
    }
  };
  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllDocuments(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to fetch documents');
    }
  };
  

  useEffect(() => {
    fetchChildren();
    fetchGuardians();
    fetchPickupLogs();
    fetchDocuments(); 

  }, []);



  return (
    <DashboardLayout role="parent">
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Family Profiles</h1>
            <div className="flex gap-4">
              {activeTab === 'children' && (
                <button
                  onClick={() => setAddChildModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add Child
                </button>
              )}

              {activeTab === 'guardians' && (
                <button
                  onClick={() => setAddGuardianModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  disabled={guardians.length >= 2}
                >
                  <PlusIcon className="h-5 w-5" />
                  Add Guardian {guardians.length >= 2 && '(Max 2)'}
                </button>
              )}

              {activeTab === 'documents' && (
                <button
                  onClick={() => setUploadDocumentModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add Document
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="border-b border-gray-200">
              <nav className="flex" aria-label="Tabs">
                {['children', 'guardians', 'documents'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } flex-1 sm:flex-none whitespace-nowrap py-4 px-8 border-b-2 text-sm font-medium capitalize transition-colors`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'children' && (
                <ChildrenView
  children={children}
  pickupLogs={pickupLogs}
  onUpdate={fetchChildren}
/>              )}

              {activeTab === 'guardians' && (
                <GuardiansView guardians={guardians} onUpdate={fetchGuardians} />
              )}

              {activeTab === 'documents' && (
                <DocumentsView
                  documents={allDocuments}
                  requiredTypes={requiredDocumentTypes}
                  onRefresh={fetchDocuments} // you must define this

                />
              )}
            </div>
          </div>

          {/* Guardian Info */}
          {activeTab === 'guardians' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About Guardians</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Important:</strong> You can add up to 2 guardians who are authorized to pick up your children.
                  Each guardian will receive their own QR code for pickup.
                </p>
              </div>
            </div>
          )}

          {/* Documents Info */}
          {activeTab === 'documents' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Important:</strong> The following documents are required:
                </p>
                <ul className="list-disc pl-6 mt-2 text-sm text-blue-800">
                  <li>Current parent's driver license</li>
                  <li>Photos of all vehicles used for pickup</li>
                  <li>Current photo of each child</li>
                </ul>
                <p className="text-sm text-blue-800 mt-2">
                  You can also upload additional optional documents as needed.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Child Modal */}
      {addChildModalOpen && (
        <AddChildForm
          isOpen={addChildModalOpen}
          onClose={() => setAddChildModalOpen(false)}
          onSuccess={fetchChildren}
        />
      )}

      {/* Add Guardian Modal */}
      {addGuardianModalOpen && (
        <AddGuardianForm
          isOpen={addGuardianModalOpen}
          onClose={() => setAddGuardianModalOpen(false)}
          onSubmit={fetchGuardians}
        />
      )}

      {/* Upload Document Modal */}
      {uploadDocumentModalOpen && (
        <UploadDocumentForm
  isOpen={uploadDocumentModalOpen}
  onClose={() => setUploadDocumentModalOpen(false)}
  onUploadSuccess={fetchDocuments} // Or any refresh method
  requiredTypes={requiredDocumentTypes}
  existingDocuments={allDocuments}
  children={children}
/>

      )}
    </DashboardLayout>
  );
}
