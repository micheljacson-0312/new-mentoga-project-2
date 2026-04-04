import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Consultant, UserProfile, Review, Course } from "@/types";
import {
  Star,
  Award,
  Users,
  Clock,
  MessageSquare,
  Video,
  ChevronLeft,
  BookOpen,
  X,
  Zap,
  Play,
  Loader2
} from "lucide-react";
import ReviewForm from "@/components/reviews/ReviewForm";

interface ConsultantProfileProps {
  consultantId: string;
  onBack: () => void;
  onBookSession: (consultant: any, serviceType: "chat" | "video_call" | "voice_call") => void;
  onStartChat: (consultant: any) => void;
  previewData?: ConsultantWithUser;
}

interface ConsultantWithUser extends Consultant {
  user?: UserProfile;
}

export default function ConsultantProfile({
  consultantId,
  onBack,
  onBookSession,
  onStartChat,
  previewData,
}: ConsultantProfileProps) {
  const [consultant, setConsultant] = useState<ConsultantWithUser | null>(previewData || null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [similarMentors, setSimilarMentors] = useState<ConsultantWithUser[]>([]);
  const [loading, setLoading] = useState(!previewData);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<"recorded" | "paid" | "reviews">("recorded");
  const [showReviewModal, setShowReviewModal] = useState(false);

  const openConsultantProfile = (target: ConsultantWithUser) => {
    localStorage.setItem("mentoga_currentPage", "marketplace");

    if (target.slug) {
      window.location.assign(`/c/${target.slug}`);
      return;
    }

    window.location.assign("/");
  };

  useEffect(() => {
    if (previewData) {
      setConsultant(previewData);
      setLoading(false);
    } else {
      fetchConsultantData();
    }
  }, [consultantId, previewData]);

  const fetchConsultantData = async () => {
    try {
      setLoading(true);

      const { data: consultantData, error: consultantError } = await supabase
        .from("consultants")
        .select("*, user:user_profiles(id, first_name, last_name, email, bio, profile_image_url, location, phone)")
        .eq("user_id", consultantId)
        .maybeSingle();

      if (consultantError) throw consultantError;

      if (consultantData) {
        setConsultant({
          ...consultantData,
          user: Array.isArray(consultantData.user) ? consultantData.user[0] : consultantData.user,
        });

        const { data: reviewsData, error: reviewsError } = await supabase
          .from("reviews")
          .select(`
            *,
            user_profiles!reviews_user_id_fkey (
              first_name,
              last_name,
              profile_image_url
            )
          `)
          .eq("consultant_id", consultantId)
          .order("created_at", { ascending: false });

        if (reviewsError) throw reviewsError;
        setReviews((reviewsData || []) as any);

        const { data: coursesData } = await supabase
          .from("courses")
          .select("*")
          .eq("consultant_id", consultantId)
          .eq("is_published", true);
        setCourses(coursesData || []);

        const { data: similarData } = await supabase
          .from("consultants")
          .select("*, user:user_profiles(id, first_name, last_name, profile_image_url)")
          .neq("user_id", consultantId)
          .limit(4);

        if (similarData) {
          setSimilarMentors(similarData.map(c => ({
            ...c,
            user: (Array.isArray(c.user) ? c.user[0] : c.user) || null,
          })));
        }
      }
    } catch (error) {
      console.error("Error fetching consultant data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }


  if (!consultant) {
    return (
      <div className="p-12 text-center space-y-6 max-w-md mx-auto">
        <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-200">
           <Users className="w-10 h-10" />
        </div>
        <div>
           <h3 className="text-2xl font-black text-slate-900 italic">Consultant not found</h3>
           <p className="text-slate-400 font-medium mt-2">The profile you are looking for might have been moved or removed.</p>
        </div>
        <button
          onClick={onBack}
          className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-xs"
        >
          Back to Creators
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 md:pb-32">
      {/* Mentoga Header */}
      <div className="relative">
        <div className="h-[240px] sm:h-[280px] md:h-[320px] w-full relative overflow-hidden bg-[#0c2438]">
          {consultant.banner_image_url ? (
            <img src={consultant.banner_image_url} alt="Banner" className="w-full h-full object-cover opacity-60" />
          ) : (
             <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-900 to-[#0c2438]" />
          )}
          {/* Decorative Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          
          {/* Header Navigation Area */}
          <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-10">
            <button
              onClick={onBack}
              className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 bg-white/10 backdrop-blur-xl rounded-2xl text-white font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-white/20 transition-all border border-white/20"
            >
              <ChevronLeft className="w-4 h-4" />
              Creators
            </button>
          </div>
        </div>

        {/* Profile Info Overlay */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 relative -mt-20 sm:-mt-24 md:-mt-32 z-10">
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-slate-900/10 p-5 sm:p-8 md:p-12 flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-center border border-white">
            <div className="relative">
               <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 bg-white rounded-[2rem] md:rounded-[3rem] border-[6px] md:border-[8px] border-white shadow-2xl overflow-hidden shrink-0">
                {consultant.user?.profile_image_url ? (
                  <img
                    src={consultant.user.profile_image_url}
                    alt={consultant.user.first_name || "Consultant"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-50 flex items-center justify-center text-blue-900 font-black text-6xl italic">
                    {consultant.user?.first_name?.[0]}
                  </div>
                )}
              </div>
              <div className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-2xl shadow-lg border-4 border-white">
                <Award className="w-6 h-6" />
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Verified Expert</span>
                    <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest">Active Now</span>
                 </div>
                  <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic leading-none break-words">
                   {consultant.user?.first_name} {consultant.user?.last_name}
                 </h1>
              </div>
              <p className="text-slate-500 font-medium text-base sm:text-lg max-w-2xl leading-relaxed italic">
                {consultant.user?.bio || "Expert Mentor & Content Creator contributing professional guidance to the Mentoga community."}
              </p>
              
              <div className="flex flex-wrap gap-6 sm:gap-10 items-center pt-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-2">Overall Excellence</span>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black text-slate-900 italic tracking-tighter">{consultant.average_rating.toFixed(2)}</span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.floor(consultant.average_rating) ? "fill-yellow-400 text-yellow-400" : "text-slate-100"}`} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="w-px h-12 bg-slate-100 hidden md:block" />

                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-2">Sessions Done</span>
                  <p className="text-3xl font-black text-slate-900 italic tracking-tighter">{consultant.total_sessions || 0}</p>
                </div>

                <div className="flex-1 md:flex justify-end hidden">
                  <button className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-2xl shadow-blue-600/30 flex items-center gap-3 hover:scale-105 active:scale-95">
                    Start a Chat
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 mt-10 sm:mt-14 md:mt-20">
        {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-4 sm:gap-8 md:gap-12 border-b-2 border-slate-100 mb-8 md:mb-16 overflow-x-auto pb-1">
          {[
            { id: "recorded", label: "Recorded Modules" },
            { id: "paid", label: "Direct Access" },
            { id: "reviews", label: "Success Stories" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 md:pb-6 px-2 text-xs sm:text-sm font-black transition-all relative uppercase tracking-widest whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-blue-600"
                  : "text-slate-300 hover:text-slate-500"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-[-2px] left-0 right-0 h-[3px] bg-blue-600 rounded-full animate-in slide-in-from-left duration-300" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-12 md:space-y-24">
          {activeTab === "recorded" && (
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
              <div className="mb-12">
                 <h2 className="text-2xl md:text-3xl font-black text-slate-900 italic tracking-tight">Recorded Sessions</h2>
                <p className="text-slate-400 font-medium">Deep-dive learning modules to scale your skills at your own pace.</p>
              </div>

              {courses.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-10">
                  {courses.map((course) => (
                    <div 
                      key={course.id} 
                      onClick={() => setSelectedCourse(course)}
                       className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-100/50 hover:shadow-blue-600/10 transition-all group cursor-pointer flex flex-col h-full"
                    >
                      <div className="aspect-[16/10] relative overflow-hidden bg-slate-50">
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-16 h-16 text-slate-100" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl">
                              <Play className="fill-blue-600 text-blue-600 w-6 h-6 ml-1" />
                           </div>
                        </div>
                      </div>
                       <div className="p-5 sm:p-6 md:p-10 flex-1 flex flex-col">
                        <div className="mb-4">
                           <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                             {course.category}
                           </span>
                        </div>
                         <h4 className="font-black text-slate-900 mb-4 text-xl sm:text-2xl leading-tight italic tracking-tight uppercase">{course.title}</h4>
                        <p className="text-slate-500 text-base mb-8 line-clamp-3 leading-relaxed font-medium italic">
                          "{course.description}"
                        </p>

                        <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <Clock className="w-4 h-4 text-slate-300" />
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">60 MINS</span>
                           </div>
                           <p className="text-2xl font-black text-blue-600 italic tracking-tighter">$ {course.price}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-sm border-dashed">
                  <Play className="w-24 h-24 text-blue-50 mx-auto mb-8" />
                  <h4 className="text-2xl font-black text-slate-900 italic">No recorded content published</h4>
                  <p className="text-slate-400 max-w-xs mx-auto font-medium mt-2">Exclusive video modules will appear here once published.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "paid" && (
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
               <div className="mb-12">
                <h2 className="text-3xl font-black text-slate-900 italic tracking-tight">Direct Access</h2>
                <p className="text-slate-400 font-medium">Book private appointments or message directly for personalized advice.</p>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-10">
                {/* 1-1 Call Card */}
                 <div className="bg-[#0c2438] rounded-[2rem] md:rounded-[3.5rem] overflow-hidden group shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col">
                    <div className="p-5 sm:p-7 md:p-10 bg-gradient-to-r from-blue-900 to-[#1a3a5a] text-center space-y-2">
                      <div className="w-16 h-16 bg-blue-500/10 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                         <Video className="w-8 h-8" />
                      </div>
                       <h3 className="text-2xl md:text-3xl font-black text-white italic tracking-tight uppercase">Private Video Call</h3>
                      <p className="text-blue-200/50 font-bold text-xs uppercase tracking-widest">Live Coaching Session</p>
                   </div>
                    <div className="p-5 sm:p-7 md:p-10 flex-1 flex flex-col justify-center gap-4 md:gap-6">
                      {[
                        { time: 15, price: consultant.video_rate_per_minute * 15 },
                        { time: 30, price: consultant.video_rate_per_minute * 30 },
                        { time: 60, price: consultant.video_rate_per_minute * 60 },
                      ].map((pkg) => (
                        <button 
                          key={pkg.time}
                          onClick={() => onBookSession(consultant, "video_call")}
                           className="w-full bg-white/5 p-5 sm:p-6 md:p-8 rounded-[2rem] hover:bg-blue-600 transition-all group/btn flex items-center justify-between gap-3 border border-white/5 active:scale-95"
                        >
                           <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-blue-400">
                                <Clock className="w-6 h-6" />
                             </div>
                             <span className="text-lg sm:text-xl font-black text-white italic tracking-tight">{pkg.time} MINS</span>
                           </div>
                            <p className="text-2xl sm:text-3xl font-black text-white tracking-tighter">$ {pkg.price.toFixed(0)}</p>
                        </button>
                      ))}
                   </div>
                </div>

                {/* 1-1 Chat Card */}
                 <div className="bg-[#0c2438] rounded-[2rem] md:rounded-[3.5rem] overflow-hidden group shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col">
                    <div className="p-5 sm:p-7 md:p-10 bg-gradient-to-r from-indigo-900 to-[#1e1b4b] text-center space-y-2">
                      <div className="w-16 h-16 bg-indigo-500/10 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                         <MessageSquare className="w-8 h-8" />
                      </div>
                       <h3 className="text-2xl md:text-3xl font-black text-white italic tracking-tight uppercase">Unlimited Chat</h3>
                      <p className="text-indigo-200/50 font-bold text-xs uppercase tracking-widest">Direct Messaging Access</p>
                   </div>
                    <div className="p-5 sm:p-7 md:p-12 flex-1 flex flex-col items-center justify-center text-center space-y-6 md:space-y-10">
                      <div className="space-y-4">
                        <p className="text-white text-lg font-medium max-w-[280px] mx-auto italic opacity-70 leading-relaxed">
                          "Got a quick question? Message me directly for verified professional advice."
                        </p>
                      </div>
                      <button 
                        onClick={() => onStartChat(consultant)}
                         className="w-full py-5 sm:py-6 md:py-8 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[2rem] md:rounded-[2.5rem] text-lg sm:text-xl md:text-2xl shadow-2xl shadow-blue-900/40 transition-all flex items-center justify-center gap-3 md:gap-4 active:scale-95"
                      >
                        <Zap className="w-8 h-8" />
                        Start Chat Now
                      </button>
                      <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">
                         <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                         Consultant responds within 2 hours
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 mb-8 md:mb-16">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 italic tracking-tight">Success Stories</h2>
                  <p className="text-slate-400 font-medium">What the community has to say about their mentoring experience.</p>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowReviewModal(true)}
                     className="px-6 sm:px-10 py-4 sm:py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/30 text-xs uppercase tracking-widest"
                  >
                    Post a Review
                  </button>
                </div>
              </div>

              {reviews.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-10">
                  {reviews.map((review: any) => (
                     <div key={review.id} className="bg-white p-5 sm:p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-100/50 hover:border-blue-100 transition-all flex flex-col">
                       <div className="flex items-center justify-between mb-8">
                          <div className="flex gap-1">
                             {[...Array(5)].map((_, i) => (
                               <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-50"}`} />
                             ))}
                          </div>
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(review.created_at).toLocaleDateString()}</span>
                       </div>
                       <p className="text-slate-600 font-medium text-lg leading-relaxed mb-10 italic flex-1 capitalize">
                         "{review.comment}"
                       </p>
                       <div className="flex items-center gap-4 pt-8 border-t border-slate-50">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                             {review.user_profiles?.profile_image_url ? (
                               <img src={review.user_profiles.profile_image_url} className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-xl italic uppercase">
                                 {review.user_profiles?.first_name?.[0] || 'V'}
                               </div>
                             )}
                          </div>
                          <div>
                             <p className="text-sm font-black text-slate-900 uppercase tracking-tight italic">{review.user_profiles?.first_name} {review.user_profiles?.last_name || 'Verified User'}</p>
                             <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Verified Alumnus</p>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm border-dashed">
                  <Star className="w-24 h-24 text-blue-50 mx-auto mb-8" />
                  <h4 className="text-2xl font-black text-slate-900 italic">No reviews shared yet</h4>
                  <p className="text-slate-400 max-w-xs mx-auto font-medium mt-2">Become the first to share your experience with this creator.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Similar Mentors Section */}
        {similarMentors.length > 0 && (
           <div className="mt-16 md:mt-40 mb-12 md:mb-20 border-t-2 border-slate-50 pt-12 md:pt-32 animate-in fade-in slide-in-from-bottom-5 duration-1000">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 mb-8 md:mb-16">
               <div>
                 <h2 className="text-3xl md:text-4xl font-black text-slate-900 italic tracking-tighter uppercase">Related Creators</h2>
                 <p className="text-slate-400 font-medium">Unlock more expert guidance from our community of professionals.</p>
               </div>
                <button onClick={onBack} className="px-10 py-5 bg-white text-slate-900 font-black rounded-2xl border-2 border-slate-100 hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm text-xs uppercase tracking-widest">
                   View Directory
                </button>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
               {similarMentors.map((mentor) => (
                 <div 
                   key={mentor.user_id}
                    className="bg-white p-5 sm:p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-100/50 hover:shadow-blue-600/10 transition-all group overflow-hidden relative"
                 >
                    <div className="relative z-10 text-center space-y-6">
                       <div className="w-24 h-24 rounded-[2rem] border-[6px] border-white shadow-2xl overflow-hidden mx-auto group-hover:scale-110 transition-transform duration-700">
                         <img src={mentor.user?.profile_image_url || ""} alt={mentor.user?.first_name || ""} className="w-full h-full object-cover" />
                       </div>
                       <div>
                          <h4 className="font-black text-slate-900 text-xl italic tracking-tight uppercase group-hover:text-blue-600 transition-colors uppercase">{mentor.user?.first_name} {mentor.user?.last_name}</h4>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Verified Instructor</p>
                       </div>
                        <button onClick={() => openConsultantProfile(mentor)} className="w-full py-4 bg-slate-50 text-slate-900 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                           See Portfolio
                        </button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>

      {/* Course Details Modal */}
      {selectedCourse && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-[#0c2438]/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2rem] md:rounded-[4rem] overflow-hidden shadow-2xl flex flex-col md:row animate-in zoom-in-95 duration-500">
              <div className="md:w-1/2 relative bg-slate-50 h-[300px] md:h-auto overflow-hidden">
                 {selectedCourse.thumbnail_url ? (
                   <img src={selectedCourse.thumbnail_url} alt={selectedCourse.title} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center">
                     <BookOpen className="w-24 h-24 text-slate-100" />
                   </div>
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0c2438]/80 to-transparent" />
                 <div className="absolute bottom-10 left-10 p-2">
                    <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Academy</span>
                    <h3 className="text-white text-3xl font-black leading-tight italic uppercase tracking-tighter">{selectedCourse.title}</h3>
                 </div>
              </div>

               <div className="md:w-1/2 p-5 sm:p-8 md:p-16 relative flex flex-col justify-center">
                 <button 
                  onClick={() => setSelectedCourse(null)}
                  className="absolute top-8 right-8 p-3 bg-slate-50 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-full transition-all"
                 >
                   <X className="w-6 h-6" />
                 </button>

                 <div className="space-y-10">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-blue-600 shadow-lg">
                         <img src={consultant.user?.profile_image_url || ""} alt="Instructor" className="w-full h-full object-cover" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Master Class by</p>
                          <p className="text-lg font-black text-slate-900 uppercase italic tracking-tight">{consultant.user?.first_name} {consultant.user?.last_name}</p>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <p className="text-slate-500 text-lg leading-relaxed italic font-medium">
                          "{selectedCourse.description}"
                       </p>
                    </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-4">
                       <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Duration</p>
                          <p className="text-base font-black text-slate-900 uppercase">Interactive</p>
                       </div>
                       <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Benefit</p>
                          <p className="text-base font-black text-slate-900 uppercase">Lifetime</p>
                       </div>
                    </div>

                     <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-10 pt-8 sm:pt-10">
                       <div className="bg-blue-50/50 px-8 py-4 rounded-3xl border border-blue-100">
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total cost</p>
                          <p className="text-4xl font-black text-blue-600 italic tracking-tighter">$ {selectedCourse.price}</p>
                       </div>
                        <button onClick={() => { setSelectedCourse(null); onStartChat(consultant); }} className="flex-1 h-20 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[2rem] shadow-2xl shadow-blue-600/30 transition-all flex items-center justify-center gap-3 active:scale-95 group">
                           Unlock Access
                           <Zap className="w-6 h-6 text-white group-hover:scale-125 transition-transform" />
                        </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Review Submission Modal */}
      {showReviewModal && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-[#0c2438]/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-xl">
            <ReviewForm 
              consultantId={consultant.user_id} 
              onSuccess={() => {
                setShowReviewModal(false);
                fetchConsultantData();
              }}
              onCancel={() => setShowReviewModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
