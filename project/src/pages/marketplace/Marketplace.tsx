import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Consultant, UserProfile } from "@/types";
import { Search, Filter, Star, Award, Users, X, MessageSquare, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ConsultantProfile from "./ConsultantProfile";
import BookingPage from "../booking/BookingPage";
import ChatPage from "../chat/ChatPage";

interface ConsultantWithProfile extends Consultant {
  user?: UserProfile;
}

interface MarketplaceProps {
  initialSlug?: string | null;
}

export default function Marketplace({ initialSlug }: MarketplaceProps) {
  const { profile, signIn } = useAuth();
  const [consultants, setConsultants] = useState<ConsultantWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "price" | "sessions">(
    "rating"
  );
  const [selectedConsultant, setSelectedConsultant] =
    useState<ConsultantWithProfile | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<"chat" | "video_call" | "voice_call">("video_call");

  const [uniqueExpertises, setUniqueExpertises] = useState<string[]>([]);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInError, setSignInError] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);
  const [expandedBio, setExpandedBio] = useState<{ name: string; bio: string } | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const resolveConsultantProfileId = (consultant: ConsultantWithProfile) => {
    return consultant.user_id || consultant.user?.id || consultant.id;
  };

  useEffect(() => {
    console.log("Creators mounted, calling fetchConsultants");
    fetchConsultants();
  }, []);


  const fetchConsultants = async () => {
    try {
      setLoading(true);

      // Step 1: Fetch consultants (public access - works fine)
      const { data: consultantRows, error: consultantErr } = await supabase
        .from("consultants")
        .select("*")
        .eq("is_active", true)
        .order("average_rating", { ascending: false });

      if (consultantErr) throw consultantErr;
      if (!consultantRows || consultantRows.length === 0) {
        setConsultants([]);
        setLoading(false);
        return;
      }

      // Step 2: Fetch the profiles for those consultants separately
      const userIds = consultantRows.map(c => c.user_id).filter(Boolean);
      const { data: profileRows } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name, email, bio, profile_image_url, location")
        .in("id", userIds);

      // Merge consultants with profile data
      const profileMap = new Map((profileRows || []).map(p => [p.id, p]));
      const merged = consultantRows.map(c => ({
        ...c,
        user: profileMap.get(c.user_id) || null,
      }));

      setConsultants(merged);

      const expertisesSet = new Set<string>();
      merged.forEach(c => {
        c.expertise_tags?.forEach((tag: string) => expertisesSet.add(tag));
      });
      setUniqueExpertises(Array.from(expertisesSet).sort());

      if (initialSlug) {
        const target = merged.find(c => c.slug === initialSlug);
        if (target) setSelectedConsultant(target);
      }
    } catch (error) {
      console.error("Error fetching consultants:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConsultants = consultants
    .filter((c) => {
      const matchesSearch =
        searchQuery === "" ||
        c.user?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.user?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.expertise_tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesExpertise =
        selectedExpertise === "" ||
        c.expertise_tags.includes(selectedExpertise);

      return matchesSearch && matchesExpertise;
    })
    .sort((a, b) => {
      if (sortBy === "rating") {
        return b.average_rating - a.average_rating;
      } else if (sortBy === "price") {
        return a.hourly_rate - b.hourly_rate;
      } else {
        return b.total_sessions - a.total_sessions;
      }
    });

  const expandedBioModal = expandedBio ? (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div 
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8 relative animate-in zoom-in-95 duration-300 border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setExpandedBio(null)}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-2 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="mb-6">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">About {expandedBio.name}</h3>
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
            {expandedBio.bio}
          </p>
        </div>

        <div className="mt-8">
          <button
            onClick={() => setExpandedBio(null)}
            className="w-full py-4 bg-slate-900 hover:bg-black text-white font-black rounded-2xl transition-all active:scale-95 shadow-xl shadow-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const signInModal = showSignInModal ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => { setShowSignInModal(false); setSignInError(""); }}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-7 h-7 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Sign in to chat</h2>
          <p className="text-slate-500 text-sm mt-2">Log in to start a conversation with this creator</p>
        </div>

        {signInError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium">
            {signInError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-700 ml-1 block mb-1.5">Email</label>
            <input
              type="email"
              value={signInEmail}
              onChange={e => setSignInEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 ml-1 block mb-1.5">Password</label>
            <input
              type="password"
              value={signInPassword}
              onChange={e => setSignInPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50"
              onKeyDown={async e => {
                if (e.key === "Enter") {
                  setSignInLoading(true);
                  setSignInError("");
                  try {
                    await signIn(signInEmail, signInPassword);
                    setShowSignInModal(false);
                  } catch {
                    setSignInError("Incorrect email or password. Please try again.");
                  } finally {
                    setSignInLoading(false);
                  }
                }
              }}
            />
          </div>
          <button
            disabled={signInLoading || !signInEmail || !signInPassword}
            onClick={async () => {
              setSignInLoading(true);
              setSignInError("");
              try {
                await signIn(signInEmail, signInPassword);
                setShowSignInModal(false);
              } catch {
                setSignInError("Incorrect email or password. Please try again.");
              } finally {
                setSignInLoading(false);
              }
            }}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-100"
          >
            {signInLoading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // Chat view must be checked FIRST so it takes priority over the profile view
  if (showChat && activeConversationId && selectedConsultant) {
    return (
      <>
        {signInModal}
        <ChatPage
          conversationId={activeConversationId}
          consultant={selectedConsultant}
          onBack={() => {
            setShowChat(false);
            setActiveConversationId(null);
          }}
        />
      </>
    );
  }

  if (showBooking && selectedConsultant) {
    return (
      <>
        {signInModal}
        {actionNotice && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[120] w-[calc(100%-2rem)] max-w-xl rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 shadow-lg">
            {actionNotice}
          </div>
        )}
        <BookingPage
          consultant={selectedConsultant}
          serviceType={serviceType}
          onBack={() => setShowBooking(false)}
          onSuccess={() => {
            setShowBooking(false);
            setSelectedConsultant(null);
          }}
        />
      </>
    );
  }

  if (selectedConsultant) {
    return (
      <>
        {signInModal}
        {actionNotice && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[120] w-[calc(100%-2rem)] max-w-xl rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 shadow-lg">
            {actionNotice}
          </div>
        )}
        <ConsultantProfile
          consultantId={resolveConsultantProfileId(selectedConsultant)}
          onBack={() => setSelectedConsultant(null)}
          onBookSession={(consultant, serviceType) => {
            setSelectedConsultant(consultant);
            setShowBooking(true);
            setServiceType(serviceType);
          }}
          onStartChat={async (consultant) => {
            if (!profile) {
              setShowSignInModal(true);
              return;
            }

            try {
              setActionNotice(null);
              const consultantProfileId = resolveConsultantProfileId(consultant);

              if (!consultantProfileId) {
                throw new Error("Consultant profile not available for chat.");
              }

              // Check if conversation exists
              const { data: existing } = await supabase
                .from("conversations")
                .select("id")
                .or(`and(client_id.eq.${profile.id},consultant_id.eq.${consultantProfileId}),and(client_id.eq.${consultantProfileId},consultant_id.eq.${profile.id})`)
                .maybeSingle();

              if (existing) {
                setActiveConversationId(existing.id);
              } else {
                // Create new conversation
                const { data: newConv, error: convError } = await supabase
                  .from("conversations")
                  .insert([
                    {
                      client_id: profile.id,
                      consultant_id: consultantProfileId,
                    },
                  ])
                  .select()
                  .single();

                if (convError) throw convError;
                setActiveConversationId(newConv.id);
              }
              setShowChat(true);
            } catch (error: any) {
              console.error("Error starting chat:", error);
              setActionNotice(error?.message || "Could not start chat. Please try again.");
            }
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {signInModal}
      {expandedBioModal}
      {actionNotice && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {actionNotice}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Find Your Creators
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl">
            Connect with expert creators for personalized guidance and mentorship
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          <div className="lg:col-span-3">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search creators, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-600 mt-3" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="rating">Highest Rated</option>
              <option value="price">Lowest Price</option>
              <option value="sessions">Most Sessions</option>
            </select>
          </div>
        </div>

        {uniqueExpertises.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Filter by Expertise
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedExpertise("")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedExpertise === ""
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                All
              </button>
              {uniqueExpertises.map((expertise) => (
                <button
                  key={expertise}
                  onClick={() => setSelectedExpertise(expertise)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedExpertise === expertise
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  {expertise}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredConsultants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg">
              No consultants found matching your criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {filteredConsultants.map((consultant) => (
              <div
                key={consultant.id || consultant.user_id}
                className="group bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border border-slate-100 overflow-hidden flex flex-col h-full"
              >
                <div className="p-5 sm:p-6 md:p-8 flex flex-col flex-1">
                  {/* Header Section: Fixed Height */}
                  <div className="flex items-start justify-between gap-3 mb-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-blue-50 rounded-2xl border-2 border-white shadow-sm flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 duration-500">
                        {consultant.user?.profile_image_url ? (
                          <img 
                            src={consultant.user.profile_image_url || undefined} 
                            alt={consultant.user.first_name || "Creator"} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-blue-600 font-black text-xl italic">
                            {consultant.user?.first_name?.[0]}{consultant.user?.last_name?.[0]}
                          </span>
                        )}
                      </div>
                    </div>
                     <div className="flex-grow min-w-0 ml-1 sm:ml-4">
                      <h3 className="font-black text-xl text-slate-900 leading-tight mb-1 line-clamp-1">
                        {consultant.user?.first_name}{" "}
                        {consultant.user?.last_name}
                      </h3>
                      <div className="flex flex-col gap-1">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{consultant.years_of_experience || 0}y Experience</p>
                        {consultant.is_verified && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Award className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 mb-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-black text-slate-900 text-lg">
                          {consultant.average_rating.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {consultant.total_reviews} reviews
                      </p>
                    </div>
                  </div>

                  {/* Bio Section: Flex Grow to push tags/footer down */}
                  <div className="flex-1 mb-6">
                    {consultant.user?.bio ? (
                      <div className="relative">
                        <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-3">
                          {consultant.user.bio}
                        </p>
                        {consultant.user.bio.length > 120 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBio({ 
                                name: `${consultant.user?.first_name} ${consultant.user?.last_name}`, 
                                bio: consultant.user?.bio || "" 
                              });
                            }}
                            className="text-blue-600 font-black text-[10px] uppercase tracking-widest mt-2 hover:text-blue-700 transition-colors"
                          >
                            Read More +
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="h-16" /> // Placeholder for empty bio
                    )}
                  </div>

                  {/* Expertise Tags: Fixed area */}
                  <div className="mb-8 min-h-[40px]">
                    <div className="flex flex-wrap gap-2">
                      {consultant.expertise_tags.length > 0 ? (
                        <>
                          {consultant.expertise_tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-block bg-slate-50 text-slate-600 text-[10px] px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider border border-slate-100"
                            >
                              {tag}
                            </span>
                          ))}
                          {consultant.expertise_tags.length > 3 && (
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">
                              +{consultant.expertise_tags.length - 3}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 uppercase italic">No tags listed</span>
                      )}
                    </div>
                  </div>

                  {/* Stats & Button: Bottom */}
                  <div className="space-y-6 pt-6 border-t border-slate-50 mt-auto">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Rate</p>
                        <p className="font-black text-slate-900 flex items-baseline gap-1">
                          <span className="text-xl">${consultant.hourly_rate.toFixed(0)}</span>
                          <span className="text-xs text-slate-400">/hr</span>
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center justify-end gap-1.5 text-slate-400">
                          <Users className="w-4 h-4" />
                          <span className="text-xs font-bold">{consultant.total_sessions}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Sessions</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedConsultant(consultant)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/10 active:scale-[0.98] text-sm"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
