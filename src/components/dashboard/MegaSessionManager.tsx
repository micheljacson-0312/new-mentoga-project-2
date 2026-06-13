import { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  Video, 
  Trash2, 
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save as SaveIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface MegaSession {
  id: string;
  title: string;
  description: string;
  scheduled_at: string;
  duration_minutes: number;
  price: number;
  capacity: number;
  meeting_url: string;
  status: string;
}

export default function MegaSessionManager() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<MegaSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [newSession, setNewSession] = useState<Partial<MegaSession>>({
    title: '',
    description: '',
    scheduled_at: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    duration_minutes: 60,
    price: 49.99,
    capacity: 100,
    meeting_url: '',
    status: 'booking'
  });

  useEffect(() => {
    if (profile?.id) {
      fetchSessions();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('megasessions')
        .select('*')
        .eq('consultant_id', profile?.id)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching megasessions:', error);
      setMessage({ type: 'error', text: 'Failed to load sessions' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!profile?.id || !newSession.title) return;

    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('megasessions')
        .insert([{
          ...newSession,
          consultant_id: profile.id
        }])
        .select()
        .single();

      if (error) throw error;

      setSessions(prev => [...prev, data]);
      setIsAdding(false);
      setMessage({ type: 'success', text: 'MegaSession created successfully!' });
      setNewSession({
        title: '',
        description: '',
        scheduled_at: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        duration_minutes: 60,
        price: 49.99,
        capacity: 100,
        meeting_url: '',
        status: 'booking'
      });
    } catch (error: any) {
      console.error('Error creating session:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to create session' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this MegaSession?')) return;

    try {
      const { error } = await supabase
        .from('megasessions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== id));
      setMessage({ type: 'success', text: 'Session deleted successfully' });
    } catch (error) {
      console.error('Error deleting session:', error);
      setMessage({ type: 'error', text: 'Failed to delete' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {message && (
        <div className={`fixed top-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="font-black text-sm">{message.text}</p>
        </div>
      )}

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center shadow-inner">
            <Zap className="w-8 h-8 fill-current" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">MegaSessions</h2>
            <p className="text-slate-500 font-medium">Host large-scale group sessions and maximize your reach.</p>
          </div>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-5 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95 translate-y-0 active:translate-y-1"
          >
            <Plus className="w-5 h-5" />
            Create MegaSession
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-10 rounded-[3rem] border-2 border-blue-600 shadow-2xl shadow-blue-600/10 space-y-8 animate-in zoom-in-95 duration-300">
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 italic">New MegaSession Details</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 font-black hover:text-red-500 transition-colors">Cancel</button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                 <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Session Title</label>
                 <input 
                  type="text" 
                  value={newSession.title}
                  onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:border-blue-600 focus:bg-white transition-all outline-none"
                  placeholder="e.g. Masterclass: Scaling Business 10x"
                 />
              </div>
              <div className="space-y-3">
                 <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Meeting Link</label>
                 <div className="relative">
                    <Video className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="url" 
                      value={newSession.meeting_url}
                      onChange={(e) => setNewSession(prev => ({ ...prev, meeting_url: e.target.value }))}
                      className="w-full pl-16 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:border-blue-600 focus:bg-white transition-all outline-none"
                      placeholder="https://zoom.us/j/..."
                    />
                 </div>
              </div>
              <div className="space-y-3">
                 <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Schedule Date & Time</label>
                 <div className="relative">
                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="datetime-local" 
                      value={newSession.scheduled_at}
                      onChange={(e) => setNewSession(prev => ({ ...prev, scheduled_at: e.target.value }))}
                      className="w-full pl-16 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:border-blue-600 focus:bg-white transition-all outline-none"
                    />
                 </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration (Min)</label>
                    <input 
                      type="number" 
                      value={newSession.duration_minutes}
                      onChange={(e) => setNewSession(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:border-blue-600 transition-all outline-none"
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Price ($)</label>
                    <input 
                      type="number" 
                      value={newSession.price}
                      onChange={(e) => setNewSession(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:border-blue-600 transition-all outline-none"
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacity</label>
                    <input 
                      type="number" 
                      value={newSession.capacity}
                      onChange={(e) => setNewSession(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:border-blue-600 transition-all outline-none"
                    />
                 </div>
              </div>
           </div>
           
           <div className="flex justify-end gap-4 mt-8">
              <button 
                onClick={handleCreate}
                disabled={saving || !newSession.title}
                className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-10 py-5 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95"
              >
                 {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <SaveIcon className="w-5 h-5" />}
                 {saving ? "Publishing..." : "Publish Session"}
              </button>
           </div>
        </div>
      )}

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/50">
           <h3 className="text-xl font-black text-slate-900 italic tracking-tight">Active MegaSessions</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Session</th>
                <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Schedule</th>
                <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Price</th>
                <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-16 text-center text-slate-400 font-bold italic">No sessions found.</td>
                </tr>
              ) : sessions.map((session) => (
                <tr key={session.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-10 py-6">
                    <div>
                      <p className="font-black text-slate-900">{session.title}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{session.capacity} Fans Max</p>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="text-sm font-bold text-slate-600">
                      {new Date(session.scheduled_at).toLocaleDateString()} at {new Date(session.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-10 py-6 font-black text-slate-900 italic text-lg">$ {session.price}</td>
                  <td className="px-10 py-6 text-right">
                    <button onClick={() => handleDelete(session.id)} className="p-3 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
