import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { toast } from 'react-toastify';

import { Button } from "@/components/ui/button";
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";
import { API_BASE_URL, LOCAL_BASE } from "@/lib/api/link";

export default function Profile() {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState<"parent" | "admin" | "super-admin">("parent"); // initial value won't matter after fetch
  const [userData, setUserData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setUserData(data);
        setFormData(data);
        setRole(data.role); // ✅ Get role from backend
      });
  }, []);
  

  if (!userData) {
    return (
      <DashboardLayout role={role}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const form = new FormData();
    form.append("firstName", formData.firstName);
    form.append("lastName", formData.lastName);
    form.append("email", formData.email);
    form.append("phone", formData.phone);
    if (selectedImage) {
      form.append("profilePicture", selectedImage);
    }
  
    const res = await fetch(`${API_BASE_URL}/auth/update-profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: form,
    });
  
    if (!res.ok) {
      toast.error("Failed to update profile");
      return;
    }
  
    const updated = await res.json();
    setUserData(updated);
    setFormData(updated);
    setIsEditing(false);
    setSelectedImage(null);
    toast.success("Profile updated successfully");
  };

  return (
    <DashboardLayout role={role}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
        <Button onClick={() => navigate(`/${role}`)} variant="outline">
        <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-primary-600 text-white">
            <h3 className="text-lg font-medium">Profile Settings</h3>
            <p className="mt-1 text-sm opacity-80">
              Manage your personal information and account security
            </p>
          </div>

          <div className="px-4 py-6 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center mb-8 pb-8 border-b border-gray-200">
              <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gray-100 overflow-hidden shadow-sm border">
                {selectedImage ? (
                  <img
                    src={URL.createObjectURL(selectedImage)}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : userData.profile_picture ? (
                  <img
                    src={`${LOCAL_BASE}${userData.profile_picture}`}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="h-full w-full text-gray-300" />
                )}
              </div>
              <div className="mt-5 sm:mt-0 sm:ml-8 flex flex-col">
                <h2 className="text-lg font-medium text-gray-900">
                  Profile Picture
                </h2>
                <p className="text-sm text-gray-500 mb-2">
                  Upload a clear photo for your profile
                </p>
                <input type="file" accept="image/*" onChange={handleImageChange} />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName || ""}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName || ""}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6 space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData(userData);
                    setSelectedImage(null);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
