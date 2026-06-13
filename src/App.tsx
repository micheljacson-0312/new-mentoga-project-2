import { Suspense, lazy, useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";

const AuthPages = lazy(() => import("@/pages/auth/AuthPages"));
const UserDashboard = lazy(() => import("@/pages/dashboard/UserDashboard"));
const ConsultantDashboard = lazy(() => import("@/pages/dashboard/ConsultantDashboard"));
const AdminDashboard = lazy(() => import("@/pages/dashboard/AdminDashboard"));
const Marketplace = lazy(() => import("@/pages/marketplace/Marketplace"));
const CourseLMS = lazy(() => import("@/pages/courses/CourseLMS"));
const AvailabilityManager = lazy(() => import("@/pages/dashboard/AvailabilityManager"));
const EarningsDashboard = lazy(() => import("@/pages/dashboard/EarningsDashboard"));
const ManageUsers = lazy(() => import("@/pages/admin/ManageUsers"));
const ManageConsultants = lazy(() => import("@/pages/admin/ManageConsultants"));
const ViewPayments = lazy(() => import("@/pages/admin/ViewPayments"));
const PlatformSettings = lazy(() => import("@/pages/admin/PlatformSettings"));
const ViewReports = lazy(() => import("@/pages/admin/ViewReports"));
const ManageDisputes = lazy(() => import("@/pages/admin/ManageDisputes"));
const MessagesPage = lazy(() => import("@/pages/chat/MessagesPage"));
const UserUtilityPage = lazy(() => import("@/components/UserUtilityPage"));

function PageLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="mt-3 text-slate-500 text-sm font-medium">Loading page...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>(() => {
    return localStorage.getItem("mentoga_currentPage") || "marketplace";
  });
  const [profileSlug, setProfileSlug] = useState<string | null>(null);
  const [checkoutNotice, setCheckoutNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // Check for /c/slug routing
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    if (params.get("checkout") === "success") {
      setCheckoutNotice({ type: "success", text: "Stripe payment completed. Your booking has been recorded." });
      window.history.replaceState({}, "", path);
    }

    if (params.get("checkout") === "cancel") {
      setCheckoutNotice({ type: "error", text: "Stripe checkout was cancelled. You can try again anytime." });
      window.history.replaceState({}, "", path);
    }

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
    return (
      <Suspense fallback={<PageLoader />}>
        <AuthPages onBackToCreators={() => setCurrentPage("marketplace")} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {currentPage !== "consultant" && (
        <Navigation
          currentPage={currentPage}
          onNavigate={setCurrentPage}
        />
      )}
      <main className={`flex-1 ${currentPage === "consultant" ? "p-0" : "p-3 sm:p-4 md:p-12 pt-20 sm:pt-24 md:pt-12"} min-h-screen min-w-0`}>
        {checkoutNotice && (
          <div className={`mb-4 rounded-2xl px-4 py-3 text-sm font-bold ${checkoutNotice.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
            {checkoutNotice.text}
          </div>
        )}
        <Suspense fallback={<PageLoader />}>
          {currentPage === "marketplace" && (
            <Marketplace initialSlug={profileSlug} />
          )}
          {currentPage === "user" && <UserDashboard onNavigate={setCurrentPage as (page: string) => void} />}
          {currentPage === "consultant" && (
            <ConsultantDashboard onNavigate={setCurrentPage as (page: string) => void} />
          )}
          {currentPage === "courses" && <CourseLMS />}
          {currentPage === "availability" && <AvailabilityManager />}
          {currentPage === "earnings" && <EarningsDashboard />}
          {currentPage === "messages" && <MessagesPage />}
          {currentPage === "emeetings" && <UserUtilityPage page="emeetings" />}
          {currentPage === "megasessions" && <UserUtilityPage page="megasessions" />}
          {currentPage === "recordings" && <UserUtilityPage page="recordings" />}
          {currentPage === "wallet" && <UserUtilityPage page="wallet" />}
          {currentPage === "resolution_center" && <UserUtilityPage page="resolution_center" />}
          {currentPage === "memberships" && <UserUtilityPage page="memberships" />}
          {currentPage === "notifications" && <UserUtilityPage page="notifications" />}
          {currentPage === "edit_profile" && <UserDashboard onNavigate={setCurrentPage as (page: string) => void} />}
          {currentPage === "admin" && <AdminDashboard />}
          {currentPage === "admin_users" && <ManageUsers />}
          {currentPage === "admin_consultants" && <ManageConsultants />}
          {currentPage === "admin_payments" && <ViewPayments />}
          {currentPage === "admin_reports" && <ViewReports />}
          {currentPage === "admin_disputes" && <ManageDisputes />}
          {currentPage === "admin_settings" && <PlatformSettings />}
        </Suspense>
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
