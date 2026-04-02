import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Users,
  TrendingUp,
  BarChart3,
  UserCog,
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalConsultants: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const [usersRes, consultantsRes, bookingsRes, paymentsRes] =
        await Promise.all([
          supabase.from("user_profiles").select("id", { count: "exact", head: true }),
          supabase.from("user_profiles").select("id", { count: "exact", head: true }).eq("role", "consultant"),
          supabase.from("bookings").select("id", { count: "exact", head: true }),
          supabase.from("payments").select("amount"),
        ]);

      const totalRevenue = (paymentsRes.data || []).reduce(
        (sum, p) => sum + (Number(p.amount) || 0),
        0
      );

      setStats({
        totalUsers: usersRes.count || 0,
        totalConsultants: consultantsRes.count || 0,
        totalBookings: bookingsRes.count || 0,
        totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Platform Overview & Statistics</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Users</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalUsers}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Active Consultants</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalConsultants}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-green-600">
              <UserCog className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Bookings</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalBookings}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Revenue</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">${stats.totalRevenue.toFixed(0)}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
