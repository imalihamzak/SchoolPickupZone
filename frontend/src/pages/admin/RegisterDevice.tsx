// pages/RegisterDevice.tsx
import { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { useSearchParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LAN_API_BASE } from '@/lib/api/link';
export default function RegisterDevice() {
  const [searchParams] = useSearchParams();
  const guardId = searchParams.get('guardId');
  const token = searchParams.get('token');
  const [deviceName, setDeviceName] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [userAgent, setUserAgent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const collectFingerprint = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setFingerprint(result.visitorId);
      setUserAgent(navigator.userAgent);
      setLoading(false);
    };

    collectFingerprint();
  }, []);

  const handleSubmit = async () => {
    if (!guardId) {
      toast.error('Invalid guard ID in URL');
      return;
    }

    if (!deviceName.trim()) {
      toast.error('Please enter device name');
      return;
    }

    const payload = {
      guard_id: guardId,
      device_name: deviceName,
      device_fingerprint: fingerprint,
      user_agent: userAgent,
      token: token
    };

    try {
        const res = await fetch(`${LAN_API_BASE}/devices/register`, {
            method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Registration failed');
      } else {
        toast.success('Device registered successfully');
      }
    } catch (err) {
      toast.error('Something went wrong');
    }
  };

  if (loading) return <p className="text-center mt-10">Loading device info...</p>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4">
        <h1 className="text-xl font-bold text-center">Register Guard Device</h1>
        <p className="text-gray-600 text-sm">You're registering this device for QR scan access.</p>

        <div>
          <label className="block text-sm font-medium mb-1">Device Name</label>
          <input
            type="text"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="e.g. Samsung Galaxy A12"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
        >
          Register Device
        </button>

        <p className="text-xs text-gray-400 text-center mt-2">
          Device ID: <span className="text-gray-500">{fingerprint}</span>
        </p>
        <p className="text-xs text-gray-400 text-center">
          User Agent: <span className="text-gray-500">{userAgent}</span>
        </p>

        <ToastContainer />
      </div>
    </div>
  );
}
