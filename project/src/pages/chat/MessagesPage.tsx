import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Conversation } from "@/types";
import { 
  Search, 
  MessageSquare, 
  ChevronRight
} from "lucide-react";
import ChatPage from "./ChatPage";

export default function MessagesPage() {
  const { profile, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    if (authLoading) return; // wait for auth to settle
    if (profile) {
      fetchConversations();
    } else {
      setLoading(false); // auth done, no profile — stop spinner
    }
  }, [profile, authLoading]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      // Fetch conversations where user is client or consultant
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          client:client_id(id, first_name, last_name, profile_image_url),
          consultant:consultant_id(id, first_name, last_name, profile_image_url)
        `)
        .or(`client_id.eq.${profile?.id},consultant_id.eq.${profile?.id}`)
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (selectedConversation) {
    // Determine which profile is the "other" person
    const otherMember = selectedConversation.client_id === profile?.id 
      ? (selectedConversation as any).consultant 
      : (selectedConversation as any).client;
    
    if (!otherMember) return null;
    
    // Construct a minimal consultant object for ChatPage
    const consultantData = {
      user_id: otherMember.id,
      user: otherMember,
      // Minimal defaults for ChatPage logic
      chat_rate_per_minute: 0.1, 
    } as any;

    return (
      <ChatPage
        conversationId={selectedConversation.id}
        consultant={consultantData}
        onBack={() => {
          setSelectedConversation(null);
          fetchConversations();
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
            <p className="text-slate-500 text-sm">Manage your ongoing consultant conversations</p>
          </div>
          
          <div className="relative flex-1 md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm shadow-sm"
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
             <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-slate-500 text-sm font-medium tracking-wide">Fetching conversations...</p>
             </div>
          ) : !profile ? (
             <div className="p-16 text-center">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <MessageSquare className="w-8 h-8 text-slate-300" />
               </div>
               <h3 className="text-lg font-bold text-slate-900">Sign in to view messages</h3>
               <p className="text-slate-500 max-w-xs mx-auto mt-2 text-sm">
                 Log in to see your ongoing conversations.
               </p>
             </div>
          ) : conversations.length === 0 ? (
             <div className="p-16 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No messages yet</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-2">
                  Start a conversation with a creator to see it here.
                </p>
                <button 
                   onClick={() => window.location.reload()} 
                   className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all text-sm"
                >
                  Explore Creators
                </button>
             </div>
          ) : (
            <div className="divide-y divide-slate-100">
               {conversations
                .filter((conv: any) => {
                   const other = conv.client_id === profile?.id ? conv.consultant : conv.client;
                   if (!other) return false;
                   const fullName = `${other.first_name || ''} ${other.last_name || ''}`.toLowerCase();
                   return fullName.includes(searchQuery.toLowerCase());
                })
                .map((conv: any) => {
                  const other = conv.client_id === profile?.id ? conv.consultant : conv.client;
                  if (!other) return null;
                  const lastUpdate = new Date(conv.last_message_at).toLocaleDateString();
                  
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center gap-4 group"
                    >
                      <div className="relative">
                        <div className="w-14 h-14 bg-blue-50 rounded-full overflow-hidden flex items-center justify-center border-2 border-slate-100">
                           {other.profile_image_url ? (
                              <img src={other.profile_image_url} alt="" className="w-full h-full object-cover" />
                           ) : (
                              <span className="text-blue-600 font-bold text-lg">
                                {other.first_name?.[0]}{other.last_name?.[0]}
                              </span>
                           )}
                        </div>
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {other.first_name} {other.last_name}
                          </h3>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                            {lastUpdate}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                           <p className="text-sm text-slate-500 truncate flex-1">
                             Click to view chat history and start messaging...
                           </p>
                           <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 translate-x-0 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </button>
                  );
               })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
