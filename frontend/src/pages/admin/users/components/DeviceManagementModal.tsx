import { useState, useEffect } from 'react';
import {
  XMarkIcon,
  DeviceTabletIcon,
} from '@heroicons/react/24/outline';
import { LAN_API_BASE } from '@/lib/api/link';

interface Device {
  id: number;
  device_name: string;
  device_fingerprint: string;
  user_agent: string;
  registered_at: string;
}

interface DeviceManagementModalProps {
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
  };
  onUpdate: (deviceCount: number) => void;
}

export default function DeviceManagementModal({
  onClose,
  user,
  onUpdate,
}: DeviceManagementModalProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true);

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No auth token found');

        const res = await fetch(`${LAN_API_BASE}/devices/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (res.ok) {
          setDevices(data);
          onUpdate(data.length);
        } else {
          console.error('Server error:', res.status, data);
        }
      } catch (err) {
        console.error('Failed to fetch devices:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchDevices();
    }
  }, [user]);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Registered Devices</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <span className="loader"></span>
            </div>
          ) : devices.length > 0 ? (
            <ul className="space-y-4">
              {devices.map((device) => (
                <li
                  key={device.id}
                  className="border rounded-lg p-4 shadow-sm hover:shadow transition"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <DeviceTabletIcon className="h-6 w-6 text-indigo-600 mt-1" />
                    <div className="flex-grow">
                      <p className="font-medium text-gray-900">{device.device_name}</p>
                      <div className="flex items-center text-xs text-gray-600 mt-1">
                        Fingerprint: {device.device_fingerprint.slice(0, 24)}...
                        <button
                          className="ml-2 text-indigo-500 hover:underline"
                          onClick={() => copyToClipboard(device.device_fingerprint)}
                        >
                          Copy
                        </button>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Agent: <span className="break-all">{device.user_agent}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Registered: {new Date(device.registered_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-gray-500 bg-gray-50 p-6 rounded-lg">
              <DeviceTabletIcon className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              No devices registered yet
            </div>
          )}

          <div className="mt-6 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
