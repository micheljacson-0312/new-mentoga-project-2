import { useState } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Video, 
  DollarSign, 
  Calendar, 
  BookOpen, 
  Users, 
  Zap, 
  PlayCircle, 
  Film, 
  Star, 
  Heart, 
  TrendingUp, 
  LifeBuoy, 
  Camera, 
  Link, 
  User, 
  Bell, 
  UserCog,
  ChevronDown,
  LogOut,
  Info,
  Globe
} from 'lucide-react';
import { UserProfile } from '@/types';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  hasBadge?: boolean;
}

interface ConsultantSidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  profile: UserProfile | null;
  onLogout: () => void;
}

export default function ConsultantSidebar({ 
  activePage, 
  onNavigate, 
  profile, 
  onLogout 
}: ConsultantSidebarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainNav: NavItem[] = [
    { id: 'marketplace', label: 'Creators', icon: Globe },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chats', label: 'Messages', icon: MessageSquare, hasBadge: true },
    { id: 'emeetings', label: 'eMeetings', icon: Video },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
  ];

  const managementNav: NavItem[] = [
    { id: 'schedule', label: 'Schedule', icon: Calendar, hasBadge: true },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'packages', label: 'Membership Packages', icon: Users },
    { id: 'megasession', label: 'MegaSession', icon: Zap },
    { id: 'megasession_meetings', label: 'MegaSession Meetings', icon: PlayCircle },
    { id: 'recordings', label: 'Purchased Recordings', icon: Film },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'support_cause', label: 'Support a Cause', icon: Heart },
    { id: 'peer_profit', label: 'Peer Profit', icon: TrendingUp },
  ];

  const utilityNav: NavItem[] = [
    { id: 'resolution_center', label: 'Resolution Center', icon: LifeBuoy },
    { id: 'intro_video', label: 'Intro Video', icon: Camera },
    { id: 'connected_accounts', label: 'Connected Accounts', icon: Link },
    { id: 'switch_to_fan', label: 'Switch to Fan', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'edit_profile', label: 'Edit Profile', icon: UserCog, hasBadge: true },
  ];

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = activePage === item.id;
    return (
      <button
        onClick={() => {
          setMobileMenuOpen(false);
          onNavigate(item.id);
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${
          isActive 
            ? 'bg-blue-50 text-blue-600 font-bold' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
        <span className="text-sm flex-1 text-left">{item.label}</span>
        {item.hasBadge && (
          <div className="w-4 h-4 rounded-full bg-blue-900 border-2 border-white flex items-center justify-center">
             <Info className="w-2 h-2 text-white" />
          </div>
        )}
      </button>
    );
  };

  return (
    <>
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black italic">M</div>
          <div className="min-w-0">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Creator</p>
            <p className="text-sm font-black text-slate-900 truncate">{profile?.first_name} {profile?.last_name}</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="px-3 py-2 rounded-xl bg-slate-50 text-slate-700 font-bold text-sm"
        >
          Menu
        </button>
      </div>

      {mobileMenuOpen && (
        <>
          <button type="button" className="fixed inset-0 z-40 bg-slate-900/40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-[88vw] max-w-sm bg-white border-r border-slate-100 shadow-2xl md:hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black italic">M</div>
                <span className="text-lg font-black text-slate-900">Mentoga</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-xl bg-slate-50 text-slate-700 font-bold text-sm">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
              <div className="space-y-1">{mainNav.map(item => <NavLink key={item.id} item={item} />)}</div>
              <div className="h-px bg-slate-50 mx-4" />
              <div className="space-y-1">{managementNav.map(item => <NavLink key={item.id} item={item} />)}</div>
              <div className="h-px bg-slate-50 mx-4" />
              <div className="space-y-1">{utilityNav.map(item => <NavLink key={item.id} item={item} />)}</div>
            </div>
            <div className="p-4 border-t border-slate-100">
              <button onClick={onLogout} className="w-full py-3 rounded-2xl bg-red-50 text-red-600 font-bold text-sm">Sign Out</button>
            </div>
          </div>
        </>
      )}

      <div className="hidden md:flex w-72 h-screen flex-col bg-white border-r border-slate-100 overflow-hidden shrink-0">
      {/* Brand Logo */}
      <div className="p-6">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black italic">M</div>
           <span className="text-xl font-black text-slate-900">Mentoga</span>
        </div>
      </div>

      {/* Main Scrollable Nav Area */}
      <div className="flex-1 overflow-y-auto px-3 space-y-6 pb-20 custom-scrollbar">
        {/* Main Section */}
        <div className="space-y-1">
          {mainNav.map(item => <NavLink key={item.id} item={item} />)}
        </div>

        {/* Separator */}
        <div className="h-px bg-slate-50 mx-4" />

        {/* Management Section */}
        <div className="space-y-1">
          {managementNav.map(item => <NavLink key={item.id} item={item} />)}
        </div>

        {/* Separator */}
        <div className="h-px bg-slate-50 mx-4" />

        {/* Utility Section */}
        <div className="space-y-1">
          {utilityNav.map(item => <NavLink key={item.id} item={item} />)}
        </div>
      </div>

      {/* Profile Footer */}
      <div className="p-4 border-t border-slate-100 bg-white relative">

        {showProfileMenu && (
          <div className="absolute bottom-[calc(100%+8px)] left-4 right-4 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
               onClick={onLogout}
               className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
        <button 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-2xl transition-all group"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-100 shadow-sm">
            {profile?.profile_image_url ? (
              <img src={profile.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {profile?.first_name?.[0]}
              </div>
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-slate-900 leading-none mb-1 line-clamp-1">{profile?.first_name} {profile?.last_name}</p>
            <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Consultant</p>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
        </button>
      </div>

      </div>
    </>
  );
}
