// this page include all the info which is dummy for now, like child name, grade, guardian info like name, relation, contact, vehicle on which he came, there will guard info too, who scanned the code. so clicking on notification, will lead admin to this page, where he will confirm or decline, according to taht database will change and on dashbaord status pending to cofirm will change, 
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { QrCodeIcon, CheckIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Mock data for demonstration
const scannedStudents = [
  {
    id: '1',
    name: 'Emma Smith',
    grade: '3rd Grade',
    guardian: {
      name: 'David Smith',
      relation: 'Grandfather',
      phone: '555-987-6543',
      authorized: true,
    },
    car: 'Red Toyota Camry',
    scannedAt: '3:15 PM',
  },
  {
    id: '2',
    name: 'Michael Brown',
    grade: '5th Grade',
    guardian: {
      name: 'Sarah Johnson',
      relation: 'Aunt',
      phone: '555-123-4567',
      authorized: true,
    },
    car: 'Blue Honda Civic',
    scannedAt: '3:18 PM',
  },
];

export default function ScannerView() {
  const [currentScan, setCurrentScan] = useState<typeof scannedStudents[0] | null>(null);
  const [recentScans, setRecentScans] = useState<typeof scannedStudents>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<'success' | 'warning' | 'error' | null>(null);

  useEffect(() => {
    // In a real app, this would be populated from a real QR scan
    // For demo, we're setting it after 3 seconds
    const timer = setTimeout(() => {
      if (!currentScan) {
        setCurrentScan(scannedStudents[0]);
        setScanResult('success');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentScan]);

  const handleConfirmPickup = () => {
    if (currentScan) {
      // In a real app, you would submit this to your API
      setRecentScans(prev => [currentScan, ...prev]);
      setScanResult(null);
      setCurrentScan(null);

      // Simulate next scan after 5 seconds for demo
      setTimeout(() => {
        setCurrentScan(scannedStudents[1]);
        setScanResult('success');
      }, 5000);
    }
  };

  const handleDeclinePickup = () => {
    // In a real app, you would log the declined pickup
    setScanResult(null);
    setCurrentScan(null);
  };

  const toggleScanner = () => {
    setShowScanner(!showScanner);
  };

  return (
    <DashboardLayout role="admin">
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">QR Scanner</h1>
          </div>

          {/* Scanner UI */}
          {showScanner && (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="mx-auto w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4">
                {currentScan ? (
                  <div className="text-center">
                    <CheckIcon className="h-16 w-16 text-green-500 mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">QR Code detected!</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <QrCodeIcon className="h-16 w-16 text-gray-400 mx-auto animate-pulse" />
                    <p className="mt-2 text-sm text-gray-500">Waiting for QR Code...</p>
                  </div>
                )}
              </div>
              <p className="text-gray-500 text-sm">Position the QR code in the center of the camera view</p>
            </div>
          )}

          {/* Current Scan Result */}
          {currentScan && scanResult && (
            <div className={`bg-white rounded-xl shadow-sm overflow-hidden border-l-4 ${
              scanResult === 'success' ? 'border-green-500' : 
              scanResult === 'warning' ? 'border-yellow-500' : 'border-red-500'
            }`}>
              <div className="p-6">
                <div className="flex items-start">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{currentScan.name}</h2>
                    <p className="text-gray-600">{currentScan.grade}</p>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Guardian Information</h3>
                        <p className="mt-1 text-sm text-gray-900">{currentScan.guardian.name} ({currentScan.guardian.relation})</p>
                        <p className="text-sm text-gray-600">{currentScan.guardian.phone}</p>
                        {currentScan.guardian.authorized ? (
                          <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Authorized
                          </span>
                        ) : (
                          <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Not Authorized
                          </span>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Vehicle Information</h3>
                        <p className="mt-1 text-sm text-gray-900">{currentScan.car}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                <button
                  onClick={handleDeclinePickup}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <XMarkIcon className="h-5 w-5 mr-2 text-gray-400" />
                  Decline
                </button>
                <button
                  onClick={handleConfirmPickup}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Confirm Pickup
                </button>
              </div>
            </div>
          )}

          {/* Recent Scans */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Recent Pickups</h2>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {recentScans.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No recent pickups
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {recentScans.map((scan) => (
                    <li key={scan.id}>
                      <div className="px-6 py-4 flex items-center hover:bg-gray-50 transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center">
                            <p className="font-medium text-gray-900 truncate">{scan.name}</p>
                            <span className="ml-2 flex-shrink-0 text-sm text-gray-500">
                              {scan.scannedAt}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center">
                            <p className="text-sm text-gray-500 truncate">
                              Picked up by {scan.guardian.name} • {scan.car}
                            </p>
                          </div>
                        </div>
                        <div>
                          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
