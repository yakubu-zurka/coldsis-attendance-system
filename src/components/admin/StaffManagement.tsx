import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  useFirebaseRead,
  firebaseDelete,
  firebaseUpdate,
} from "../../hooks/useFirebaseSync";
import { Trash2, Plus, Search, Loader2, X, Pencil, ShieldCheck, AlertTriangle } from "lucide-react";
import { StaffMember } from "../../types";
import { generatePin, hashPin } from "../../utils/pin";

interface StaffManagementProps {
  isAddForm?: boolean;
}

export function StaffManagement({ isAddForm = false }: StaffManagementProps) {
  const { data: staffData, loading } = useFirebaseRead<Record<string, StaffMember>>("staff");

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    userType: "Staff", // Options: Staff, Intern, NSS
    staffId: "", 
    name: "",
    email: "",
    telephone: "",
    role: "",
    department: "",
    pin: "",
  });

  // Calculate the next ID sequence purely based on userType prefix
  const generateNextId = (type: string) => {
    let prefix = "COLD";
    if (type === "Intern") prefix = "INT";
    if (type === "NSS") prefix = "NSS";

    // Find all existing IDs with this prefix to determine the numeric max
    const existingNums = staff
      .map(s => s.id || "")
      .filter(id => id.startsWith(`${prefix}-`))
      .map(id => {
        const parts = id.split("-");
        return parts.length === 2 ? parseInt(parts[1], 10) : 0;
      })
      .filter(n => !isNaN(n));

    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
    const nextNum = maxNum + 1;
    
    // Format as PREFIX-XXX
    return `${prefix}-${nextNum.toString().padStart(3, "0")}`;
  };

  // Sync staffId whenever the userType changes (only during addition)
  useEffect(() => {
    if (!editingId && showForm) {
      setFormData(prev => ({
        ...prev,
        staffId: generateNextId(prev.userType)
      }));
    }
  }, [formData.userType, staff, showForm, editingId]);

  /* ------------------ LOAD STAFF ------------------ */
  useEffect(() => {
    if (staffData) {
      setStaff(
        Object.entries(staffData).map(([id, member]) => ({
          ...member,
          id, // id will now be your manual ID (e.g. COLD-001)
        }))
      );
    }
  }, [staffData]);

  const openAddForm = () => {
    setEditingId(null);
    setFormData({ userType: "Staff", staffId: "", name: "", email: "", telephone: "", role: "", department: "", pin: "" });
    setShowForm(true);
  };

  const openEditForm = (member: StaffMember) => {
    setEditingId(member.id!);
    
    // Determine userType backward compatibility based on existing ID prefix
    let parsedType = "Staff";
    if (member.id?.startsWith("INT-")) parsedType = "Intern";
    if (member.id?.startsWith("NSS-")) parsedType = "NSS";

    setFormData({
      userType: parsedType,
      staffId: member.id!,
      name: member.name,
      email: member.email,
      telephone: member.telephone,
      role: member.role,
      department: member.department || "", 
      pin: "", 
    });
    setShowForm(true);
  };

  /* ------------------ ADD OR UPDATE STAFF ------------------ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.staffId || !formData.name || !formData.role || !formData.department) {
      toast.error("Staff ID, Name, Dept and Role are required.");
      return;
    }

    setAdding(true);

    try {
      if (editingId) {
        // Update existing record
        await firebaseUpdate(`staff/${editingId}`, {
          name: formData.name,
          email: formData.email,
          telephone: formData.telephone,
          role: formData.role,
          department: formData.department,
          updatedAt: Date.now(),
        });
        toast.success("Staff record updated");
      } else {
        // Validation for new record
        if (formData.pin.length < 4) {
          toast.error("Please generate a PIN first");
          setAdding(false);
          return;
        }

        const pinHash = await hashPin(formData.pin);

        // Use custom staffId as the Firebase key
        await firebaseUpdate(`staff/${formData.staffId}`, {
          id: formData.staffId,
          name: formData.name,
          email: formData.email,
          telephone: formData.telephone,
          role: formData.role,
          department: formData.department,
          pinHash,
          createdAt: Date.now(),
        });

        toast.success(`Registered! ID: ${formData.staffId} | PIN: ${formData.pin}`, { duration: 6000 });
      }

      setShowForm(false);
      setEditingId(null);
    } catch (err: any) {
      toast.error("Operation failed. ID might already exist.");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-in fade-in slide-in-from-top-4' : 'animate-out fade-out slide-out-to-top-4'
        } max-w-md w-full bg-white shadow-xl rounded-2xl pointer-events-auto flex flex-col border border-red-100 overflow-hidden`}
      >
        <div className="bg-red-50 p-4 border-b border-red-100 flex items-start gap-3">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-bold">Delete Staff Record</h3>
            <p className="text-red-600/80 text-sm mt-1">Are you sure you want to permanently delete staff <span className="font-mono font-bold">{id}</span>? This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex bg-gray-50/50 p-2 gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const loadingToast = toast.loading("Deleting staff...");
              try {
                await firebaseDelete(`staff/${id}`);
                toast.success("Staff removed", { id: loadingToast });
              } catch (err) {
                toast.error("Delete failed", { id: loadingToast });
              }
            }}
            className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm"
          >
            Delete Permanently
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id?.toLowerCase().includes(search.toLowerCase()) ||
      s.department?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && staff.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-700" />
        <p className="text-gray-500 font-medium">Loading records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-8">
        <div>
          <h2 className="text-3xl font-black text-gray-800">Staff Directory</h2>
          <p className="text-gray-500 text-sm">Manage company-issued IDs and authentication</p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 bg-blue-700 text-white px-6 py-3 rounded-xl hover:bg-blue-800 transition-all shadow-lg active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Assign New ID
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          placeholder="Search by name, ID (e.g. COLD-001), or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-bold text-gray-600">ID & Name</th>
              <th className="p-4 font-bold text-gray-600 hidden md:table-cell">Dept / Role</th>
              <th className="p-4 font-bold text-gray-600 hidden lg:table-cell">Contact</th>
              <th className="p-4 font-bold text-gray-600 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredStaff.map((s) => (
              <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="p-4">
                  <div className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit mb-1">
                    {s.id}
                  </div>
                  <div className="font-bold text-gray-800">{s.name}</div>
                </td>
                <td className="p-4 hidden md:table-cell text-gray-600 font-medium">
                  <div>{s.department || "General"}</div>
                  <div className="text-xs text-gray-400 font-normal">{s.role}</div>
                </td>
                <td className="p-4 hidden lg:table-cell text-gray-500">
                  <div className="text-xs">{s.email}</div>
                  <div className="text-xs">{s.telephone}</div>
                </td>
                <td className="p-4 flex justify-center gap-2">
                  <button onClick={() => openEditForm(s)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteStaff(s.id!)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                <ShieldCheck className="text-blue-700" />
                {editingId ? "Update Record" : "Assign Staff ID"}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* USER TYPE SELECTION */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1">User Type</label>
                <div className="flex gap-4">
                  {["Staff", "Intern", "NSS"].map((type) => (
                    <label key={type} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all cursor-pointer ${
                      formData.userType === type 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' 
                      : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                    } ${editingId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input 
                        type="radio" 
                        name="userType" 
                        value={type} 
                        checked={formData.userType === type}
                        onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                        disabled={!!editingId}
                        className="hidden"
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              {/* STAFF ID FIELD */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Company Issued ID</label>
                <input
                  className="w-full px-4 py-3 border rounded-xl outline-none transition-all font-mono uppercase bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  placeholder="e.g. COLD-001"
                  value={formData.staffId}
                  readOnly
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Full Name</label>
                <input
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">Department</label>
                  <input
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Finance"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">Role</label>
                  <input
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">Phone Number</label>
                  <input
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">Work Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {!editingId && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mt-2">
                  <label className="text-xs font-bold text-blue-700 block mb-2 text-center uppercase">Security Credential</label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      className="flex-1 px-4 py-3 bg-white border border-blue-200 rounded-xl font-mono text-center tracking-[0.5em] text-lg font-bold"
                      value={formData.pin}
                      placeholder="----"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pin: generatePin(4) })}
                      className="px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors text-sm"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2 text-center italic">PIN will be hashed and hidden after save.</p>
                </div>
              )}

              <button
                disabled={adding}
                className="w-full bg-blue-950 text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-blue-900 transition-all disabled:opacity-50 mt-4"
              >
                {adding ? <Loader2 className="animate-spin mx-auto" /> : editingId ? "SAVE UPDATES" : "REGISTER & ACTIVATE"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}