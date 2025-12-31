import { useState } from 'react';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  DocumentTextIcon, 
  UserCircleIcon, 
  EyeIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

// Sample data for demonstration
const pendingProfiles = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    children: 2,
    submittedAt: '2 hours ago',
    documents: [
      { id: 'd1', name: 'ID Verification', type: 'image/jpeg' },
      { id: 'd2', name: 'Proof of Relationship', type: 'application/pdf' },
    ],
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '(555) 987-6543',
    children: 1,
    submittedAt: '5 hours ago',
    documents: [
      { id: 'd3', name: 'ID Verification', type: 'image/jpeg' },
      { id: 'd4', name: 'Proof of Relationship', type: 'application/pdf' },
    ],
  },
  {
    id: '3',
    name: 'Robert Johnson',
    email: 'robert.johnson@example.com',
    phone: '(555) 555-5555',
    children: 3,
    submittedAt: '1 day ago',
    documents: [
      { id: 'd5', name: 'ID Verification', type: 'image/jpeg' },
      { id: 'd6', name: 'Proof of Relationship', type: 'application/pdf' },
      { id: 'd7', name: 'School Enrollment Form', type: 'application/pdf' },
    ],
  },
];

export default function PendingProfiles() {
  const [profiles, setProfiles] = useState(pendingProfiles);
  const [selectedProfile, setSelectedProfile] = useState<typeof pendingProfiles[0] | null>(null);
  const [isViewingDocuments, setIsViewingDocuments] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isDenyModalOpen, setIsDenyModalOpen] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  
  const handleApprove = (profileId: string) => {
    console.log(`Approving profile ${profileId}`);
    // In a real app, you would make an API call
    setProfiles(current => current.filter(profile => profile.id !== profileId));
    setIsApproveModalOpen(false);
    setSelectedProfile(null);
  };
  
  const handleDeny = (profileId: string, reason: string) => {
    console.log(`Denying profile ${profileId} with reason: ${reason}`);
    // In a real app, you would make an API call
    setProfiles(current => current.filter(profile => profile.id !== profileId));
    setIsDenyModalOpen(false);
    setSelectedProfile(null);
    setDenyReason('');
  };

  const openDocumentViewer = (profile: typeof pendingProfiles[0]) => {
    setSelectedProfile(profile);
    setIsViewingDocuments(true);
  };

  const openApproveModal = (profile: typeof pendingProfiles[0]) => {
    setSelectedProfile(profile);
    setIsApproveModalOpen(true);
  };

  const openDenyModal = (profile: typeof pendingProfiles[0]) => {
    setSelectedProfile(profile);
    setIsDenyModalOpen(true);
  };
  
  return (
    <DashboardLayout role="admin">
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pending Profile Requests</h1>
            <p className="mt-1 text-sm text-gray-600">
              Review and approve parent profile requests. Be sure to verify all documents before approval.
            </p>
          </div>
          
          {/* Profile List */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            {profiles.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No pending profile requests</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {profiles.map((profile) => (
                  <li key={profile.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserCircleIcon className="h-8 w-8 text-gray-500" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{profile.name}</h3>
                          <div className="mt-1 text-sm text-gray-600">
                            <p>{profile.email} • {profile.phone}</p>
                            <p className="mt-1">
                              {profile.children} {profile.children === 1 ? 'child' : 'children'} • Submitted {profile.submittedAt}
                            </p>
                          </div>
                          <div className="mt-2 flex space-x-2">
                            {profile.documents.map((doc) => (
                              <span 
                                key={doc.id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                <DocumentTextIcon className="h-4 w-4 mr-1" />
                                {doc.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openDocumentViewer(profile)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View Docs
                        </button>
                        <button
                          onClick={() => openDenyModal(profile)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                        >
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Deny
                        </button>
                        <button
                          onClick={() => openApproveModal(profile)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Approve
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <Transition appear show={isViewingDocuments} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsViewingDocuments(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Documents for {selectedProfile?.name}
                  </Dialog.Title>
                  <div className="mt-4 space-y-4">
                    {selectedProfile?.documents.map(doc => (
                      <div key={doc.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-gray-500">{doc.type}</p>
                          </div>
                        </div>
                        <div className="mt-4 bg-gray-100 p-10 rounded flex items-center justify-center">
                          <p className="text-gray-500 text-sm">Document preview would appear here</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200"
                      onClick={() => setIsViewingDocuments(false)}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200"
                      onClick={() => {
                        setIsViewingDocuments(false);
                        if (selectedProfile) {
                          openDenyModal(selectedProfile);
                        }
                      }}
                    >
                      Deny
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200"
                      onClick={() => {
                        setIsViewingDocuments(false);
                        if (selectedProfile) {
                          openApproveModal(selectedProfile);
                        }
                      }}
                    >
                      Approve
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Approve Confirmation Modal */}
      <Transition appear show={isApproveModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsApproveModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Approve Profile Request
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to approve the profile request from <span className="font-medium">{selectedProfile?.name}</span>? 
                      This will create a new parent account and allow them to generate QR codes.
                    </p>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsApproveModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                      onClick={() => selectedProfile && handleApprove(selectedProfile.id)}
                    >
                      Approve
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Deny Confirmation Modal */}
      <Transition appear show={isDenyModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsDenyModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Deny Profile Request
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-4">
                      Are you sure you want to deny the profile request from <span className="font-medium">{selectedProfile?.name}</span>?
                    </p>
                    <div>
                      <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for denial
                      </label>
                      <textarea
                        id="reason"
                        rows={4}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Please provide a reason for denying this request"
                        value={denyReason}
                        onChange={(e) => setDenyReason(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsDenyModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                      onClick={() => selectedProfile && handleDeny(selectedProfile.id, denyReason)}
                      disabled={!denyReason.trim()}
                    >
                      Deny
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </DashboardLayout>
  );
}
