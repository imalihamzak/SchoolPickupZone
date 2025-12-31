import axios from 'axios';
import {useState} from "react"
import {
  DocumentIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowDownTrayIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { API_BASE_URL, LOCAL_BASE } from '@/lib/api/link';
import DeleteDocumentModal from './DeleteDocumentModal';

interface Document {
  id: string;
  type: string;
  childId?: string;
  childName?: string;
  fileName: string;
  uploadDate: string;
  status: string;
  required: boolean;
}


interface DocumentsViewProps {
  documents: Document[];
  requiredTypes: string[];
  onRefresh: () => void;
}

export default function DocumentsView({ documents, requiredTypes, onRefresh }: DocumentsViewProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);

  const requiredDocumentsStatus = requiredTypes.map(type => {
    const hasDocument = documents.some(doc => doc.type.includes(type));
    return { type, uploaded: hasDocument };
  });

  const allRequiredUploaded = requiredDocumentsStatus.every(doc => doc.uploaded);

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Document deleted');
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete document');
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = `${LOCAL_BASE}/uploads/documents/${fileName}`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error('Download failed');
    }
  };
  
  const formatDocumentType = (doc: Document) => {
    if (doc.type === 'Child Photo' && doc.childName) {
      return `${doc.type} (${doc.childName})`;
    }
    return doc.type;
  };
  
  

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Documents</h2>

        {!allRequiredUploaded ? (
          <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
            Required documents missing
          </div>
        ) : (
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            All required documents uploaded
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Required Documents</h3>
        <div className="space-y-2">
          {requiredDocumentsStatus.map((doc, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{doc.type}</span>
              {doc.uploaded ? (
                <span className="text-green-600 text-sm flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-1" /> Uploaded
                </span>
              ) : (
                <span className="text-red-600 text-sm flex items-center">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" /> Missing
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Uploaded</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-start">
                    <DocumentIcon className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                    <div>
                    <div className="text-sm font-medium text-gray-900">
                    {formatDocumentType(doc)}
                    </div>
                      <div className="text-sm text-gray-500">{doc.fileName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {doc.uploadDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                {doc.status === 'verified' ? (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
    <CheckCircleIcon className="h-4 w-4 mr-1" />
    Verified
  </span>
) : doc.status === 'pending' ? (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
    <ClockIcon className="h-4 w-4 mr-1" />
    Pending
  </span>
) : (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
    Rejected
  </span>
)}

                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {doc.required ? <span className="text-green-600">Yes</span> : <span className="text-gray-500">No</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => handleDownload(doc.fileName)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </button>
                    <button
  onClick={() => {
    setDocumentToDelete(doc);
    setIsDeleteModalOpen(true);
  }}
  className="text-red-600 hover:text-red-900"
  title="Delete"
>
  <TrashIcon className="h-5 w-5" />
</button>

                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {documents.length === 0 && (
          <div className="px-6 py-10 text-center text-gray-500">
            No documents uploaded yet
          </div>
        )}
      </div>

      {documentToDelete && (
  <DeleteDocumentModal
    isOpen={isDeleteModalOpen}
    onClose={() => setIsDeleteModalOpen(false)}
    document={documentToDelete}
    onDelete={async () => {
      await handleDelete(documentToDelete.id);
      setIsDeleteModalOpen(false);
      setDocumentToDelete(null);
    }}
  />
)}

    </div>

    
  );
}
