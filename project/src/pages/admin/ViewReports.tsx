import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  MessageSquare,
  Video,
  Calendar,
} from "lucide-react";

interface ReportData {
  totalRevenue: number;
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  chatBookings: number;
  videoBookings: number;
  voiceBookings: number;
  totalUsers: number;
  totalConsultants: number;
  topConsultants: {
    name: string;
    earnings: number;
    sessions: number;
    rating: number;
  }[];
}

export default function ViewReports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      const [
        bookingsRes,
        paymentsRes,
        usersRes,
        consultantsRes,
      ] = await Promise.all([
        supabase.from("bookings").select("*"),
        supabase
          .from("payments")
          .select("amount")
          .eq("status", "completed"),
        supabase.from("user_profiles").select("id", { count: "exact" }),
        supabase
          .from("consultants")
          .select("*, user_profiles!consultants_user_id_fkey(first_name, last_name)")
          .order("total_earnings", { ascending: false })
          .limit(5),
      ]);

      const bookings = bookingsRes.data || [];
      const totalRevenue = paymentsRes.data
        ? paymentsRes.data.reduce((sum, p) => sum + (p.amount || 0), 0)
        : 0;

      const topConsultants = (consultantsRes.data || []).map((c: any) => ({
        name: c.user_profiles
          ? `${c.user_profiles.first_name || ""} ${c.user_profiles.last_name || ""}`.trim() || "Unknown"
          : "Unknown",
        earnings: c.total_earnings || 0,
        sessions: c.total_sessions || 0,
        rating: c.average_rating || 0,
      }));

      setData({
        totalRevenue,
        totalBookings: bookings.length,
        completedBookings: bookings.filter((b) => b.status === "completed")
          .length,
        pendingBookings: bookings.filter((b) => b.status === "pending").length,
        cancelledBookings: bookings.filter((b) => b.status === "cancelled")
          .length,
        chatBookings: bookings.filter((b) => b.booking_type === "chat").length,
        videoBookings: bookings.filter((b) => b.booking_type === "video_call")
          .length,
        voiceBookings: bookings.filter((b) => b.booking_type === "voice_call")
          .length,
        totalUsers: usersRes.count || 0,
        totalConsultants: (consultantsRes.data || []).length,
        topConsultants,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-slate-500">
        Failed to load reports
      </div>
    );
  }

  const bookingTypeTotal =
    data.chatBookings + data.videoBookings + data.voiceBookings || 1;

  return (
    <div>
      {/* Revenue & Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
          <DollarSign className="w-6 h-6 mb-1 opacity-80" />
          <p className="text-2xl font-bold">${data.totalRevenue.toFixed(2)}</p>
          <p className="text-xs opacity-80">Total Revenue</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <Calendar className="w-6 h-6 mb-1 opacity-80" />
          <p className="text-2xl font-bold">{data.totalBookings}</p>
          <p className="text-xs opacity-80">Total Bookings</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <Users className="w-6 h-6 mb-1 opacity-80" />
          <p className="text-2xl font-bold">{data.totalUsers}</p>
          <p className="text-xs opacity-80">Total Users</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <TrendingUp className="w-6 h-6 mb-1 opacity-80" />
          <p className="text-2xl font-bold">{data.totalConsultants}</p>
          <p className="text-xs opacity-80">Consultants</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Status Breakdown */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">
              Bookings by Status
            </h3>
          </div>

          <div className="space-y-3">
            {[
              {
                label: "Completed",
                value: data.completedBookings,
                color: "bg-green-500",
                bgColor: "bg-green-100",
              },
              {
                label: "Pending",
                value: data.pendingBookings,
                color: "bg-yellow-500",
                bgColor: "bg-yellow-100",
              },
              {
                label: "Cancelled",
                value: data.cancelledBookings,
                color: "bg-red-500",
                bgColor: "bg-red-100",
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-medium text-slate-900">
                    {item.value}
                  </span>
                </div>
                <div className={`h-3 rounded-full ${item.bgColor}`}>
                  <div
                    className={`h-3 rounded-full ${item.color} transition-all`}
                    style={{
                      width: `${
                        data.totalBookings > 0
                          ? (item.value / data.totalBookings) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {data.totalBookings === 0 && (
            <p className="text-sm text-slate-500 text-center mt-4">
              No bookings data yet
            </p>
          )}
        </div>

        {/* Booking Type Breakdown */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-slate-900">
              Bookings by Type
            </h3>
          </div>

          <div className="space-y-4">
            {[
              {
                label: "Chat Sessions",
                value: data.chatBookings,
                icon: <MessageSquare className="w-4 h-4 text-blue-600" />,
                color: "bg-blue-500",
              },
              {
                label: "Video Calls",
                value: data.videoBookings,
                icon: <Video className="w-4 h-4 text-purple-600" />,
                color: "bg-purple-500",
              },
              {
                label: "Voice Calls",
                value: data.voiceBookings,
                icon: <MessageSquare className="w-4 h-4 text-green-600" />,
                color: "bg-green-500",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
              >
                {item.icon}
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700 font-medium">
                      {item.label}
                    </span>
                    <span className="text-slate-900 font-bold">
                      {item.value}{" "}
                      <span className="text-xs font-normal text-slate-500">
                        ({((item.value / bookingTypeTotal) * 100).toFixed(0)}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div
                      className={`h-2 rounded-full ${item.color} transition-all`}
                      style={{
                        width: `${(item.value / bookingTypeTotal) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Consultants */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-slate-900">
              Top Performing Consultants
            </h3>
          </div>

          {data.topConsultants.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              No consultant data available
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 text-xs font-semibold text-slate-600 uppercase">
                      #
                    </th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-600 uppercase">
                      Consultant
                    </th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-600 uppercase">
                      Earnings
                    </th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-600 uppercase">
                      Sessions
                    </th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-600 uppercase">
                      Rating
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.topConsultants.map((c, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-2.5">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            i === 0
                              ? "bg-yellow-100 text-yellow-700"
                              : i === 1
                              ? "bg-slate-200 text-slate-700"
                              : i === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-2.5 font-medium text-sm text-slate-900">
                        {c.name}
                      </td>
                      <td className="py-2.5 text-right text-sm font-bold text-green-700">
                        ${c.earnings.toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right text-sm text-slate-700">
                        {c.sessions}
                      </td>
                      <td className="py-2.5 text-right text-sm text-slate-700">
                        {c.rating.toFixed(1)} ⭐
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
