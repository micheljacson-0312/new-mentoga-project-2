import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AuthPages from "@/pages/auth/AuthPages";
import UserDashboard from "@/pages/dashboard/UserDashboard";
import ConsultantDashboard from "@/pages/dashboard/ConsultantDashboard";
import AdminDashboard from "@/pages/dashboard/AdminDashboard";
import Marketplace from "@/pages/marketplace/Marketplace";
import CourseLMS from "@/pages/courses/CourseLMS";
import AvailabilityManager from "@/pages/dashboard/AvailabilityManager";
import EarningsDashboard from "@/pages/dashboard/EarningsDashboard";
import Navigation from "@/components/Navigation";
import ManageUsers from "@/pages/admin/ManageUsers";
import ManageConsultants from "@/pages/admin/ManageConsultants";
import ViewPayments from "@/pages/admin/ViewPayments";
import PlatformSettings from "@/pages/admin/PlatformSettings";
import ViewReports from "@/pages/admin/ViewReports";
import ManageDisputes from "@/pages/admin/ManageDisputes";
import MessagesPage from "@/pages/chat/MessagesPage";
import { 
  Headset, 
  Clapperboard, 
  Wallet, 
  RotateCcw, 
  Gem, 
  Users, 
  Bell 
} from "lucide-react";

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>(() => {
    return localStorage.getItem("mentoga_currentPage") || "marketplace";
  });
  const [profileSlug, setProfileSlug] = useState<string | null>(null);

  useEffect(() => {
    // Check for /c/slug routing
    const path = window.location.pathname;
    if (path.startsWith("/c/")) {
      const slug = path.split("/c/")[1];
      if (slug) {
        setProfileSlug(slug);
        setCurrentPage("marketplace");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("mentoga_currentPage", currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (currentPage !== "marketplace" && currentPage !== "login") {
        setCurrentPage("marketplace");
      }
    } else {
      // User is logged in
      if (currentPage === "login") {
         // Fallback to marketplace if profile isn't fully loaded/role is unknown
         setCurrentPage(profile?.role === "consultant" ? "consultant" : "marketplace");
      }
      
      if (profile) {
        const isAdminPage = currentPage === "admin" || currentPage.startsWith("admin_");
        const isConsultantPage = currentPage === "consultant" || currentPage === "courses" || currentPage === "availability" || currentPage === "earnings";
        
        if (isAdminPage && profile.role !== "admin") {
          setCurrentPage("marketplace");
        } else if (isConsultantPage && profile.role !== "consultant" && profile.role !== "admin") {
          setCurrentPage("marketplace");
        }
      }
    }
  }, [user, profile, loading, currentPage]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && currentPage === "login") {
    return <AuthPages onBackToCreators={() => setCurrentPage("marketplace")} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {currentPage !== "consultant" && (
        <Navigation
          currentPage={currentPage}
          onNavigate={setCurrentPage}
        />
      )}
      <main className={`flex-1 ${currentPage === "consultant" ? "p-0" : "p-4 md:p-12 pt-20 md:pt-12"} min-h-screen`}>
        {currentPage === "marketplace" && (
          <Marketplace initialSlug={profileSlug} />
        )}
        {currentPage === "user" && <UserDashboard />}
        {currentPage === "consultant" && (
          <ConsultantDashboard onNavigate={setCurrentPage as (page: string) => void} />
        )}
        {currentPage === "courses" && <CourseLMS />}
        {currentPage === "availability" && <AvailabilityManager />}
        {currentPage === "earnings" && <EarningsDashboard />}
        {currentPage === "messages" && <MessagesPage />}
        {currentPage === "emeetings" && (
           <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-sm">
             <Headset className="w-16 h-16 text-blue-100 mx-auto mb-6" />
             <h2 className="text-3xl font-black text-slate-900 mb-4">eMeetings</h2>
             <p className="text-slate-500 font-medium">Coming soon: Schedule and join expert video sessions.</p>
           </div>
        )}
        {currentPage === "megasessions" && (
           <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-sm">
             <Users className="w-16 h-16 text-blue-100 mx-auto mb-6" />
             <h2 className="text-3xl font-black text-slate-900 mb-4">MegaSessions</h2>
             <p className="text-slate-500 font-medium">Join mass-participation expert sessions.</p>
           </div>
        )}
        {currentPage === "recordings" && (
           <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-sm">
             <Clapperboard className="w-16 h-16 text-blue-100 mx-auto mb-6" />
             <h2 className="text-3xl font-black text-slate-900 mb-4">Recordings</h2>
             <p className="text-slate-500 font-medium">Access your purchased session recordings.</p>
           </div>
        )}
        {currentPage === "wallet" && (
           <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-sm">
             <Wallet className="w-16 h-16 text-blue-100 mx-auto mb-6" />
             <h2 className="text-3xl font-black text-slate-900 mb-4">Wallet</h2>
             <p className="text-slate-500 font-medium">Manage your balance and transactions.</p>
           </div>
        )}
        {currentPage === "resolution_center" && (
           <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-sm">
             <RotateCcw className="w-16 h-16 text-blue-100 mx-auto mb-6" />
             <h2 className="text-3xl font-black text-slate-900 mb-4">Resolution Center</h2>
             <p className="text-slate-500 font-medium">Need help? Raise a dispute or contact support.</p>
           </div>
        )}
        {currentPage === "memberships" && (
           <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-sm">
             <Gem className="w-16 h-16 text-blue-100 mx-auto mb-6" />
             <h2 className="text-3xl font-black text-slate-900 mb-4">Membership Packages</h2>
             <p className="text-slate-500 font-medium">View and manage your creator subscriptions.</p>
           </div>
        )}
        {currentPage === "notifications" && (
           <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-sm">
             <Bell className="w-16 h-16 text-blue-100 mx-auto mb-6" />
             <h2 className="text-3xl font-black text-slate-900 mb-4">Notifications</h2>
             <p className="text-slate-500 font-medium">Your recent alerts and updates.</p>
           </div>
        )}
        {currentPage === "edit_profile" && <UserDashboard />}
        {currentPage === "admin" && <AdminDashboard />}
        {currentPage === "admin_users" && <ManageUsers />}
        {currentPage === "admin_consultants" && <ManageConsultants />}
        {currentPage === "admin_payments" && <ViewPayments />}
        {currentPage === "admin_reports" && <ViewReports />}
        {currentPage === "admin_disputes" && <ManageDisputes />}
        {currentPage === "admin_settings" && <PlatformSettings />}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
