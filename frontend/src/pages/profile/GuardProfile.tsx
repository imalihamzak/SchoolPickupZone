import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Add this
import GuardLayout from "@/components/layouts/GuardLayout";
import { API_BASE_URL, LOCAL_BASE } from "@/lib/api/link";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

export default function GuardProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const navigate = useNavigate(); // ✅ useNavigate hook

  useEffect(() => {
    fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      });
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData();
    form.append("firstName", user.firstName);
    form.append("lastName", user.lastName);
    form.append("email", user.email);
    form.append("phone", user.phone);
    if (selectedImage) form.append("profilePicture", selectedImage);

    const res = await fetch(`${API_BASE_URL}/auth/update-profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: form,
    });

    if (res.ok) {
      const updated = await res.json();
      setUser(updated);
      setSelectedImage(null);
      toast.success("Profile updated!");
    } else {
      toast.error("Update failed");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <GuardLayout>
      <div className="max-w-xl mx-auto mt-8 bg-white p-6 rounded-lg shadow">
        {/* ✅ Back Button */}
        <button
          onClick={() => navigate("/guard")}
          className="mb-6 inline-flex items-center text-sm text-primary-600 hover:underline"
        >
          ← Back to Dashboard
        </button>

        <h2 className="text-xl font-bold mb-4">Guard Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="h-24 w-24 rounded-full bg-gray-100 overflow-hidden">
              {selectedImage ? (
                <img src={URL.createObjectURL(selectedImage)} className="h-full w-full object-cover" />
              ) : user?.profile_picture ? (
                <img src={`${LOCAL_BASE}${user.profile_picture}`} className="h-full w-full object-cover" />
              ) : (
                <UserCircleIcon className="h-full w-full text-gray-300" />
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleImageChange} />
          </div>

          <input
            className="w-full p-2 border rounded"
            type="text"
            name="firstName"
            value={user.firstName}
            onChange={(e) => setUser({ ...user, firstName: e.target.value })}
            placeholder="First Name"
          />

          <input
            className="w-full p-2 border rounded"
            type="text"
            name="lastName"
            value={user.lastName}
            onChange={(e) => setUser({ ...user, lastName: e.target.value })}
            placeholder="Last Name"
          />

          <input
            className="w-full p-2 border rounded"
            type="email"
            name="email"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            placeholder="Email"
          />

          <input
            className="w-full p-2 border rounded"
            type="tel"
            name="phone"
            value={user.phone}
            onChange={(e) => setUser({ ...user, phone: e.target.value })}
            placeholder="Phone"
          />

          <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded">
            Save Changes
          </button>
        </form>
      </div>
    </GuardLayout>
  );
}
