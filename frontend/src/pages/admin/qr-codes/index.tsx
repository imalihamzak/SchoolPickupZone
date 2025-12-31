import { useEffect, useState } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '@/lib/api/link';
import Select from 'react-select';
import Loader from '@/components/Loader';

interface QRItem {
  child: string;
  for: string;
  file: string;
  qr_code: string;
  guardian_id: number | null;
  child_id: number;
}

interface Parent {
  id: number;
  firstName: string;
  lastName: string;
}

export default function QRCodePage() {
  const [qrCodes, setQrCodes] = useState<QRItem[]>([]);
  const [activeTab, setActiveTab] = useState<'parent' | 'guardian1' | 'guardian2'>('parent');
  const [guardianMap, setGuardianMap] = useState<Record<number, string>>({});
  const [childrenMap, setChildrenMap] = useState<Record<number, string>>({});
  const [parents, setParents] = useState<Parent[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  const fetchParents = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/admin/parents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setParents(data);
    } catch {
      toast.error('Failed to load parents');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllQRData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [qrRes, guardianRes, childRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/qrcode`, { headers }),
        axios.get(`${API_BASE_URL}/guardians`, { headers }),
        axios.get(`${API_BASE_URL}/children`, { headers }),
      ]);

      const guardianMapTemp: Record<number, string> = {};
      guardianRes.data.forEach((g: any, index: number) => {
        guardianMapTemp[g.id] = index === 0 ? 'guardian1' : 'guardian2';
      });

      const childMapTemp: Record<number, string> = {};
      childRes.data.forEach((c: any) => {
        childMapTemp[c.id] = c.full_name;
      });

      setGuardianMap(guardianMapTemp);
      setChildrenMap(childMapTemp);
      setQrCodes(qrRes.data || []);
    } catch {
      toast.error('Failed to load all QR data');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (parentId: number) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [qrRes, guardianRes, childRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/qrcode?parent_id=${parentId}`, { headers }),
        axios.get(`${API_BASE_URL}/guardians?parent_id=${parentId}`, { headers }),
        axios.get(`${API_BASE_URL}/children?parent_id=${parentId}`, { headers }),
      ]);

      const guardianMapTemp: Record<number, string> = {};
      guardianRes.data.forEach((g: any, index: number) => {
        guardianMapTemp[g.id] = index === 0 ? 'guardian1' : 'guardian2';
      });

      const childMapTemp: Record<number, string> = {};
      childRes.data.forEach((c: any) => {
        childMapTemp[c.id] = c.full_name;
      });

      setGuardianMap(guardianMapTemp);
      setChildrenMap(childMapTemp);
      setQrCodes(qrRes.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load QR data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, []);

  useEffect(() => {
    if (selectedParentId) {
      fetchData(selectedParentId);
    } else {
      fetchAllQRData();
    }
  }, [selectedParentId]);

  const downloadQRCode = (file: string) => {
    const url = `${API_BASE_URL}/qrcode/download?file=${file}&token=${token}`;
    window.open(url, '_blank');
  };

  const filterQRCodes = () => {
    if (activeTab === 'parent') {
      return qrCodes.filter((qr) => qr.for === 'parent');
    }

    const guardianEntry = Object.entries(guardianMap).find(([, label]) => label === activeTab);
    if (!guardianEntry) return [];

    const guardianId = Number(guardianEntry[0]);
    return qrCodes.filter((qr) => qr.for === 'guardian' && qr.guardian_id === guardianId);
  };

  const tabClasses = (tab: string) =>
    `px-4 py-2 rounded-full text-sm font-medium transition ${
      activeTab === tab
        ? 'bg-indigo-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`;

  return (
    <DashboardLayout role="admin">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {loading ? (
          <div className="flex justify-center items-center h-[300px]">
            <Loader />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">QR Codes</h1>
              <p className="text-gray-500">
                {selectedParentId
                  ? 'Viewing QR codes for selected parent'
                  : 'Showing all QR codes for all parents'}
              </p>
            </div>

            {/* Parent Selector */}
            <div className="max-w-md mx-auto">
              <Select
                className="shadow-sm"
                options={parents.map((p) => ({
                  value: p.id,
                  label: `${p.firstName} ${p.lastName}`,
                }))}
                placeholder="Search and select a parent..."
                onChange={(selected) => setSelectedParentId(selected?.value || null)}
                isClearable
              />
            </div>

            {/* Tab Buttons */}
            {qrCodes.length > 0 && (
              <div className="flex justify-center space-x-3 mt-6">
                <button className={tabClasses('parent')} onClick={() => setActiveTab('parent')}>
                  Parent
                </button>
                <button className={tabClasses('guardian1')} onClick={() => setActiveTab('guardian1')}>
                  Guardian 1
                </button>
                <button className={tabClasses('guardian2')} onClick={() => setActiveTab('guardian2')}>
                  Guardian 2
                </button>
              </div>
            )}

            {/* QR Cards */}
            {qrCodes.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
                {filterQRCodes().map((qr, idx) => (
                  <div key={idx} className="bg-white border rounded-lg p-5 shadow hover:shadow-md transition">
                    <QRCodeSVG value={qr.qr_code || ''} size={160} className="mx-auto mb-4" />
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-800">{childrenMap[qr.child_id]}</h3>
                      <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                        {qr.for === 'parent' ? 'Parent' : 'Guardian'}
                      </span>
                    </div>
                    <button
                      onClick={() => downloadQRCode(qr.file.split('/').pop() || '')}
                      className="mt-4 w-full flex justify-center items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      Download QR Code
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && qrCodes.length > 0 && filterQRCodes().length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-10">
                No QR codes available in this tab.
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
