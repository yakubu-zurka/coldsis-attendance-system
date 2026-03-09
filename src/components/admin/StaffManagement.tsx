import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  useFirebaseRead,
  firebasePush,
  firebaseDelete,
  firebaseUpdate,
} from "../../hooks/useFirebaseSync";
import { Trash2, Plus, Search, Loader2, X, Pencil } from "lucide-react";
import { StaffMember } from "../../types";
import { generatePin, hashPin } from "../../utils/pin";

interface StaffManagementProps {
  isAddForm?: boolean;
}

export function StaffManagement({ isAddForm = false }: StaffManagementProps) {
  const { data: staffData, loading } =
    useFirebaseRead<Record<string, StaffMember>>("staff");

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    telephone: "",
    role: "",
    pin: "",
  });

  /* ------------------ LOAD STAFF ------------------ */
  useEffect(() => {
    if (staffData) {
      setStaff(
        Object.entries(staffData).map(([id, member]) => ({
          ...member,
          id,
        }))
      );
    }
  }, [staffData]);

  /* ------------------ OPEN FORM FOR ADD ------------------ */
  const openAddForm = () => {
    setEditingId(null);
    setFormData({ name: "", email: "", telephone: "", role: "", pin: "" });
    setShowForm(true);
  };

  /* ------------------ OPEN FORM FOR EDIT ------------------ */
  const openEditForm = (member: StaffMember) => {
    setEditingId(member.id!);
    setFormData({
      name: member.name,
      email: member.email,
      telephone: member.telephone,
      role: member.role,
      pin: "", // Do not show hash, PIN stays hidden
    });
    setShowForm(true);
  };

  /* ------------------ ADD OR UPDATE STAFF ------------------ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.telephone || !formData.role) {
      toast.error("All fields except PIN are required.");
      return;
    }

    setAdding(true);

    try {
      if (editingId) {
        // Update staff
        await firebaseUpdate(`staff/${editingId}`, {
          name: formData.name,
          email: formData.email,
          telephone: formData.telephone,
          role: formData.role,
          updatedAt: Date.now(),
        });
        toast.success("Staff updated successfully");
      } else {
        // Add new staff
        if (formData.pin.length < 4 || formData.pin.length > 6) {
          toast.error("PIN must be 4–6 digits");
          setAdding(false);
          return;
        }
        const pinHash = await hashPin(formData.pin);

        await firebasePush("staff", {
          name: formData.name,
          email: formData.email,
          telephone: formData.telephone,
          role: formData.role,
          pinHash,
          pinLength: formData.pin.length,
          createdAt: Date.now(),
        });

        toast.success(`Staff added successfully. PIN: ${formData.pin}`);
      }

      // Reset form
      setFormData({ name: "", email: "", telephone: "", role: "", pin: "" });
      setShowForm(false);
      setEditingId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to save staff");
    } finally {
      setAdding(false);
    }
  };

  /* ------------------ DELETE STAFF ------------------ */
  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Are you sure you want to delete this staff?")) return;

    try {
      await firebaseDelete(`staff/${id}`);
      toast.success("Staff removed successfully");
    } catch (err) {
      toast.error("Failed to delete staff");
    }
  };

  /* ------------------ FILTER ------------------ */
  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  /* ------------------ LOADING ------------------ */
  if (loading && staff.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {!isAddForm && (
        <div className="flex justify-between items-center mt-8">
          <h2 className="text-2xl font-bold">Staff Management</h2>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add Staff
          </button>
        </div>
      )}

      {/* Search */}
      {!isAddForm && (
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border rounded-lg"
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left hidden md:table-cell">Email</th>
              <th className="p-3 text-left hidden lg:table-cell">Role</th>
              <th className="p-3 text-left hidden lg:table-cell">Phone</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((s) => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{s.name}</td>
                <td className="p-3 hidden md:table-cell">{s.email}</td>
                <td className="p-3 hidden lg:table-cell">{s.role}</td>
                <td className="p-3 hidden lg:table-cell">{s.telephone}</td>
                <td className="p-3 flex justify-center gap-3">
                  <button
                    onClick={() => openEditForm(s)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteStaff(s.id!)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slide-in Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex bg-black/40">
          <div className="flex-1" onClick={() => setShowForm(false)} />

          <div className="w-full max-w-md bg-white h-full shadow-xl p-6 animate-slideIn">
            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-bold">
                {editingId ? "Edit Staff" : "Add Staff"}
              </h3>
              <button onClick={() => setShowForm(false)}>
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                className="input"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />

              <input
                className="input"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />

              <input
                className="input"
                placeholder="Telephone"
                value={formData.telephone}
                onChange={(e) =>
                  setFormData({ ...formData, telephone: e.target.value })
                }
              />

              <input
                className="input"
                placeholder="Role"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              />

              {!editingId && (
                <div>
                  <label className="text-xs font-semibold">
                    Staff PIN (4–6 digits)
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      readOnly
                      className="input flex-1 font-mono tracking-widest"
                      placeholder="Generate PIN"
                      value={formData.pin}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const pin = generatePin(4);
                        setFormData({ ...formData, pin });
                        toast.success("PIN generated. Save it now.");
                      }}
                      className="px-3 bg-gray-200 rounded-lg"
                    >
                      Generate
                    </button>
                  </div>
                  {formData.pin && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠ PIN will not be shown again after saving
                    </p>
                  )}
                </div>
              )}

              <button
                disabled={adding}
                className="w-full bg-blue-950 text-white py-2 rounded-lg hover:bg-green-700"
              >
                {adding ? (editingId ? "Updating..." : "Adding...") : editingId ? "Update Staff" : "Add Staff"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}