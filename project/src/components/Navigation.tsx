import { useContext, useState } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { 
  LogOut, 
  User, 
  Briefcase, 
  Lock, 
  X, 
  CheckCircle, 
  AlertCircle,
  Users,
  UserCog,
  DollarSign,
  BarChart3,
  Settings,
  MessageSquare,
  LayoutDashboard,
  Menu,
  Headset,
  Clapperboard,
  Wallet,
  RotateCcw,
  Gem,
  Repeat,
  Bell
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navigation({
  currentPage,
  onNavigate,
}: NavigationProps) {
  const context = useContext(AuthContext);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState(false);

  const { profile, signOut } = context!;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess(false);

    if (newPassword !== confirmPassword) {
      setPassError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPassError("Password must be at least 6 characters");
      return;
    }

    try {
      setPassLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      setPassSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setShowPasswordModal(false), 2000);
    } catch (error: any) {
      setPassError(error.message || "Failed to update password");
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-slate-100 md:hidden h-16">
        <div className="flex justify-between items-center h-full px-4">
          <button
            onClick={() => onNavigate("marketplace")}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black italic text-xs">M</div>
            <span className="text-xl font-black text-slate-900 tracking-tight">Mentoga</span>
          </button>
          
          <div className="flex items-center gap-3">
             {profile && (
                <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xs font-black text-blue-600 italic">
                   {profile.first_name?.[0]}
                </div>
             )}
             <button 
               className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-xl"
               onClick={() => {}} // Mobile menu toggle logic could go here
             >
               <Menu className="w-6 h-6" />
             </button>
          </div>
        </div>
      </nav>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                Change Password
              </h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
              {passError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {passError}
                </div>
              )}
              {passSuccess && (
                <div className="p-3 bg-green-50 border border-green-100 text-green-600 rounded-xl flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Password updated successfully!
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                  placeholder="Repeat new password"
                />
              </div>

              <button
                type="submit"
                disabled={passLoading || passSuccess}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex justify-center items-center gap-2 mt-2"
              >
                {passLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-100 p-0 z-40 hidden md:flex flex-col overflow-hidden">
        {/* Brand Logo */}
        <div className="p-8">
          <button
            onClick={() => onNavigate("marketplace")}
            className="flex items-center gap-3"
          >
             <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black italic text-base shadow-lg shadow-blue-200">M</div>
             <span className="text-2xl font-black text-slate-900 tracking-tight">Mentoga</span>
          </button>
        </div>

        {/* Scrollable Nav Area */}
        <div className="flex-1 overflow-y-auto px-4 space-y-8 pb-32 custom-scrollbar">
          {/* Main Section */}
          <div className="space-y-1">
             <p className="px-4 mb-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">Main Menu</p>
             <button
              onClick={() => onNavigate("marketplace")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                currentPage === "marketplace"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Briefcase className={`w-5 h-5 ${currentPage === "marketplace" ? "text-blue-600" : "text-slate-400"}`} />
              Creators
            </button>

            <button
              onClick={() => onNavigate("messages")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                currentPage === "messages"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <MessageSquare className={`w-5 h-5 ${currentPage === "messages" ? "text-blue-600" : "text-slate-400"}`} />
              Messages
            </button>
          </div>

          {profile && (
            <div className="space-y-1">
              <p className="px-4 mb-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                {profile.role === 'admin' ? 'Administration' : 'Management'}
              </p>

              {profile.role === "user" && (
                <>
                  <button
                    onClick={() => onNavigate("messages")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                      currentPage === "messages"
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <MessageSquare className={`w-5 h-5 ${currentPage === "messages" ? "text-blue-600" : "text-slate-400"}`} />
                    Chats
                  </button>

                  <button
                    onClick={() => onNavigate("emeetings")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                      currentPage === "emeetings"
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Headset className={`w-5 h-5 ${currentPage === "emeetings" ? "text-blue-600" : "text-slate-400"}`} />
                    eMeetings
                  </button>

                  <button
                    onClick={() => onNavigate("megasessions")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                      currentPage === "megasessions"
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Users className={`w-5 h-5 ${currentPage === "megasessions" ? "text-blue-600" : "text-slate-400"}`} />
                    MegaSessions
                  </button>

                  <button
                    onClick={() => onNavigate("recordings")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                      currentPage === "recordings"
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Clapperboard className={`w-5 h-5 ${currentPage === "recordings" ? "text-blue-600" : "text-slate-400"}`} />
                    Recording
                  </button>

                  <button
                    onClick={() => onNavigate("wallet")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                      currentPage === "wallet"
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Wallet className={`w-5 h-5 ${currentPage === "wallet" ? "text-blue-600" : "text-slate-400"}`} />
                    Wallet
                  </button>

                  <button
                    onClick={() => onNavigate("resolution_center")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                      currentPage === "resolution_center"
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <RotateCcw className={`w-5 h-5 ${currentPage === "resolution_center" ? "text-blue-600" : "text-slate-400"}`} />
                    Resolution Center
                  </button>

                  <button
                    onClick={() => onNavigate("memberships")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                      currentPage === "memberships"
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Gem className={`w-5 h-5 ${currentPage === "memberships" ? "text-blue-600" : "text-slate-400"}`} />
                    Membership Packages
                  </button>
                  
                  <div className="h-px bg-slate-50 mx-4 my-4" />

                  <button
                    onClick={() => onNavigate("consultant")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm text-slate-500 hover:bg-blue-50 hover:text-blue-600 group"
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      <Repeat className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                    </div>
                    Switch to Creator
                  </button>

                  <button
                    onClick={() => onNavigate("notifications")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                      currentPage === "notifications"
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Bell className={`w-5 h-5 ${currentPage === "notifications" ? "text-blue-600" : "text-slate-400"}`} />
                    Notifications
                  </button>

                  <button
                    onClick={() => onNavigate("edit_profile")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                      currentPage === "edit_profile"
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <User className={`w-5 h-5 ${currentPage === "edit_profile" ? "text-blue-600" : "text-slate-400"}`} />
                    Edit Profile
                  </button>
                </>
              )}

              {profile.role === "consultant" && (
                <button
                  onClick={() => onNavigate("consultant")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                    currentPage === "consultant"
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <LayoutDashboard className={`w-5 h-5 ${currentPage === "consultant" ? "text-blue-600" : "text-slate-400"}`} />
                  Expert Dashboard
                </button>
              )}

              {profile.role === "admin" && (
                <>
                  <button
                    onClick={() => onNavigate("admin")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                      currentPage === "admin"
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <BarChart3 className={`w-5 h-5 ${currentPage === "admin" ? "text-blue-600" : "text-slate-400"}`} />
                    Overview
                  </button>
                  <button
                    onClick={() => onNavigate("admin_users")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                      currentPage === "admin_users"
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Users className={`w-5 h-5 ${currentPage === "admin_users" ? "text-blue-600" : "text-slate-400"}`} />
                    Users
                  </button>
                  <button
                    onClick={() => onNavigate("admin_consultants")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                      currentPage === "admin_consultants"
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <UserCog className={`w-5 h-5 ${currentPage === "admin_consultants" ? "text-blue-600" : "text-slate-400"}`} />
                    Consultants
                  </button>
                  <button
                    onClick={() => onNavigate("admin_payments")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                      currentPage === "admin_payments"
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <DollarSign className={`w-5 h-5 ${currentPage === "admin_payments" ? "text-blue-600" : "text-slate-400"}`} />
                    Payments
                  </button>
                  <button
                    onClick={() => onNavigate("admin_settings")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                      currentPage === "admin_settings"
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Settings className={`w-5 h-5 ${currentPage === "admin_settings" ? "text-blue-600" : "text-slate-400"}`} />
                    Settings
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Profile Footer */}
        <div className="p-4 border-t border-slate-50 bg-white relative">
          {profile ? (
            <button 
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-2xl transition-all group border border-transparent hover:border-red-100"
            >
              <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center">
                {profile.profile_image_url ? (
                  <img src={profile.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-600 font-black italic">{profile.first_name?.[0]}</span>
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-black text-slate-900 leading-none mb-1 truncate">{profile.first_name} {profile.last_name}</p>
                <div className="flex items-center gap-1.5 mb-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{profile.role === 'user' ? 'Fan' : profile.role}</p>
                </div>
                {profile.role === 'user' && (
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-2/3 h-full bg-blue-600 rounded-full" />
                  </div>
                )}
              </div>
              <LogOut className="w-4 h-4 text-slate-300 group-hover:text-red-600 transition-colors" />
            </button>
          ) : (
            <button
               onClick={() => onNavigate("login")}
               className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-600/10 active:scale-95 text-sm"
            >
               Sign In
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Spacer for Sidebar */}
      <div className="hidden md:block w-72 h-screen shrink-0"></div>
    </>
  );
}
