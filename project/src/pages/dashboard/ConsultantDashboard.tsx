import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Consultant } from "@/types";
import {
  Layout,
  ChevronRight,
  Loader2
} from "lucide-react";

// New Dashboard Components
import ConsultantSidebar from "@/components/dashboard/ConsultantSidebar";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import PricingManager from "@/components/dashboard/PricingManager";
import ReviewManager from "@/components/dashboard/ReviewManager";
import RecordingManager from "@/components/dashboard/RecordingManager";
import SupportCause from "@/components/dashboard/SupportCause";
import PeerProfit from "@/components/dashboard/PeerProfit";
import CoursesManager from "@/components/dashboard/CoursesManager";
import MembershipManager from "@/components/dashboard/MembershipManager";
import MegaSessionManager from "@/components/dashboard/MegaSessionManager";
import MessagesPage from "@/pages/chat/MessagesPage";
import ProfileEditor from "@/components/dashboard/ProfileEditor";
import ConsultantProfile from "@/pages/marketplace/ConsultantProfile";
import AvailabilityManager from "@/pages/dashboard/AvailabilityManager";
import EarningsDashboard from "@/pages/dashboard/EarningsDashboard";
import ConsultantUtilityPage from "@/components/dashboard/ConsultantUtilityPage";

interface ConsultantDashboardProps {
  onNavigate?: (page: string) => void;
}

export default function ConsultantDashboard({ onNavigate: globalNavigate }: ConsultantDashboardProps) {
  const { profile, becomeConsultant, signOut, loading: authLoading } = useAuth();
  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [isBecomingConsultant, setIsBecomingConsultant] = useState(false);
  const [setupNotice, setSetupNotice] = useState<string | null>(null);

  const handleNavigation = (page: string) => {
    // These pages are global redirections handled by App.tsx
    if (page === 'marketplace' || page === 'user' || page === 'switch_to_fan') {
      setActivePage('switch_to_fan');
      
      setTimeout(() => {
        const target = page === 'switch_to_fan' ? 'marketplace' : page;
        if (globalNavigate) {
          globalNavigate(target);
        } else {
          localStorage.setItem("mentoga_currentPage", target);
          window.location.reload();
        }
      }, 800);
      return;
    }
    // Otherwise it's a sub-page change within the consultant dashboard
    setActivePage(page);
  };

  useEffect(() => {
    if (authLoading) return;
    
    if (profile?.id) {
      fetchConsultantData();
    } else {
      setLoading(false);
    }
  }, [profile?.id, authLoading]);

  const fetchConsultantData = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      
      const { data: consultantData, error: consultantError } = await supabase
        .from("consultants")
        .select("*")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (consultantError) throw consultantError;

      if (consultantData) {
        setConsultant(consultantData);

        const { error: bookingsError } = await supabase
          .from("bookings")
          .select("id")
          .eq("consultant_id", profile.id)
          .order("scheduled_at", { ascending: false });

        if (bookingsError) throw bookingsError;
      }
    } catch (error) {
      console.error("Error fetching consultant data:", error);
    } finally {
      setLoading(false);
    }
  };

  const openLiveProfile = () => {
    localStorage.setItem("mentoga_currentPage", "marketplace");

    if (consultant?.slug) {
      window.location.assign(`/c/${consultant.slug}`);
      return;
    }

    if (globalNavigate) {
      globalNavigate("marketplace");
      return;
    }

    window.location.assign("/");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-slate-400 font-bold animate-pulse">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  if (!consultant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-blue-600/5 border border-slate-100 overflow-hidden text-center p-12">
          <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce transition-all">
            <Layout className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Become a Consultant</h1>
          <p className="text-slate-500 mb-10 font-medium leading-relaxed">
            Ready to share your expertise and start earning? Set up your consultant profile to join our creators community and connect with thousands of fans.
          </p>
          <button 
            onClick={async () => {
              try {
                setIsBecomingConsultant(true);
                setSetupNotice(null);
                await becomeConsultant();
                await fetchConsultantData();
              } catch (err) {
                console.error("Failed to become consultant:", err);
                setSetupNotice("Could not set up consultant profile. Make sure you are logged in.");
              } finally {
                setIsBecomingConsultant(false);
              }
            }}
            disabled={isBecomingConsultant}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-5 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95"
          >
            {isBecomingConsultant ? "Working Magic..." : "Get Started Now"}
            <ChevronRight className="w-5 h-5" />
          </button>
          {setupNotice && <p className="mt-4 text-sm font-bold text-red-600">{setupNotice}</p>}
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardOverview consultant={consultant} profile={profile as any} />;
      case 'schedule':
        return <AvailabilityManager />;
      case 'pricing':
        return <PricingManager />;
      case 'emeetings':
        return <ConsultantUtilityPage page="emeetings" />;
      case 'reviews':
        return <ReviewManager />;
      case 'recordings':
        return <RecordingManager />;
      case 'support_cause':
        return <SupportCause />;
      case 'peer_profit':
        return <PeerProfit />;
      case 'courses':
        return <CoursesManager />;
      case 'membership':
        return <MembershipManager />;
      case 'packages':
        return <MembershipManager />;
      case 'megasession':
        return <MegaSessionManager />;
      case 'megasession_meetings':
        return <ConsultantUtilityPage page="megasession_meetings" />;
      case 'resolution_center':
        return <ConsultantUtilityPage page="resolution_center" />;
      case 'intro_video':
        return <ConsultantUtilityPage page="intro_video" />;
      case 'connected_accounts':
        return <ConsultantUtilityPage page="connected_accounts" />;
      case 'notifications':
        return <ConsultantUtilityPage page="notifications" />;
      case 'earnings':
        return <EarningsDashboard />;
      case 'chats':
        return (
          <div className="max-w-6xl mx-auto py-4">
             <MessagesPage />
          </div>
        );
      case 'switch_to_fan':
        return (
          <div className="flex items-center justify-center h-full p-8 text-center">
             <div className="max-w-md">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                   <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-4">Switching to Fan Account</h2>
                <p className="text-slate-500 font-medium">Redirecting you to creators...</p>
             </div>
          </div>
        );
      case 'edit_profile':
        return <ProfileEditor />;
      case 'preview':
        return (
          <div className="max-w-6xl mx-auto space-y-8 py-8 h-full overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-white rounded-[2rem] border border-blue-100 p-6 flex items-center justify-between shadow-xl shadow-blue-600/5">
              <div>
                <p className="text-slate-900 font-black text-lg">Live Preview Mode</p>
                <p className="text-sm text-slate-400 font-medium">This is how your profile looks to fans on the platform.</p>
              </div>
              <button 
                onClick={() => setActivePage("dashboard")}
                className="px-8 py-3 bg-white text-blue-600 font-black rounded-xl border-2 border-slate-100 hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm"
              >
                Exit Preview
              </button>
            </div>
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden transform scale-[0.98]">
               {consultant && (
                 <ConsultantProfile 
                   consultantId={profile?.id || ""}
                   onBack={() => setActivePage("dashboard")}
                   onBookSession={openLiveProfile}
                   onStartChat={openLiveProfile}
                  />
                )}
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                <Loader2 className="w-10 h-10 text-slate-300 animate-spin" />
             </div>
             <h2 className="text-2xl font-black text-slate-900 mb-2 capitalize">{activePage.replace('_', ' ')}</h2>
             <p className="text-slate-400 font-medium">We're building this feature right now. Check back soon!</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:flex-row bg-[#fafbfc] overflow-visible md:overflow-hidden">
      <ConsultantSidebar 
        activePage={activePage}
        onNavigate={handleNavigation}
        profile={profile as any}
        onLogout={signOut}
      />
      
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-8 relative min-w-0">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

    </div>
  );
}
