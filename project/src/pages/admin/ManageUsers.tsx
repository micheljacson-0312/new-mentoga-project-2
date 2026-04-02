import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/types";
import {
  Search,
  Shield,
  ShieldCheck,
  UserCog,
  Trash2,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  X,
  Edit2,
  Save,
  Mail,
  User as UserIcon
} from "lucide-react";

export default function ManageUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    email: ""
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers((data || []) as UserProfile[]);
    } catch (error) {
      console.error("Error fetching users:", error);
      setActionMessage({ type: "error", text: "Failed to load users" });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      if (newRole === "consultant") {
        // Ensure they have a consultant profile
        const { error: consultantError } = await supabase
          .from("consultants")
          .upsert({ 
            user_id: userId,
            is_active: true // Auto-activate when changed by admin
          });
        
        if (consultantError) {
          console.error("Error creating consultant profile:", consultantError);
        }
      }

      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, role: newRole as any } : u
        )
      );
      setActionMessage({
        type: "success",
        text: `User role updated to ${newRole}`,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      setActionMessage({ type: "error", text: "Failed to update role" });
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    try {
      setLoading(true); // Reuse loading state or add a specific deleting state
      
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { 
          userId: user.id, 
          authId: user.auth_id 
        }
      });

      if (error) throw error;

      setUsers(users.filter((u) => u.id !== user.id));
      setConfirmDelete(null);
      setActionMessage({ type: "success", text: "User and Authentication deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      setActionMessage({ 
        type: "error", 
        text: error.message || "Failed to delete user. Make sure Edge Functions are deployed." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setEditFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email
    });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("user_profiles")
        .update(editFormData)
        .eq("id", editingUser.id);

      if (error) throw error;

      setUsers(
        users.map((u) =>
          u.id === editingUser.id ? { ...u, ...editFormData } : u
        )
      );
      setEditingUser(null);
      setActionMessage({ type: "success", text: "User updated successfully" });
    } catch (error: any) {
      console.error("Error saving user:", error);
      setActionMessage({ type: "error", text: error.message || "Failed to save user" });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === "" ||
      (user.first_name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (user.last_name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700";
      case "consultant":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <ShieldCheck className="w-4 h-4" />;
      case "consultant":
        return <UserCog className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {actionMessage && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            actionMessage.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">{actionMessage.text}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="appearance-none bg-white border border-slate-300 rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="consultant">Consultants</option>
            <option value="admin">Admins</option>
          </select>
          <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {users.filter((u) => u.role === "user").length}
          </p>
          <p className="text-xs text-slate-600">Users</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">
            {users.filter((u) => u.role === "consultant").length}
          </p>
          <p className="text-xs text-blue-600">Consultants</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-purple-700">
            {users.filter((u) => u.role === "admin").length}
          </p>
          <p className="text-xs text-purple-600">Admins</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                  Joined
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">
                          {user.first_name || ""} {user.last_name || ""}
                          {!user.first_name && !user.last_name && (
                            <span className="text-slate-400 italic">
                              No name
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(
                          user.role
                        )}`}
                      >
                        {getRoleIcon(user.role)}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(user.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(user.id, e.target.value)
                          }
                          className="appearance-none bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="user">User</option>
                          <option value="consultant">Consultant</option>
                          <option value="admin">Admin</option>
                        </select>

                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit user"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {confirmDelete === user.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="p-1 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(user.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <UserCog className="w-4 h-4 text-blue-600" />
                Edit User Details
              </h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">First Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={editFormData.first_name}
                      onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                      placeholder="First Name"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Last Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={editFormData.last_name}
                      onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                      placeholder="Last Name"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-bold shadow-lg shadow-blue-100 transition-all flex justify-center items-center gap-2"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500 mt-3">
        Showing {filteredUsers.length} of {users.length} users
      </p>
    </div>
  );
}
