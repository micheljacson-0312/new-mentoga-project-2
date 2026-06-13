import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Download,
  ExternalLink,
  Play,
  Calendar,
  Clock,
  Search,
  Shield,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface RecordingItem {
  id: string;
  call_type: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  recording_url: string | null;
  is_completed: boolean | null;
  bookings?: {
    id: string;
    meeting_url: string | null;
    booking_type: string;
    scheduled_at: string;
  } | null;
}

export default function RecordingManager() {
  const { profile } = useAuth();
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (profile?.id) {
      fetchRecordings();
    }
  }, [profile?.id]);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('calls')
        .select('id, call_type, started_at, ended_at, duration_seconds, recording_url, is_completed, bookings!inner(id, meeting_url, booking_type, scheduled_at, consultant_id)')
        .eq('bookings.consultant_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecordings((data || []) as unknown as RecordingItem[]);
    } catch (error) {
      console.error('Error fetching recordings:', error);
      setRecordings([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecordings = recordings.filter((recording) => {
    const label = `${recording.call_type} ${recording.bookings?.booking_type || ''} ${recording.started_at || ''}`.toLowerCase();
    return label.includes(searchQuery.toLowerCase());
  });

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Recordings</h2>
          <p className="text-slate-500 font-medium mt-1">View completed call history and available recording links.</p>
        </div>
        <div className="bg-orange-50 text-orange-600 px-6 py-3 rounded-2xl font-black flex items-center gap-3 border border-orange-100">
          <Shield className="w-5 h-5" />
          Recording retention depends on provider
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by call type or date..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        {filteredRecordings.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-900 font-black">No recordings found</p>
            <p className="text-slate-500 mt-2">Completed calls with meeting or recording data will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 text-left border-b border-slate-50">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Session</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRecordings.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-sm">
                          <Play className="w-5 h-5 fill-current" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 capitalize">{(rec.call_type || rec.bookings?.booking_type || 'call').replace('_', ' ')}</p>
                          <p className="text-xs font-bold text-slate-400 mt-0.5">Booking #{rec.bookings?.id?.slice(0, 8) || rec.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                        <Calendar className="w-4 h-4" />
                        {new Date(rec.started_at || rec.bookings?.scheduled_at || Date.now()).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                        <Clock className="w-4 h-4" />
                        {formatDuration(rec.duration_seconds)}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-slate-500 font-black text-sm">{rec.recording_url ? 'Recording ready' : rec.is_completed ? 'Completed' : 'In progress'}</td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => window.open(rec.recording_url || rec.bookings?.meeting_url || undefined, '_blank', 'noopener,noreferrer')}
                          disabled={!rec.recording_url && !rec.bookings?.meeting_url}
                          className="p-3 bg-white hover:bg-blue-600 text-slate-400 hover:text-white border border-slate-100 rounded-xl transition-all shadow-sm disabled:opacity-40"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => window.open(rec.recording_url || rec.bookings?.meeting_url || undefined, '_blank', 'noopener,noreferrer')}
                          disabled={!rec.recording_url && !rec.bookings?.meeting_url}
                          className="p-3 bg-white hover:bg-blue-600 text-slate-400 hover:text-white border border-slate-100 rounded-xl transition-all shadow-sm disabled:opacity-40"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
