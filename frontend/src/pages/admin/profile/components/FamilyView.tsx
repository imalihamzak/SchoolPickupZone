import { useState } from 'react';
import { XMarkIcon, MapPinIcon, PhoneIcon, EnvelopeIcon, UserCircleIcon, DocumentTextIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { API_BASE_URL, LOCAL_BASE } from '@/lib/api/link';
import { toast } from 'react-toastify';

interface FamilyData {
  id?: string;
  familyName: string;
  status: string;
  submittedAt: string;
  parent: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  guardians: Array<{
    name: string;
    relation: string;
    phone: string;
    vehicle?: {
      name: string;
      make: string;
      model: string;
      color: string;
      plate_number: string;
      year: string;
    };
  }>;

  children: Array<{
    name: string;
    age: string;
    grade: string;
    medical: string;
  }>;
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    file_path?: string; // ✅
    url?: string;       // ✅ optional
    status?: 'verified' | 'rejected' | 'pending';
  }>;

}

interface ViewProps {
  data: FamilyData;
  onClose: () => void;
  onApprove?: (id?: string) => void;
  onDeny?: (id?: string, reason?: string) => void;
}

export default function FamilyView({ data, onClose, onApprove, onDeny }: ViewProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'documents'>('info');
  const [denyReason, setDenyReason] = useState('');
  const [showDenyConfirm, setShowDenyConfirm] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDenying, setIsDenying] = useState(false);
  const [documentsState, setDocumentsState] = useState(data.documents || []);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  



  const isPending = data.status === 'Pending';

  const handleVerifyDocument = async (docId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/documents/${docId}/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      toast.success('Document verified');

      setDocumentsState(prev =>
        prev.map(doc =>
          doc.id === docId ? { ...doc, status: 'verified' } : doc
        )
      );
    } catch {
      toast.error('Failed to verify document');
    }
  };


  const handleRejectDocument = async (docId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/documents/${docId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      toast.success('Document rejected');

      setDocumentsState(prev =>
        prev.map(doc =>
          doc.id === docId ? { ...doc, status: 'rejected' } : doc
        )
      );
    } catch {
      toast.error('Failed to reject document');
    }
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    setIsApproving(true);
    await onApprove(data.id);
    setIsApproving(false);
    onClose();
  };


  const handleDeny = async () => {
    if (!onDeny || !denyReason.trim()) return;
    setIsDenying(true);
    await onDeny(data.id, denyReason);
    setIsDenying(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-8 py-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <UserCircleIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{data.familyName}</h2>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-gray-500">
                  Submitted {new Date(data.submittedAt).toLocaleDateString()}
                </p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${data.status === 'Active'
                    ? 'bg-green-100 text-green-800'
                    : data.status === 'Pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {data.status}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs for profile info and documents */}
        <div className="border-b border-gray-200">
          <nav className="flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('info')}
              className={`${activeTab === 'info'
                  ? 'border-indigo-500 text-indigo-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex-1 sm:flex-none whitespace-nowrap py-4 px-8 border-b-2 text-sm font-medium transition-colors`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`${activeTab === 'documents'
                  ? 'border-indigo-500 text-indigo-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex-1 sm:flex-none whitespace-nowrap py-4 px-8 border-b-2 text-sm font-medium transition-colors`}
            >
              Documents
            </button>
          </nav>
        </div>

        {activeTab === 'info' ? (
          <div className="p-8 space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-600">Total Family Members</p>
                <p className="mt-2 text-3xl font-bold text-blue-900">
                  {1 + data.guardians.length + data.children.length}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm font-medium text-green-600">Children</p>
                <p className="mt-2 text-3xl font-bold text-green-900">{data.children.length}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-600">Guardians</p>
                <p className="mt-2 text-3xl font-bold text-purple-900">{data.guardians.length}</p>
              </div>
            </div>

            {/* Parent Information */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-6 text-gray-900">Parent Information</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <UserCircleIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Name</p>
                    <p className="text-gray-900 font-medium">{data.parent.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <p className="text-gray-900">{data.parent.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <PhoneIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Phone</p>
                    <p className="text-gray-900">{data.parent.phone}</p>
                  </div>
                </div>

                {/* <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <MapPinIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Address</p>
                    <p className="text-gray-900">{data.parent.address}</p>
                  </div>
                </div> */}
              </div>
            </div>

            {/* Guardians */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-6 text-gray-900">Guardians</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.guardians.map((guardian, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Name</p>
                          <p className="text-gray-900 font-medium">{guardian.name}</p>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm">
                          Guardian {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Relation</p>
                        <p className="text-gray-900">{guardian.relation}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Phone</p>
                        <p className="text-gray-900">{guardian.phone}</p>
                      </div>
                    </div>
                    {guardian.vehicle && (
                      <div className="mt-4 border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Vehicle Information</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Name</p>
                            <p className="text-gray-900 font-medium">{guardian.vehicle.name}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Make</p>
                            <p className="text-gray-900 font-medium">{guardian.vehicle.make}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Model</p>
                            <p className="text-gray-900 font-medium">{guardian.vehicle.model}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Color</p>
                            <p className="text-gray-900 font-medium">{guardian.vehicle.color}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Plate No.</p>
                            <p className="text-gray-900 font-medium">{guardian.vehicle.plate_number}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Year</p>
                            <p className="text-gray-900 font-medium">{guardian.vehicle.year}</p>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            </div>

            {/* Children */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-6 text-gray-900">Children</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.children.map((child, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Name</p>
                          <p className="text-gray-900 font-medium">{child.name}</p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-sm">
                          Child {index + 1}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Age</p>
                          <p className="text-gray-900">{child.age} years</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Grade</p>
                          <p className="text-gray-900">Grade {child.grade}</p>
                        </div>
                      </div>
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-600">Medical Information</p>
                        <div className={`mt-1 p-3 rounded ${child.medical ? 'bg-red-50 border border-red-100' : 'bg-gray-50 border border-gray-200'}`}>
                          <p className={child.medical ? 'text-red-700' : 'text-gray-500'}>
                            {child.medical || 'No medical information provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Documents Tab
          <div className="p-8 space-y-8">
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-6 text-gray-900">Verification Documents</h3>
              <div className="space-y-6">
                {documentsState.map((doc) => (
                  <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{doc.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">{doc.type}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
    ${doc.status === 'verified'
                                ? 'bg-green-100 text-green-800'
                                : doc.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {doc.status === 'verified' ? 'Verified' :
                                doc.status === 'rejected' ? 'Rejected' : 'Pending Verification'}
                            </span>

                            {doc.status === 'verified' && (
                              <CheckCircleIcon className="h-4 w-4 text-green-600" />
                            )}
                            {doc.status === 'rejected' && (
                              <XCircleIcon className="h-4 w-4 text-red-600" />
                            )}
                          </div>

                        </div>
                      </div>
                      {doc.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleVerifyDocument(doc.id)}
                            className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                            title="Verify Document"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                          <button
  onClick={() => {
    setSelectedDocId(doc.id);
    setShowRejectModal(true);
  }}
  className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
  title="Reject Document"
>
  <XCircleIcon className="h-5 w-5" />
</button>

                        </div>
                      )}
                      {showRejectModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Document</h3>
      <textarea
        value={rejectReason}
        onChange={(e) => setRejectReason(e.target.value)}
        placeholder="Enter reason for rejection"
        className="w-full border border-gray-300 rounded-lg p-3 mb-4 h-32"
      />
      <div className="flex justify-end space-x-3">
        <button onClick={() => setShowRejectModal(false)} className="text-gray-600 hover:underline">Cancel</button>
        <button
          onClick={async () => {
            if (!selectedDocId) return;
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/documents/${selectedDocId}/reject`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ reason: rejectReason }),
            });

            if (res.ok) {
              toast.success('Document rejected and parent notified');
              setDocumentsState(prev =>
                prev.map(doc =>
                  doc.id === selectedDocId ? { ...doc, status: 'rejected' } : doc
                )
              );
            } else {
              toast.error('Failed to reject document');
            }

            setShowRejectModal(false);
            setRejectReason('');
            setSelectedDocId(null);
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg"
          disabled={!rejectReason.trim()}
        >
          Reject
        </button>
      </div>
    </div>
  </div>
)}


                    </div>

                    {/* Document Preview */}
                    <div className="mt-4 bg-gray-100 p-2 rounded flex items-center justify-center">
                      {doc.type?.includes('jpg') || doc.type?.includes('jpeg') || doc.type?.includes('png') ? (
                        <img
                          src={`${LOCAL_BASE}/${doc.file_path}`}
                          alt={doc.name}
                          className="max-h-40 object-contain"
                        />


                      ) : (
                        <a
                          href={`${LOCAL_BASE}/${doc.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline text-sm"
                        >
                          View Document
                        </a>


                      )}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action buttons for pending profiles */}
        {isPending && (
          <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end space-x-4">
            <button
              onClick={() => setShowDenyConfirm(true)}
              className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
            >
              Deny Profile
            </button>
            <button
              onClick={() => setShowApproveConfirm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Approve Profile
            </button>
          </div>
        )}

        {/* Deny Confirmation Dialog */}
        {showDenyConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Deny Profile</h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to deny this profile? Please provide a reason.
              </p>
              <textarea
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                placeholder="Reason for denial"
                className="w-full border border-gray-300 rounded-lg p-3 mb-4 h-32"
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDenyConfirm(false)}
                  className="px-3 py-1.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeny}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  disabled={!denyReason.trim()}
                >
                  Deny
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approve Confirmation Dialog */}
        {showApproveConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Approve Profile</h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to approve this profile? This will create new accounts and allow them to generate QR codes.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowApproveConfirm(false)}
                  className="px-3 py-1.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  disabled={isApproving}
                >
                  {isApproving ? 'Approving...' : 'Approve'}
                </button>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}