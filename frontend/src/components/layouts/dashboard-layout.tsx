import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  ChartPieIcon,
  UsersIcon,
  QrCodeIcon,
  ClockIcon,
  Bars3Icon,
  XMarkIcon,
  CreditCardIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { fetchWithBlockHandler } from '@/utils/fetchWithBlockHandler';

import { NotificationsContainer } from "@/components/shared/notifications";
// import { UserManagementMenu } from "@/components/shared/menus";
import { API_BASE_URL, LOCAL_BASE } from "@/lib/api/link";
// import { useNotifications } from "@/lib/hooks/useNotifications";

type SidebarItem = {
  name: string;
  icon: typeof ChartPieIcon;
  href: string;
};

const parentNavigation: SidebarItem[] = [
  { name: "Dashboard", href: "/parent", icon: ChartPieIcon },
  { name: "Profiles", href: "/parent/profiles", icon: UsersIcon },
];

const adminNavigation: SidebarItem[] = [
  { name: "Dashboard", href: "/admin", icon: ChartPieIcon },
  { name: "Profiles", href: "/admin/profiles", icon: UsersIcon },
  { name: "Users", href: "/admin/users", icon: UserGroupIcon },
  { name: "QR Codes", href: "/admin/qr-codes", icon: QrCodeIcon },
  { name: "Activity", href: "/admin/activity", icon: ClockIcon },
  { name: "Scanner", href: "/admin/scanner", icon: QrCodeIcon },
];

const superAdminNavigation: SidebarItem[] = [
  { name: "Dashboard", href: "/super-admin", icon: ChartPieIcon },
  { name: "Schools", href: "/super-admin/schools", icon: BuildingOfficeIcon },
  { name: "Admins", href: "/super-admin/admins", icon: UsersIcon },
  {
    name: "Subscriptions",
    href: "/super-admin/subscriptions",
    icon: CreditCardIcon,
  },
];

export default function DashboardLayout({
  children,
  role = "parent",
}: {
  children: React.ReactNode;
  role?: "parent" | "admin" | "super-admin";
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [accountAge, setAccountAge] = useState<number>(0);
  const [plans, setPlans] = useState<
    { id: number; name: string; price: number; billing_interval: string }[]
  >([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const [loadingSubscription, setLoadingSubscription] = useState(role === "admin");
  const [isBlocked, setIsBlocked] = useState(false);

  const navigation = {
    parent: parentNavigation,
    admin: adminNavigation,
    "super-admin": superAdminNavigation,
  }[role];
  const query = new URLSearchParams(location.search);
  const isFromStripe = query.get("success") === "true";
  

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
  
    const fetchUserProfileAndPlans = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (!res.ok) throw new Error("Unauthorized");
  
        const userData = await res.json();
        setUser(userData);
  
        // Check subscription block
        if (userData.role === "admin") {
          setSubscriptionStatus(userData.subscriptionStatus);
          setAccountAge(userData.accountAgeDays);
  
          if (
            userData.subscriptionStatus !== "Active" &&
            userData.accountAgeDays > 7
          ) {
            setIsBlocked(true);
          }
  
          // Fetch plans
          const plansRes = await fetch(`${API_BASE_URL}/superadmin/plans`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const plansData = await plansRes.json();
          if (Array.isArray(plansData) && plansData.length > 0) {
            setPlans(plansData);
            setSelectedPlanId(plansData[0].id);
          }
        }
  
        setLoadingSubscription(false);
      } catch (err: any) {
        console.error("Auth or subscription check failed", err);
        localStorage.removeItem("token");
        navigate("/login");
        setLoadingSubscription(false);
      }
    };
  
    fetchUserProfileAndPlans();
  }, []);
  
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  const handleClickOutside = (e: MouseEvent) => {
    const profileMenu = document.getElementById("profile-menu");
    if (profileMenu && !profileMenu.contains(e.target as Node)) {
      setProfileOpen(false);
    }
  };

  // Use useEffect instead of useState for side effects
  // This was causing error TS2554: Expected 0-1 arguments, but got 2
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const handlePayNow = async () => {
    const token = localStorage.getItem("token");
  
    if (!selectedPlanId) {
      toast("Please select a plan.");
      return;
    }
  
    try {
      const userRes = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const userData = await userRes.json();
      const schoolId = userData.school_id;
  
      const response = await fetch(`${API_BASE_URL}/superadmin/subscription/subscribe/create-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ schoolId, planId: selectedPlanId }),
      });
  
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Missing checkout URL");
      }
    } catch (err) {
      console.error("Checkout failed", err);
      toast("Checkout failed. See console for details.");
    }
  };

  const isAdminBlocked = role === "admin" && subscriptionStatus !== "Active" && accountAge > 7;
const isAdminInGrace = role === "admin" && subscriptionStatus !== "Active" && accountAge <= 7;
if (loadingSubscription) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <span className="loader"></span>
      </div>
  );
}

if (isBlocked) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full bg-white border border-red-300 p-6 rounded shadow text-center">
        <h2 className="text-xl font-bold text-red-700 mb-2">Access Blocked</h2>
        <p className="text-red-600 mb-4">
          Your subscription grace period has expired. Please subscribe to regain access.
        </p>
        {plans.length > 0 ? (
          <button
            onClick={handlePayNow}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
          >
            Pay Now
          </button>
        ) : (
          <p className="text-sm text-gray-500">No plans available to subscribe.</p>
        )}
      </div>
    </div>
  );
}



  return (
    <div>
      {/* Mobile sidebar */}
      <div
        className={cn(
          "relative z-50 lg:hidden",
          sidebarOpen ? "fixed inset-0 bg-gray-900/80" : "hidden"
        )}
      >
        <div className="fixed inset-0 flex">
          <div className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="-m-2.5 p-2.5"
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2 pt-5">
              <div className="flex items-center gap-2">
                <img className="h-8 w-auto" src="/logo.png" alt="PickupZone" />
                <h3 className="text-xl font-semibold text-gray-900">
                  PickupZone
                </h3>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <Link
                            to={item.href}
                            className={cn(
                              location.pathname === item.href
                                ? "bg-gray-50 text-primary-600"
                                : "text-gray-700 hover:bg-gray-50 hover:text-primary-600",
                              "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                            )}
                          >
                            <item.icon className="h-6 w-6 shrink-0" />
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col",
          sidebarCollapsed ? "lg:w-20" : "lg:w-72",
          "transition-all duration-300"
        )}
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
          <div className="flex h-16 shrink-0 items-center justify-between">
            <div
              className={cn(
                "flex items-center gap-2",
                sidebarCollapsed && "hidden"
              )}
            >
              <img className="h-8 w-auto" src="/logo.png" alt="PickupZone" />
              <h3 className="text-xl font-semibold text-gray-900">
                PickupZone
              </h3>
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarCollapsed ? (
                <ArrowRightIcon className="h-5 w-5" />
              ) : (
                <ArrowLeftIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={cn(
                          location.pathname === item.href
                            ? "bg-gray-50 text-primary-600"
                            : "text-gray-700 hover:bg-gray-50 hover:text-primary-600",
                          "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-colors",
                          sidebarCollapsed && "justify-center"
                        )}
                        title={sidebarCollapsed ? item.name : undefined}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {!sidebarCollapsed && item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div
        className={cn(
          "lg:pl-72 transition-all duration-300",
          sidebarCollapsed && "lg:pl-20"
        )}
      >
        {/* Top header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notification Bell */}
              <NotificationsContainer />

              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

              <div className="relative" id="profile-menu">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-100 overflow-hidden">
                    {user?.profile_picture ? (
                      <img
                        src={`${LOCAL_BASE}${user.profile_picture}`}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="h-6 w-6 text-gray-400" />
                    )}
                  </div>

                  <div
                    className={cn(
                      "flex flex-col items-start",
                      profileOpen && "text-primary-600"
                    )}
                  >
                    <span className="text-sm font-medium">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">{user?.role}</span>

                  </div>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 py-1 bg-white rounded-lg shadow-lg border border-gray-100">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <UserCircleIcon className="h-5 w-5" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <>
  {isAdminInGrace && (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 m-4 rounded shadow flex items-center justify-between">
      <div>
        <p className="font-semibold">Subscription Pending</p>
        <p>You have <strong>{7 - accountAge}</strong> day(s) left in your grace period.</p>
        {plans.length > 0 && (
          <p>Plan: <strong>{plans[0].name}</strong> – ${plans[0].price}/{plans[0].billing_interval}</p>
        )}
      </div>
      <button
        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm"
        onClick={handlePayNow}
        disabled={!plans.length}
      >
        Pay Now
      </button>
    </div>
  )}
  <main className="py-10">
    <div className="px-4 sm:px-6 lg:px-8">{children}</div>
  </main>
</>


      </div>
    </div>
  );
}