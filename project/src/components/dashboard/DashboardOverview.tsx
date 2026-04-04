import { useState, useEffect } from 'react';
import { 
  Plus, 
  Users, 
  Video, 
  Zap, 
  PlayCircle, 
  MessageSquare, 
  Calendar, 
  Coffee,
  TrendingUp,
  Info,
  Copy,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Consultant, UserProfile } from '@/types';
import { supabase } from '@/lib/supabase';

interface DashboardOverviewProps {
  consultant: Consultant | null;
  profile: UserProfile | null;
}

interface DashboardStats {
  megaSessionsEarnings: number;
  recordingsEarnings: number;
  packagesEarnings: number;
  chatEarnings: number;
  oneOnOneEarnings: number;
  coffeeEarnings: number;
  unrepliedChats: number;
  upcomingMeetings: number;
}

export default function DashboardOverview({ consultant, profile }: DashboardOverviewProps) {
  const [stats, setStats] = useState<DashboardStats>({
    megaSessionsEarnings: 0,
    recordingsEarnings: 0,
    packagesEarnings: 0,
    chatEarnings: 0,
    oneOnOneEarnings: 0,
    coffeeEarnings: 0,
    unrepliedChats: 0,
    upcomingMeetings: 0
  });
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  const profileUrl = consultant?.slug 
    ? `mentoga.com/${consultant.slug}` 
    : `mentoga.com/u/${profile?.id?.slice(0, 8)}`;

  useEffect(() => {
    if (profile?.id) {
      fetchDashboardStats();
    }
  }, [profile?.id, consultant]);

  const fetchDashboardStats = async () => {
    try {
      // 1. Fetch upcoming meetings
      const { count: meetingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('consultant_id', profile?.id)
        .eq('status', 'confirmed')
        .gte('scheduled_at', new Date().toISOString());

      // 2. Fetch unreplied chats (very simplified logic: count conversations where last message is not from me)
      // For now, let's just count total unread messages sent to me
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*, conversations!inner(consultant_id)', { count: 'exact', head: true })
        .eq('is_read', false)
        .eq('conversations.consultant_id', profile?.id)
        .neq('sender_id', profile?.id);

      // 3. Aggregate earnings (This would normally be a more complex query or a view)
      // Since we don't have a full payment history yet, we'll use the consultant's total_earnings as the base
      
      setStats(prev => ({
        ...prev,
        upcomingMeetings: meetingsCount || 0,
        unrepliedChats: unreadCount || 0,
        recordingsEarnings: consultant?.total_earnings || 0,
      }));

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopyNotice('Link copied to clipboard!');
    window.setTimeout(() => setCopyNotice(null), 2000);
  };

  const steps = [
    { icon: <TrendingUp className="w-5 h-5 text-blue-600" />, title: 'Add Mentoga link to your Bio', desc: 'Add Mentoga to your Bio and See Your Earnings Skyrocket!' },
    { icon: <Plus className="w-5 h-5 text-purple-600" />, title: 'Announce Your Availability', desc: 'Go Public with Your Mentoga Availability and Watch Your Booking Requests Multiply!' },
    { icon: <Video className="w-5 h-5 text-indigo-600" />, title: 'Mentioning Mentoga in Video Description', desc: 'Mention Mentoga in Your Video Descriptions - Turn Every View Into a Potential Earning!' },
    { icon: <Calendar className="w-5 h-5 text-red-600" />, title: 'Make Mentoga Part of Your Content', desc: 'Mention Mentoga into Your Daily Posts to Keep Fans Engaged and Bookings Rolling In!' },
  ];

  const statCards = [
    { id: 'megasessions', label: 'MegaSessions', value: `$ ${stats.megaSessionsEarnings.toFixed(2)}`, icon: Zap, color: 'bg-emerald-50 text-emerald-600' },
    { id: 'recordings', label: 'Session Recordings', value: `$ ${stats.recordingsEarnings.toFixed(2)}`, icon: PlayCircle, color: 'bg-blue-50 text-blue-600' },
    { id: 'packages', label: 'Package Subscriptions', value: `$ ${stats.packagesEarnings.toFixed(2)}`, icon: Users, color: 'bg-amber-50 text-amber-600' },
    { id: 'chat', label: 'Chat', value: `$ ${stats.chatEarnings.toFixed(2)}`, icon: MessageSquare, color: 'bg-cyan-50 text-cyan-600' },
    { id: '1on1', label: '1 On 1', value: `$ ${stats.oneOnOneEarnings.toFixed(2)}`, icon: Calendar, color: 'bg-purple-50 text-purple-600' },
    { id: 'coffee', label: 'Coffee', value: `$ ${stats.coffeeEarnings.toFixed(2)}`, icon: Coffee, color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            Welcome Back <span className="text-blue-600">{profile?.first_name} {profile?.last_name}!</span> 👋
          </h1>
          <p className="text-slate-500 font-medium">Here's what me happening with your profile today.</p>
        </div>
        
         <div className="flex items-center gap-3 bg-white p-2 pl-4 rounded-2xl border border-slate-100 shadow-sm self-start">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-slate-600 truncate max-w-[200px]">{profileUrl}</span>
            <button 
              onClick={copyToClipboard}
             className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-blue-600"
            >
             <Copy className="w-4 h-4" />
            </button>
         </div>
         {copyNotice && <p className="text-sm font-bold text-emerald-600">{copyNotice}</p>}
       </div>

      {/* Growth Steps Stepper */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
           </div>
           <div>
             <h2 className="text-xl font-black text-slate-900 italic">More Bookings, Bigger Earnings!</h2>
             <p className="text-sm text-slate-400 font-medium tracking-tight">Just Follow These 4 Simple Steps!</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <div key={idx} className="relative group p-6 rounded-[1.5rem] bg-slate-50/50 hover:bg-white border border-transparent hover:border-blue-100 hover:shadow-xl hover:shadow-blue-600/5 transition-all duration-300">
               <div className="absolute -top-3 -right-3 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-black shadow-lg shadow-blue-600/30 z-10 border-4 border-white">
                 {idx + 1}
               </div>
               <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                 {step.icon}
               </div>
               <h3 className="font-bold text-slate-900 mb-2 leading-tight">{step.title}</h3>
               <p className="text-[10px] text-slate-400 leading-relaxed mb-6 font-medium">{step.desc}</p>
               <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-blue-600 group-hover:gap-3 transition-all">
                 How it works <ChevronRight className="w-3 h-3" />
               </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Stats Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Earnings Card */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
               <Zap className="w-6 h-6 text-blue-600" />
               <h2 className="text-xl font-black text-slate-900 italic tracking-tight">Total Earnings</h2>
               <Info className="w-4 h-4 text-slate-200" />
             </div>
             <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                <button className="px-4 py-2 bg-white text-blue-600 font-black text-xs rounded-lg shadow-sm">This Month</button>
                <button className="px-4 py-2 text-slate-400 font-bold text-xs rounded-lg hover:text-slate-600 transition-all">Lifetime</button>
             </div>
          </div>

          <div className="mb-8">
             <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">$ {consultant?.total_earnings?.toFixed(2) || '0.00'}</span>
                <span className="text-emerald-500 font-black text-sm">+12.5%</span>
             </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {statCards.map((card, idx) => (
              <div key={idx} className="p-6 rounded-[1.5rem] bg-white border border-slate-50 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-600/5 transition-all group cursor-pointer">
                <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
                <p className="text-lg font-black text-slate-900">{card.value}</p>
              </div>
            ))}
          </div>

          <button className="w-full mt-8 py-5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-xs rounded-2xl border border-slate-100 transition-all flex items-center justify-center gap-2">
            View Full Earnings Report <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        {/* Secondary Info Area */}
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-6 p-5 bg-blue-50/30 rounded-[1.5rem] border border-blue-50 group hover:border-blue-100 transition-all cursor-pointer">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-0.5">Un-replied Chats</p>
                <p className="text-3xl font-black text-slate-900">{stats.unrepliedChats}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 p-5 bg-indigo-50/30 rounded-[1.5rem] border border-indigo-50 group hover:border-indigo-100 transition-all cursor-pointer">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-0.5">Upcoming eMeetings</p>
                <p className="text-3xl font-black text-slate-900">{stats.upcomingMeetings}</p>
              </div>
            </div>
          </div>

          {/* Payout Info */}
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-900/20">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl" />
             <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                   <Zap className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-black italic">Payout Process</h3>
             </div>
             <ul className="space-y-4 text-xs text-slate-400 font-bold uppercase tracking-wider relative z-10">
                <li className="flex gap-4">
                   <div className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0 mt-1.5 shadow-lg shadow-blue-600" />
                   Earnings are calculated monthly based on completed sessions.
                </li>
                <li className="flex gap-4">
                   <div className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0 mt-1.5 shadow-lg shadow-blue-600" />
                   Review period is within 8-10 days after month end.
                </li>
                <li className="flex gap-4">
                   <div className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0 mt-1.5 shadow-lg shadow-blue-600" />
                   Payments processed into your bank account within 4-5 days.
                </li>
             </ul>
             <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                   <Info className="w-3.5 h-3.5" /> Need help? contact us
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
