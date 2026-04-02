import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Booking } from "@/types";
import {
  Calendar,
  MessageSquare,
  Video,
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  User,
  X,
  Save,
  Camera,
  Award
} from "lucide-react";

export default function UserDashboard() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    profile_image_url: ""
  });
  const { updateProfile } = useAuth();

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        profile_image_url: profile.profile_image_url || ""
      });
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.id) {
      fetchBookings();
    }
  }, [profile?.id]);

  const fetchBookings = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", profile.id)
        .order("scheduled_at", { ascending: false });

      if (error) throw error;

      const bookingsData = (data || []) as Booking[];
      setBookings(bookingsData);

      const now = new Date();
      const upcoming = bookingsData.filter(
        (b) => new Date(b.scheduled_at) > now
      ).length;
      const completed = bookingsData.filter(
        (b) => b.status === "completed"
      ).length;
      const totalSpent = bookingsData.reduce((sum, b) => sum + b.amount, 0);

      setStats({
        totalBookings: bookingsData.length,
        upcomingBookings: upcoming,
        completedBookings: completed,
        totalSpent,
      });
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateProfile(formData);
      setShowSettings(false);
      alert("Profile updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const getBookingIcon = (type: string) => {
    switch (type) {
      case "chat":
        return <MessageSquare className="w-4 h-4" />;
      case "video_call":
        return <Video className="w-4 h-4" />;
      case "voice_call":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Hero Header Section */}
      <div className="bg-[#0c2438] text-white pt-16 pb-32 relative overflow-hidden">
        {/* Abstract Blue background glows */}
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-5%] w-80 h-80 bg-blue-600/10 rounded-full blur-[80px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-[2rem] bg-blue-600 p-1 shadow-2xl shadow-blue-600/20">
                <div className="w-full h-full rounded-[1.8rem] overflow-hidden bg-white">
                  {profile?.profile_image_url ? (
                    <img src={profile.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50 text-[#0c2438]">
                      <User className="w-10 h-10" />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-blue-400 font-black text-xs uppercase tracking-[0.2em] mb-2">Member Dashboard</p>
                <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">
                  Hi, {profile?.first_name || "User"}!
                </h1>
                <div className="flex items-center gap-4 text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    {stats.upcomingBookings} Upcoming
                  </span>
                  <span className="w-1 h-1 bg-slate-700 rounded-full" />
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    {stats.completedBookings} Completed
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowSettings(true)}
              className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 hover:scale-105 transition-all shadow-xl shadow-blue-600/20 flex items-center gap-3"
            >
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 pb-20">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Total Bookings", value: stats.totalBookings, icon: Calendar, color: "bg-blue-500" },
            { label: "Upcoming", value: stats.upcomingBookings, icon: Clock, color: "bg-orange-500" },
            { label: "Completed", value: stats.completedBookings, icon: CheckCircle, color: "bg-blue-600" },
            { label: "Total Spent", value: `$${stats.totalSpent.toFixed(2)}`, icon: BookOpen, color: "bg-purple-500" }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:translate-y-[-4px] transition-all duration-300">
              <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-slate-200/50`}>
                <stat.icon className="w-7 h-7 text-white" />
              </div>
              <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-2">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Recent Bookings List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Recent Activity</h2>
              <button className="text-sm font-black text-blue-600 hover:underline">View All</button>
            </div>

            {loading ? (
              <div className="bg-white p-20 rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-slate-400 font-bold">Syncing your activity...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white p-20 rounded-[2.5rem] border border-slate-100 shadow-xl text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">No bookings yet</h3>
                <p className="text-slate-500 font-medium mb-8">Start your transformation by booking a session with a mentor.</p>
                <a href="/marketplace" className="px-10 py-4 bg-[#0c2438] text-white font-black rounded-2xl hover:bg-[#1a3a5a] transition-all">
                  Explore Mentors
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:shadow-blue-600/10 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        {getBookingIcon(booking.booking_type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 capitalize mb-1">
                          {booking.booking_type.replace("_", " ")} Session
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {new Date(booking.scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {new Date(booking.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-8">
                       <div className="text-right">
                          <p className="text-xl font-black text-slate-900 mb-1">${booking.amount.toFixed(2)}</p>
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                       </div>
                       <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all group-hover:scale-110">
                          <Settings className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar / Quick Actions */}
          <div className="space-y-6">
            <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl shadow-blue-600/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Award className="w-32 h-32" />
               </div>
               <h3 className="text-2xl font-black text-[#0c2438] mb-4 relative z-10">Premium Member</h3>
               <p className="text-white/80 font-black leading-relaxed mb-6 relative z-10">Unlock exclusive masterclasses and direct line to top mentors.</p>
               <button className="w-full py-4 bg-[#0c2438] text-white font-black rounded-2xl hover:scale-105 transition-all relative z-10">
                  Upgrade Plan
               </button>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20">
               <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                 <Video className="w-6 h-6 text-blue-600" />
                 Upcoming Calls
               </h3>
               {stats.upcomingBookings > 0 ? (
                 <div className="space-y-4">
                    {/* Placeholder for upcoming items - keeping it simple for now */}
                    <p className="text-slate-500 font-medium italic">You have {stats.upcomingBookings} sessions scheduled.</p>
                 </div>
               ) : (
                 <p className="text-slate-400 font-medium">No calls scheduled for today.</p>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0c2438]/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <User className="w-6 h-6 text-blue-600" />
                  Settings
                </h3>
                <p className="text-slate-500 font-medium text-sm">Update your personal identity</p>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-slate-900 p-2 rounded-2xl hover:bg-white transition-all shadow-sm"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-10 space-y-8">
              <div className="flex justify-center">
                <div className="relative group cursor-pointer">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-blue-600/10 p-1.5 border-2 border-dashed border-blue-600 transition-all group-hover:scale-105 shadow-xl shadow-blue-600/5">
                    <div className="w-full h-full rounded-[2.2rem] overflow-hidden bg-white flex items-center justify-center">
                      {formData.profile_image_url ? (
                        <img src={formData.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-blue-600" />
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-white p-2.5 rounded-2xl shadow-lg border border-slate-100 group-hover:scale-110 transition-transform">
                    <Camera className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#00ff99] focus:bg-white outline-none transition-all text-sm font-bold text-slate-900"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#00ff99] focus:bg-white outline-none transition-all text-sm font-bold text-slate-900"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-500 font-black rounded-2xl hover:bg-slate-100 transition-all uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex justify-center items-center gap-3"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Identity
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
