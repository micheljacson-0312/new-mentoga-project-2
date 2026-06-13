import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  DollarSign,
  Users,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface ConsultantWithProfile {
  id: string;
  user_id: string;
  expertise_tags: string[];
  hourly_rate: number;
  chat_rate_per_minute: number;
  video_rate_per_minute: number;
  average_rating: number;
  total_reviews: number;
  is_verified: boolean;
  is_active: boolean;
  languages: string[];
  years_of_experience: number | null;
  total_sessions: number;
  total_earnings: number;
  created_at: string;
  user_profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export default function ManageConsultants() {
  const [consultants, setConsultants] = useState<ConsultantWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchConsultants();
  }, []);

  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  const fetchConsultants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("consultants")
        .select("*, user_profiles!consultants_user_id_fkey(first_name, last_name, email)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setConsultants((data || []) as ConsultantWithProfile[]);
    } catch (error) {
      console.error("Error fetching consultants:", error);
      setActionMessage({
        type: "error",
        text: "Failed to load consultants",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVerified = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("consultants")
        .update({ is_verified: !currentStatus })
        .eq("user_id", id);

      if (error) throw error;

      setConsultants(
        consultants.map((c) =>
          (c.user_id || c.id) === id ? { ...c, is_verified: !currentStatus } : c
        )
      );
      setActionMessage({
        type: "success",
        text: `Consultant ${!currentStatus ? "verified" : "unverified"}`,
      });
    } catch (error) {
      console.error("Error toggling verification:", error);
      setActionMessage({
        type: "error",
        text: "Failed to update verification",
      });
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("consultants")
        .update({ is_active: !currentStatus })
        .eq("user_id", id);

      if (error) throw error;

      setConsultants(
        consultants.map((c) =>
          (c.user_id || c.id) === id ? { ...c, is_active: !currentStatus } : c
        )
      );
      setActionMessage({
        type: "success",
        text: `Consultant ${!currentStatus ? "activated" : "deactivated"}`,
      });
    } catch (error) {
      console.error("Error toggling active status:", error);
      setActionMessage({ type: "error", text: "Failed to update status" });
    }
  };

  const getName = (c: ConsultantWithProfile) => {
    const profile = c.user_profiles;
    if (profile) {
      const name = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
      return name || profile.email;
    }
    return "Unknown";
  };

  const getEmail = (c: ConsultantWithProfile) => {
    return c.user_profiles?.email || "N/A";
  };

  const filteredConsultants = consultants.filter((c) => {
    const name = getName(c).toLowerCase();
    const email = getEmail(c).toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      name.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase()) ||
      c.expertise_tags.some((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && c.is_active) ||
      (statusFilter === "inactive" && !c.is_active) ||
      (statusFilter === "verified" && c.is_verified) ||
      (statusFilter === "unverified" && !c.is_verified);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Action Message */}
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

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or expertise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-blue-700">{consultants.length}</p>
          <p className="text-xs text-blue-600">Total</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-green-700">
            {consultants.filter((c) => c.is_active).length}
          </p>
          <p className="text-xs text-green-600">Active</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-purple-700">
            {consultants.filter((c) => c.is_verified).length}
          </p>
          <p className="text-xs text-purple-600">Verified</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-amber-700">
            $
            {consultants
              .reduce((sum, c) => sum + c.total_earnings, 0)
              .toFixed(0)}
          </p>
          <p className="text-xs text-amber-600">Total Earnings</p>
        </div>
      </div>

      {/* Consultants Grid */}
      <div className="space-y-4">
        {filteredConsultants.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No consultants found
          </div>
        ) : (
          filteredConsultants.map((c) => (
            <div
              key={c.user_id || c.id}
              className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">
                      {getName(c)}
                    </h3>
                    {c.is_verified && (
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        c.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{getEmail(c)}</p>

                  {/* Stats Row */}
                  <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      {c.average_rating.toFixed(1)} ({c.total_reviews} reviews)
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-green-500" />$
                      {c.hourly_rate}/hr
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-500" />
                      {c.total_sessions} sessions
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-emerald-500" />$
                      {c.total_earnings.toFixed(0)} earned
                    </span>
                  </div>

                  {/* Tags */}
                  {c.expertise_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.expertise_tags.slice(0, 5).map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {c.expertise_tags.length > 5 && (
                        <span className="text-xs text-slate-400">
                          +{c.expertise_tags.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleVerified(c.user_id || c.id, c.is_verified)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      c.is_verified
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {c.is_verified ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    {c.is_verified ? "Verified" : "Unverified"}
                  </button>

                  <button
                    onClick={() => toggleActive(c.user_id || c.id, c.is_active)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      c.is_active
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
                    {c.is_active ? (
                      <ToggleRight className="w-3.5 h-3.5" />
                    ) : (
                      <ToggleLeft className="w-3.5 h-3.5" />
                    )}
                    {c.is_active ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-slate-500 mt-3">
        Showing {filteredConsultants.length} of {consultants.length} consultants
      </p>
    </div>
  );
}
