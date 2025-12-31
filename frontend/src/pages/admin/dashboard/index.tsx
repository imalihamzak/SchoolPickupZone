import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  UsersIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api/link";
import { toast } from "react-toastify";

interface Stat {
  name: string;
  value: string | number;
  icon: any;
  color: string;
}

interface ScanData {
  hour?: string;
  day?: string;
  scans: number;
}

interface QRScan {
  id: number;
  studentName: string;
  guardianName: string;
  carDescription: string;
  time: string;
  date: string;
  guardName: string;
  status: string;
}

export default function AdminDashboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<Stat[]>([]);
  const [dailyScans, setDailyScans] = useState<ScanData[]>([]);
  const [weeklyScans, setWeeklyScans] = useState<ScanData[]>([]);
  const [qrScans, setQrScans] = useState<QRScan[]>([]);

  useEffect(() => {
    setIsVisible(true);
    const token = localStorage.getItem("token");

    fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setStats([
          {
            name: "Total Students",
            value: data.students,
            icon: BuildingOfficeIcon,
            color: "from-blue-500 to-blue-600",
          },
          {
            name: "Total Parents",
            value: data.parents,
            icon: UsersIcon,
            color: "from-purple-500 to-purple-600",
          },
          {
            name: "Total Guards",
            value: data.guards,
            icon: QrCodeIcon,
            color: "from-indigo-500 to-indigo-600",
          },
          {
            name: "Total QR codes",
            value: data.qrCodes,
            icon: ShieldCheckIcon,
            color: "from-cyan-500 to-cyan-600",
          },
        ]);
      });

    fetch(`${API_BASE_URL}/pickups/stats/today`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setDailyScans);

    fetch(`${API_BASE_URL}/pickups/stats/week`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setWeeklyScans);

    fetch(`${API_BASE_URL}/pickups/recent`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setQrScans)
      .catch((err) => {
        console.error("Failed to fetch recent QR scans:", err);
        setQrScans([]);
      });
  }, []);


  
  return (
    <DashboardLayout role="admin">


      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, index) => (
              <div
                key={stat.name}
                className={`transform transition-all duration-500 ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div
                  className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-5`}
                  />
                  <div className="flex items-center gap-4">
                    <div
                      className={`rounded-lg p-3 bg-gradient-to-r ${stat.color}`}
                    >
                      <stat.icon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.name}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div
              className={`transform transition-all duration-500 ${
                isVisible
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-4 opacity-0"
              }`}
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Today's QR Scans
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyScans}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="scans"
                        fill="#6366F1"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div
              className={`transform transition-all duration-500 ${
                isVisible
                  ? "translate-x-0 opacity-100"
                  : "translate-x-4 opacity-0"
              }`}
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Weekly QR Scans
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyScans}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="scans"
                        stroke="#6366F1"
                        strokeWidth={3}
                        dot={{ fill: "#6366F1", r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Recent QR Code Scans */}
          <div
            className={`transform transition-all duration-500 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            <h3 className="text-lg font-semibold mb-4">Recent QR Code Scans</h3>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
{/* Inside the Recent QR Code Scans Table section */}
<thead className="bg-gray-50">
  <tr>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guardian</th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Car</th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guard</th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
  </tr>
</thead>

<tbody className="bg-white divide-y divide-gray-200">
  {qrScans.map((scan) => (
    <tr key={scan.id} className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{scan.studentName}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{scan.guardianName}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{scan.carDescription}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {scan.time}
        <div className="text-xs text-gray-400">{scan.date}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{scan.guardName}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          scan.status === "Pending"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-green-100 text-green-800"
        }`}>
          {scan.status}
        </span>
      </td>
    </tr>
  ))}
</tbody>

                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
