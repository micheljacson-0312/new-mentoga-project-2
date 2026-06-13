import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell,
  CalendarCheck2,
  Camera,
  LifeBuoy,
  Link2,
  Video,
} from "lucide-react";

type ConsultantUtilityPageType =
  | "emeetings"
  | "megasession_meetings"
  | "resolution_center"
  | "intro_video"
  | "connected_accounts"
  | "notifications";

interface ConsultantUtilityPageProps {
  page: ConsultantUtilityPageType;
}

interface UtilityBooking {
  id: string;
  scheduled_at: string;
  booking_type?: string;
  service_type?: string;
  status: string;
  notes?: string | null;
  amount: number;
}

interface UtilityMegaSession {
  id: string;
  title: string;
  scheduled_at: string;
  status: string;
  price: number;
}

interface UtilityReview {
  id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
}

export default function ConsultantUtilityPage({ page }: ConsultantUtilityPageProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<UtilityBooking[]>([]);
  const [megaSessions, setMegaSessions] = useState<UtilityMegaSession[]>([]);
  const [reviews, setReviews] = useState<UtilityReview[]>([]);

  useEffect(() => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const [bookingsRes, megaRes, reviewsRes] = await Promise.all([
          supabase.from("bookings").select("*").eq("consultant_id", profile.id).order("scheduled_at", { ascending: false }).limit(20),
          supabase.from("megasessions").select("id,title,scheduled_at,status,price").eq("consultant_id", profile.id).order("scheduled_at", { ascending: false }).limit(20),
          supabase.from("reviews").select("id,rating,comment,created_at").eq("consultant_id", profile.id).order("created_at", { ascending: false }).limit(20),
        ]);

        if (bookingsRes.error) throw bookingsRes.error;
        if (megaRes.error) throw megaRes.error;
        if (reviewsRes.error) throw reviewsRes.error;

        setBookings((bookingsRes.data || []) as UtilityBooking[]);
        setMegaSessions((megaRes.data || []) as UtilityMegaSession[]);
        setReviews((reviewsRes.data || []) as UtilityReview[]);
      } catch (error) {
        console.error(`Error loading consultant ${page}:`, error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page, profile?.id]);

  if (!profile) return null;

  const config = {
    emeetings: {
      title: "eMeetings",
      description: "Review your scheduled client video and voice sessions.",
      icon: Video,
    },
    megasession_meetings: {
      title: "MegaSession Meetings",
      description: "Track the MegaSessions you have already scheduled.",
      icon: CalendarCheck2,
    },
    resolution_center: {
      title: "Resolution Center",
      description: "Sessions that may need a follow-up or manual review.",
      icon: LifeBuoy,
    },
    intro_video: {
      title: "Intro Video",
      description: "Your public creator intro status and profile readiness.",
      icon: Camera,
    },
    connected_accounts: {
      title: "Connected Accounts",
      description: "Your currently connected identity and profile channels.",
      icon: Link2,
    },
    notifications: {
      title: "Notifications",
      description: "Recent booking, review, and session updates.",
      icon: Bell,
    },
  }[page];

  const Icon = config.icon;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderCards = (items: Array<{ id: string; title: string; detail: string; meta: string }>, empty: string) => {
    if (items.length === 0) {
      return <div className="bg-white rounded-[2rem] border border-slate-100 p-8 text-center text-slate-500 shadow-sm">{empty}</div>;
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

  if (page === "emeetings") {
    const sessions = bookings.filter((booking) => (booking.booking_type || booking.service_type) !== "chat");
    content = renderCards(
      sessions.map((booking) => ({
        id: booking.id,
        title: (booking.booking_type || booking.service_type || "session").replace("_", " "),
        detail: booking.notes || `Status: ${booking.status} • $${Number(booking.amount).toFixed(2)}`,
        meta: new Date(booking.scheduled_at).toLocaleString(),
      })),
      "No eMeetings scheduled yet."
    );
  } else if (page === "megasession_meetings") {
    content = renderCards(
      megaSessions.map((session) => ({
        id: session.id,
        title: session.title,
        detail: `${session.status} • $${Number(session.price).toFixed(2)}`,
        meta: new Date(session.scheduled_at).toLocaleString(),
      })),
      "No MegaSession meetings created yet."
    );
  } else if (page === "resolution_center") {
    const flagged = bookings.filter((booking) => ["pending", "cancelled", "no_show"].includes(booking.status));
    content = renderCards(
      flagged.map((booking) => ({
        id: booking.id,
        title: `${(booking.booking_type || booking.service_type || "session").replace("_", " ")} ${booking.status}`,
        detail: booking.notes || "Check this booking for reschedule, refund, or support follow-up.",
        meta: new Date(booking.scheduled_at).toLocaleDateString(),
      })),
      "No bookings currently need review."
    );
  } else if (page === "intro_video") {
    content = (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Profile Photo</p>
          <p className="text-slate-900 font-black">{profile.profile_image_url ? "Connected" : "Missing"}</p>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Bio Status</p>
          <p className="text-slate-900 font-black">{profile.bio ? "Ready for public profile" : "Needs update"}</p>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm md:col-span-2">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Current Intro Setup</p>
          <p className="text-slate-500">Your public intro currently uses profile image, bio, and banner visuals. Add or improve these from Edit Profile to strengthen conversion.</p>
        </div>
      </div>
    );
  } else if (page === "connected_accounts") {
    content = (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Primary Email</p>
          <p className="text-slate-900 font-black break-all">{profile.email}</p>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Account Role</p>
          <p className="text-slate-900 font-black capitalize">{profile.role}</p>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Location</p>
          <p className="text-slate-900 font-black">{profile.location || "Not set"}</p>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Profile Status</p>
          <p className="text-slate-900 font-black">{profile.first_name ? "Active" : "Incomplete"}</p>
        </div>
      </div>
    );
  } else {
    const notifications = [
      ...bookings.slice(0, 6).map((booking) => ({
        id: `booking-${booking.id}`,
        title: `${(booking.booking_type || booking.service_type || "session").replace("_", " ")} ${booking.status}`,
        detail: booking.notes || "Booking activity updated.",
        meta: new Date(booking.scheduled_at).toLocaleDateString(),
      })),
      ...reviews.slice(0, 6).map((review) => ({
        id: `review-${review.id}`,
        title: `New ${review.rating}-star review`,
        detail: review.comment || "A client left feedback on your profile.",
        meta: new Date(review.created_at).toLocaleDateString(),
      })),
      ...megaSessions.slice(0, 4).map((session) => ({
        id: `mega-${session.id}`,
        title: `MegaSession ${session.status}`,
        detail: session.title,
        meta: new Date(session.scheduled_at).toLocaleDateString(),
      })),
    ].sort((a, b) => new Date(b.meta).getTime() - new Date(a.meta).getTime());

    content = renderCards(notifications, "No new notifications right now.");
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
