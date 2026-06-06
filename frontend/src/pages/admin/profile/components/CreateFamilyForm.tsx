import { useState } from "react";
import { XMarkIcon, PlusIcon, TrashIcon, DocumentIcon } from "@heroicons/react/24/outline";
import type { Family, Document } from "../types";
import { AdminSelect } from "@/components/ui/admin-controls";

interface CreateFamilyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Family) => void;
}

const defaultFamily: Omit<Family, "id" | "submittedAt" | "status"> = {
  familyName: "",
  parent: { name: "", email: "", phone: "", address: "" },
  guardians: [{
    name: "",
    relation: "",
    phone: "",
    vehicleName: "",
    make: "",
    model: "",
    color: "",
    plateNumber: "",
    year: ""
  }],

  children: [{ name: "", age: "", grade: "", medical: "" }],
  documents: [],
};

const relationOptions = [
  { value: "", label: "Select Relation" },
  { value: "Grandparent", label: "Grandparent" },
  { value: "Aunt", label: "Aunt" },
  { value: "Uncle", label: "Uncle" },
  { value: "Family Friend", label: "Family Friend" },
  { value: "Sibling", label: "Sibling" },
  { value: "Other", label: "Other" },
];

const gradeOptions = [
  { value: "", label: "Select Grade" },
  { value: "1", label: "Grade 1" },
  { value: "2", label: "Grade 2" },
  { value: "3", label: "Grade 3" },
  { value: "4", label: "Grade 4" },
  { value: "5", label: "Grade 5" },
  { value: "5", label: "Grade 6" },
  { value: "5", label: "Grade 7" },
  { value: "5", label: "Grade 8" },
];

export default function CreateFamilyForm({
  isOpen,
  onClose,
  onSubmit,
}: CreateFamilyFormProps) {
  const [formData, setFormData] = useState(defaultFamily);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string[]> = {};

    // Family Name validation
    if (!formData.familyName) {
      newErrors.familyName = ["Family name is required"];
    }

    // Parent validation
    if (
      !formData.parent.name ||
      !formData.parent.email ||
      !formData.parent.phone
    ) {
      newErrors.parent = [];
      if (!formData.parent.name) newErrors.parent.push("Name is required");
      if (!formData.parent.email) newErrors.parent.push("Email is required");
      if (!formData.parent.phone) newErrors.parent.push("Phone is required");
    }

    // Guardian validation
    formData.guardians.forEach((guardian, index) => {
      if (!guardian.name || !guardian.phone || !guardian.relation) {
        newErrors[`guardian${index}`] = [];
        if (!guardian.name)
          newErrors[`guardian${index}`].push("Name is required");
        if (!guardian.phone)
          newErrors[`guardian${index}`].push("Phone is required");
        if (!guardian.relation)
          newErrors[`guardian${index}`].push("Relation is required");
      }
    });

    // Children validation
    formData.children.forEach((child, index) => {
      if (!child.name || !child.grade) {
        newErrors[`child${index}`] = [];
        if (!child.name) newErrors[`child${index}`].push("Name is required");
        if (!child.grade) newErrors[`child${index}`].push("Grade is required");
      }
    });

    // Document validation
    if (!formData.documents || formData.documents.length === 0) {
      newErrors.documents = ["At least one verification document is required"];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        status: "Pending",
        submittedAt: new Date().toISOString(),
      } as Family);
    }
  };

  const updateParent = (field: keyof typeof formData.parent, value: string) => {
    setFormData({
      ...formData,
      parent: { ...formData.parent, [field]: value },
    });
  };

  const addGuardian = () => {
    if (formData.guardians.length < 2) {
      setFormData({
        ...formData,
        guardians: [
          ...formData.guardians,
          { name: "", relation: "", phone: "" },
        ],
      });
    }
  };

  const removeGuardian = (index: number) => {
    if (formData.guardians.length > 1) {
      setFormData({
        ...formData,
        guardians: formData.guardians.filter((_, i) => i !== index),
      });
    }
  };

  const updateGuardian = (
    index: number,
    field: keyof (typeof formData.guardians)[0],
    value: string
  ) => {
    const newGuardians = [...formData.guardians];
    newGuardians[index] = { ...newGuardians[index], [field]: value };
    setFormData({ ...formData, guardians: newGuardians });
  };

  const addChild = () => {
    setFormData({
      ...formData,
      children: [
        ...formData.children,
        { name: "", age: "", grade: "", medical: "" },
      ],
    });
  };

  const removeChild = (index: number) => {
    if (formData.children.length > 1) {
      setFormData({
        ...formData,
        children: formData.children.filter((_, i) => i !== index),
      });
    }
  };

  const updateChild = (
    index: number,
    field: keyof (typeof formData.children)[0],
    value: string
  ) => {
    const newChildren = [...formData.children];
    newChildren[index] = { ...newChildren[index], [field]: value };
    setFormData({ ...formData, children: newChildren });
  };

  const addDocument = (file: File) => {
    if (file) {
      const newDocument: Document = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        size: file.size,
        file: file,
        status: 'pending',
      };

      setFormData({
        ...formData,
        documents: [...(formData.documents || []), newDocument],
      });
    }
  };

  const removeDocument = (docId: string) => {
    setFormData({
      ...formData,
      documents: (formData.documents || []).filter(doc => doc.id !== docId),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            New Family Profile
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Family Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Family Name
            </label>
            <input
              type="text"
              value={formData.familyName}
              onChange={(e) =>
                setFormData({ ...formData, familyName: e.target.value })
              }
              className={`w-full border rounded-lg p-2.5 ${errors.familyName ? "border-red-500" : "border-gray-300"
                }`}
              placeholder="e.g., Smith Family"
            />
            {errors.familyName && (
              <p className="mt-1 text-sm text-red-500">
                {errors.familyName[0]}
              </p>
            )}
          </div>

          {/* Parent Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Parent Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.parent.name}
                  onChange={(e) => updateParent("name", e.target.value)}
                  className={`w-full border rounded-lg p-2.5 ${errors.parent?.includes("Name is required")
                      ? "border-red-500"
                      : "border-gray-300"
                    }`}
                />
                {errors.parent?.includes("Name is required") && (
                  <p className="mt-1 text-sm text-red-500">Name is required</p>
                )}
              </div>

              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.parent.email}
                  onChange={(e) => updateParent("email", e.target.value)}
                  className={`w-full border rounded-lg p-2.5 ${errors.parent?.includes("Email is required")
                      ? "border-red-500"
                      : "border-gray-300"
                    }`}
                />
                {errors.parent?.includes("Email is required") && (
                  <p className="mt-1 text-sm text-red-500">Email is required</p>
                )}
              </div>

              <div>
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.parent.phone}
                  onChange={(e) => updateParent("phone", e.target.value)}
                  className={`w-full border rounded-lg p-2.5 ${errors.parent?.includes("Phone is required")
                      ? "border-red-500"
                      : "border-gray-300"
                    }`}
                />
                {errors.parent?.includes("Phone is required") && (
                  <p className="mt-1 text-sm text-red-500">Phone is required</p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Address"
                  value={formData.parent.address}
                  onChange={(e) => updateParent("address", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                />
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Required Documents</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-4">
                Please upload the following documents for verification:
              </p>
              <ul className="list-disc pl-6 mb-6 text-sm text-gray-600 space-y-1">
                <li>Parent ID (government-issued identification)</li>
                <li>Proof of relationship to children (birth certificate, adoption papers, etc.)</li>
                <li>Proof of address (utility bill, lease agreement, etc.)</li>
                <li>School enrollment verification (if applicable)</li>
              </ul>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
                <input
                  type="file"
                  id="document-upload"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      addDocument(e.target.files[0]);
                    }
                    // Reset the input value so the same file can be uploaded again if needed
                    e.target.value = '';
                  }}
                  accept="image/*, application/pdf"
                />
                <label
                  htmlFor="document-upload"
                  className="cursor-pointer bg-white py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <PlusIcon className="h-5 w-5 inline-block mr-1 -mt-0.5" />
                  Upload Document
                </label>
                <p className="mt-2 text-xs text-gray-500">
                  PNG, JPG, PDF up to 5MB
                </p>
              </div>

              {/* Uploaded Documents List */}
              {formData.documents && formData.documents.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Uploaded Documents ({formData.documents.length})
                  </h4>
                  <ul className="space-y-2">
                    {formData.documents.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-50 rounded-md">
                            <DocumentIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                              {doc.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {doc.size ? Math.round(doc.size / 1024) + ' KB' : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => doc.id && removeDocument(doc.id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {errors.documents && (
                <p className="mt-3 text-sm text-red-500">{errors.documents[0]}</p>
              )}
            </div>
          </div>

          {/* Guardians */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Guardians</h3>
              {formData.guardians.length < 2 && (
                <button
                  type="button"
                  onClick={addGuardian}
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Guardian
                </button>
              )}
            </div>

            <div className="space-y-4">
              {formData.guardians.map((guardian, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg relative">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={guardian.name}
                      onChange={(e) =>
                        updateGuardian(index, "name", e.target.value)
                      }
                      className={`border rounded-lg p-2.5 ${errors[`guardian${index}`]?.includes("Name is required")
                          ? "border-red-500"
                          : "border-gray-300"
                        }`}
                    />
                    <AdminSelect
                      value={guardian.relation}
                      onChange={(value) => updateGuardian(index, "relation", value)}
                      options={relationOptions}
                      className="full"
                      ariaLabel="Guardian relation"
                      invalid={errors[`guardian${index}`]?.includes("Relation is required")}
                    />

                    <div className="flex gap-2">
                      <input
                        type="tel"
                        placeholder="Phone"
                        value={guardian.phone}
                        onChange={(e) =>
                          updateGuardian(index, "phone", e.target.value)
                        }
                        className={`flex-1 border rounded-lg p-2.5 ${errors[`guardian${index}`]?.includes(
                          "Phone is required"
                        )
                            ? "border-red-500"
                            : "border-gray-300"
                          }`}
                      />
                      {formData.guardians.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeGuardian(index)}
                          className="p-2.5 text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>


                  </div>
                  <div className="mt-4">
  <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Information</label>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
  <input
      type="text"
      placeholder="Vehicle Name"
      value={guardian.vehicleName}
      onChange={(e) => updateGuardian(index, "vehicleName", e.target.value)}
      className="border border-gray-300 rounded-lg p-2.5"
    />
    <input
      type="text"
      placeholder="Make"
      value={guardian.make}
      onChange={(e) => updateGuardian(index, "make", e.target.value)}
      className="border border-gray-300 rounded-lg p-2.5"
    />
    <input
      type="text"
      placeholder="Model"
      value={guardian.model}
      onChange={(e) => updateGuardian(index, "model", e.target.value)}
      className="border border-gray-300 rounded-lg p-2.5"
    />
    <input
      type="text"
      placeholder="Color"
      value={guardian.color}
      onChange={(e) => updateGuardian(index, "color", e.target.value)}
      className="border border-gray-300 rounded-lg p-2.5"
    />
    <input
      type="text"
      placeholder="Plate Number"
      value={guardian.plateNumber}
      onChange={(e) => updateGuardian(index, "plateNumber", e.target.value)}
      className="border border-gray-300 rounded-lg p-2.5"
    />
    <input
      type="number"
      placeholder="Year"
      value={guardian.year}
      onChange={(e) => updateGuardian(index, "year", e.target.value)}
      className="border border-gray-300 rounded-lg p-2.5"
    />
  </div>
</div>
                </div>

              ))}

            </div>
          </div>



          {/* Children */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Children</h3>
              <button
                type="button"
                onClick={addChild}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <PlusIcon className="h-4 w-4" />
                Add Child
              </button>
            </div>

            <div className="space-y-4">
              {formData.children.map((child, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={child.name}
                      onChange={(e) =>
                        updateChild(index, "name", e.target.value)
                      }
                      className={`border rounded-lg p-2.5 ${errors[`child${index}`]?.includes("Name is required")
                          ? "border-red-500"
                          : "border-gray-300"
                        }`}
                    />
                    <input
                      type="number"
                      placeholder="Age"
                      value={child.age}
                      onChange={(e) =>
                        updateChild(index, "age", e.target.value)
                      }
                      className="border border-gray-300 rounded-lg p-2.5"
                    />
                    <AdminSelect
                      value={child.grade}
                      onChange={(value) => updateChild(index, "grade", value)}
                      options={gradeOptions}
                      className="full"
                      ariaLabel="Child grade"
                      invalid={errors[`child${index}`]?.includes("Grade is required")}
                    />
                    <div className="flex gap-2">
                      {formData.children.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChild(index)}
                          className="p-2.5 text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="col-span-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medical Information
                    </label>
                    <textarea
                      placeholder="Enter allergies, medical conditions, or other health-related information"
                      value={child.medical}
                      onChange={(e) =>
                        updateChild(index, "medical", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg p-2.5 h-20"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Submit Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
