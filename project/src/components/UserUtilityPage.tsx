import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell,
  CalendarDays,
  Clock3,
  Gem,
  Headset,
  MessageSquare,
  RotateCcw,
  Users,
  Wallet,
  Clapperboard,
} from "lucide-react";

type UtilityPage =
  | "emeetings"
  | "megasessions"
  | "recordings"
  | "wallet"
  | "resolution_center"
  | "memberships"
  | "notifications";

interface UserUtilityPageProps {
  page: UtilityPage;
}

interface UtilityBooking {
  id: string;
  scheduled_at: string;
  booking_type?: string;
  service_type?: string;
  status: string;
  amount: number;
  notes?: string | null;
}

interface UtilityPayment {
  id: string;
  amount: number;
  status: string;
  currency?: string | null;
  description?: string | null;
  created_at: string;
}

interface UtilitySubscription {
  id: string;
  plan_name: string;
  price: number;
  billing_cycle?: string | null;
  status: string;
  created_at: string;
}

interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
}

export default function UserUtilityPage({ page }: UserUtilityPageProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<UtilityBooking[]>([]);
  const [payments, setPayments] = useState<UtilityPayment[]>([]);
  const [subscriptions, setSubscriptions] = useState<UtilitySubscription[]>([]);

  useEffect(() => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);

        const [bookingsRes, paymentsRes, subscriptionsRes] = await Promise.all([
          supabase.from("bookings").select("*").eq("user_id", profile.id).order("scheduled_at", { ascending: false }).limit(20),
          supabase.from("payments").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(20),
          supabase.from("subscriptions").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(20),
        ]);

        if (bookingsRes.error) throw bookingsRes.error;
        if (paymentsRes.error) throw paymentsRes.error;
        if (subscriptionsRes.error) throw subscriptionsRes.error;

        setBookings((bookingsRes.data || []) as UtilityBooking[]);
        setPayments((paymentsRes.data || []) as UtilityPayment[]);
        setSubscriptions((subscriptionsRes.data || []) as UtilitySubscription[]);
      } catch (error) {
        console.error(`Error loading ${page}:`, error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page, profile?.id]);

  const upcomingMeetings = bookings.filter((booking) => {
    const type = booking.booking_type || booking.service_type;
    return type !== "chat" && new Date(booking.scheduled_at) >= new Date();
  });

  const pastSessions = bookings.filter((booking) => {
    const type = booking.booking_type || booking.service_type;
    return type !== "chat" && new Date(booking.scheduled_at) < new Date();
  });

  const walletTotal = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const pendingTotal = payments
    .filter((payment) => payment.status === "pending")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const notifications: NotificationItem[] = [
    ...bookings.slice(0, 6).map((booking) => ({
      id: `booking-${booking.id}`,
      title: `${(booking.booking_type || booking.service_type || "session").replace("_", " ")} ${booking.status}`,
      detail: `Scheduled for ${new Date(booking.scheduled_at).toLocaleString()}`,
      createdAt: booking.scheduled_at,
    })),
    ...payments.slice(0, 6).map((payment) => ({
      id: `payment-${payment.id}`,
      title: `Payment ${payment.status}`,
      detail: `${payment.currency || "USD"} ${Number(payment.amount).toFixed(2)}${payment.description ? ` • ${payment.description}` : ""}`,
      createdAt: payment.created_at,
    })),
    ...subscriptions.slice(0, 4).map((subscription) => ({
      id: `subscription-${subscription.id}`,
      title: `${subscription.plan_name} subscription`,
      detail: `${subscription.status} • ${subscription.billing_cycle || "monthly"}`,
      createdAt: subscription.created_at,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pageConfig: Record<UtilityPage, { title: string; description: string; icon: typeof Wallet }> = {
    emeetings: {
      title: "eMeetings",
      description: "Your upcoming video and voice sessions.",
      icon: Headset,
    },
    megasessions: {
      title: "MegaSessions",
      description: "Track your group session bookings and activity.",
      icon: Users,
    },
    recordings: {
      title: "Recordings",
      description: "Review your completed live sessions and history.",
      icon: Clapperboard,
    },
    wallet: {
      title: "Wallet",
      description: "See your payment history and pending balances.",
      icon: Wallet,
    },
    resolution_center: {
      title: "Resolution Center",
      description: "Review sessions that may need support or follow-up.",
      icon: RotateCcw,
    },
    memberships: {
      title: "Membership Packages",
      description: "Manage your creator subscriptions in one place.",
      icon: Gem,
    },
    notifications: {
      title: "Notifications",
      description: "Recent account, session, and payment updates.",
      icon: Bell,
    },
  };

  const config = pageConfig[page];
  const Icon = config.icon;

  if (!profile) {
    return (
      <div className="bg-white rounded-[2rem] p-8 sm:p-10 text-center border border-slate-100 shadow-sm max-w-2xl mx-auto">
        <Icon className="w-12 h-12 text-blue-200 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-slate-900 mb-2">Sign in required</h2>
        <p className="text-slate-500">Please sign in to access {config.title.toLowerCase()}.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderList = (items: Array<{ id: string; title: string; detail: string; meta: string }>, emptyText: string) => {
    if (items.length === 0) {
      return (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 text-center text-slate-500 shadow-sm">
          {emptyText}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-[2rem] border border-slate-100 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-slate-900 font-black capitalize">{item.title}</p>
              <p className="text-slate-500 text-sm mt-1">{item.detail}</p>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{item.meta}</p>
          </div>
        ))}
      </div>
    );
  };

  let content: JSX.Element;

  if (page === "wallet") {
    content = (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Payments</p>
            <p className="text-3xl font-black text-slate-900">${walletTotal.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Pending</p>
            <p className="text-3xl font-black text-slate-900">${pendingTotal.toFixed(2)}</p>
          </div>
        </div>
        {renderList(
          payments.map((payment) => ({
            id: payment.id,
            title: payment.status,
            detail: `${payment.description || "Session payment"} • ${payment.currency || "USD"} ${Number(payment.amount).toFixed(2)}`,
            meta: new Date(payment.created_at).toLocaleDateString(),
          })),
          "No payment activity yet."
        )}
      </div>
    );
  } else if (page === "notifications") {
    content = renderList(
      notifications.slice(0, 12).map((item) => ({
        id: item.id,
        title: item.title,
        detail: item.detail,
        meta: new Date(item.createdAt).toLocaleDateString(),
      })),
      "No notifications yet."
    );
  } else if (page === "memberships") {
    content = renderList(
      subscriptions.map((subscription) => ({
        id: subscription.id,
        title: subscription.plan_name,
        detail: `${subscription.status} • ${subscription.billing_cycle || "monthly"} • $${Number(subscription.price).toFixed(2)}`,
        meta: new Date(subscription.created_at).toLocaleDateString(),
      })),
      "You do not have any active creator memberships yet."
    );
  } else if (page === "resolution_center") {
    const disputedBookings = bookings.filter((booking) => ["cancelled", "pending", "no_show"].includes(booking.status));
    content = renderList(
      disputedBookings.map((booking) => ({
        id: booking.id,
        title: `${(booking.booking_type || booking.service_type || "session").replace("_", " ")} ${booking.status}`,
        detail: booking.notes || "Review this session if you need support or a follow-up.",
        meta: new Date(booking.scheduled_at).toLocaleDateString(),
      })),
      "No sessions currently need attention."
    );
  } else if (page === "recordings") {
    content = renderList(
      pastSessions.map((booking) => ({
        id: booking.id,
        title: (booking.booking_type || booking.service_type || "session").replace("_", " "),
        detail: booking.notes || "Completed live session available in your history.",
        meta: new Date(booking.scheduled_at).toLocaleDateString(),
      })),
      "No completed live sessions yet."
    );
  } else {
    const list = page === "megasessions" ? bookings : upcomingMeetings;
    content = renderList(
      list.map((booking) => ({
        id: booking.id,
        title: (booking.booking_type || booking.service_type || "session").replace("_", " "),
        detail: booking.notes || `Status: ${booking.status}`,
        meta: new Date(booking.scheduled_at).toLocaleString(),
      })),
      page === "megasessions" ? "No group sessions found yet." : "No upcoming meetings scheduled yet."
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-[2rem] border border-slate-100 p-6 sm:p-8 shadow-sm flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{config.title}</h2>
          <p className="text-slate-500 mt-2">{config.description}</p>
        </div>
      </div>
      {content}
    </div>
  );
}
