import { useState, useEffect } from 'react';
import { 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  Info,
  CalendarDays,
  Settings2,
  Video,
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface TimeSlot {
  id: string;
  start: string;
  end: string;
}

interface DaySchedule {
  day: string;
  dayIndex: number;
  enabled: boolean;
  slots: TimeSlot[];
}

export default function ScheduleManager() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [schedules, setSchedules] = useState<DaySchedule[]>([
    { day: 'Monday', dayIndex: 1, enabled: true, slots: [] },
    { day: 'Tuesday', dayIndex: 2, enabled: true, slots: [] },
    { day: 'Wednesday', dayIndex: 3, enabled: true, slots: [] },
    { day: 'Thursday', dayIndex: 4, enabled: true, slots: [] },
    { day: 'Friday', dayIndex: 5, enabled: true, slots: [] },
    { day: 'Saturday', dayIndex: 6, enabled: false, slots: [] },
    { day: 'Sunday', dayIndex: 0, enabled: false, slots: [] },
  ]);

  const [sessionTypes, setSessionTypes] = useState({
    video: true,
    chat: true,
    audio: false
  });

  useEffect(() => {
    if (profile?.id) {
      fetchAvailability();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      
      // Fetch slots
      const { data, error } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('consultant_id', profile?.id)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const newSchedules = schedules.map(s => {
          const daySlots = data.filter(d => d.day_of_week === s.dayIndex);
          return {
            ...s,
            enabled: daySlots.length > 0 ? daySlots[0].is_available : false,
            slots: daySlots.map(ds => ({
              id: ds.id,
              start: ds.start_time.slice(0, 5),
              end: ds.end_time.slice(0, 5)
            }))
          };
        });
        setSchedules(newSchedules);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      setMessage({ type: 'error', text: 'Failed to load schedule' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    try {
      setSaving(true);
      
      // 1. Delete existing slots for this consultant
      const { error: deleteError } = await supabase
        .from('availability_slots')
        .delete()
        .eq('consultant_id', profile.id);

      if (deleteError) throw deleteError;

      // 2. Prepare new slots
      const allSlots = schedules.flatMap(day => 
        day.enabled ? day.slots.map(slot => ({
          consultant_id: profile.id,
          day_of_week: day.dayIndex,
          start_time: slot.start,
          end_time: slot.end,
          is_available: true
        })) : []
      );

      if (allSlots.length > 0) {
        const { error: insertError } = await supabase
          .from('availability_slots')
          .insert(allSlots);
        
        if (insertError) throw insertError;
      }

      setMessage({ type: 'success', text: 'Schedule saved successfully!' });
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save schedule' });
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (index: number) => {
    const newSchedules = [...schedules];
    newSchedules[index].enabled = !newSchedules[index].enabled;
    if (newSchedules[index].enabled && newSchedules[index].slots.length === 0) {
      newSchedules[index].slots = [{ id: Math.random().toString(), start: '09:00', end: '17:00' }];
    }
    setSchedules(newSchedules);
  };

  const addSlot = (dayIndex: number) => {
    const newSchedules = [...schedules];
    newSchedules[dayIndex].slots.push({ 
      id: Math.random().toString(), 
      start: '09:00', 
      end: '17:00' 
    });
    setSchedules(newSchedules);
  };

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    const newSchedules = [...schedules];
    newSchedules[dayIndex].slots.splice(slotIndex, 1);
    setSchedules(newSchedules);
  };

  const updateSlot = (dayIndex: number, slotIndex: number, field: 'start' | 'end', value: string) => {
    const newSchedules = [...schedules];
    newSchedules[dayIndex].slots[slotIndex][field] = value;
    setSchedules(newSchedules);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {message && (
        <div className={`fixed top-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="font-black text-sm">{message.text}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Availability</h2>
          <p className="text-slate-500 font-medium mt-1">Configure your weekly working hours and session types.</p>
        </div>
        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 font-black rounded-xl shadow-sm border border-slate-100">
            <CalendarDays className="w-5 h-5" />
            Weekly
          </div>
          <div className="flex items-center gap-2 px-4 py-2 text-slate-400 font-black rounded-xl hover:text-slate-600 transition-all cursor-not-allowed opacity-50">
            <Clock className="w-5 h-5" />
            Exceptions
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Session Types */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6 h-fit">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-blue-600" />
            Session Types
          </h3>
          <div className="space-y-4">
            <label className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${sessionTypes.video ? 'border-blue-600 bg-blue-50/50' : 'border-slate-50'}`}>
              <div className="flex items-center gap-3">
                <Video className={`w-5 h-5 ${sessionTypes.video ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className={`font-black ${sessionTypes.video ? 'text-slate-900' : 'text-slate-400'}`}>Video Call</span>
              </div>
              <input 
                type="checkbox" 
                checked={sessionTypes.video} 
                onChange={() => setSessionTypes(prev => ({ ...prev, video: !prev.video }))}
                className="w-5 h-5 rounded-lg border-2 border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
            <label className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${sessionTypes.chat ? 'border-blue-600 bg-blue-50/50' : 'border-slate-50'}`}>
              <div className="flex items-center gap-3">
                <MessageSquare className={`w-5 h-5 ${sessionTypes.chat ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className={`font-black ${sessionTypes.chat ? 'text-slate-900' : 'text-slate-400'}`}>Paid Chat</span>
              </div>
              <input 
                type="checkbox" 
                checked={sessionTypes.chat} 
                onChange={() => setSessionTypes(prev => ({ ...prev, chat: !prev.chat }))}
                className="w-5 h-5 rounded-lg border-2 border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
             <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                   Enabling these will allow clients to book these session types during your available hours.
                </p>
             </div>
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
             <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900">Weekly Hours</h3>
                <span className="text-sm font-bold text-slate-400">Timezone: UTC+5:00</span>
             </div>
             <div className="divide-y divide-slate-50">
                {schedules.map((day, dayIndex) => (
                  <div key={day.day} className={`p-8 transition-all ${!day.enabled ? 'bg-slate-50/30' : ''}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                      <div className="w-32">
                        <label className="flex items-center gap-3 cursor-pointer group">
                           <div 
                            onClick={() => toggleDay(dayIndex)}
                            className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${day.enabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                           >
                              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${day.enabled ? 'left-7' : 'left-1'}`} />
                           </div>
                           <span className="text-lg font-black text-slate-900 uppercase tracking-tight">{day.day.slice(0, 3)}</span>
                        </label>
                      </div>

                      <div className="flex-1 space-y-4">
                        {day.enabled ? (
                          day.slots.length > 0 ? (
                            day.slots.map((slot, slotIndex) => (
                              <div key={slot.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2 duration-300">
                                <div className="flex-1 grid grid-cols-2 gap-3">
                                  <input 
                                    type="time" 
                                    value={slot.start} 
                                    onChange={(e) => updateSlot(dayIndex, slotIndex, 'start', e.target.value)}
                                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                                  />
                                  <input 
                                    type="time" 
                                    value={slot.end} 
                                    onChange={(e) => updateSlot(dayIndex, slotIndex, 'end', e.target.value)}
                                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                                  />
                                </div>
                                <button 
                                  onClick={() => removeSlot(dayIndex, slotIndex)}
                                  className="w-11 h-11 flex items-center justify-center bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl border border-slate-200 transition-all"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-400 font-bold py-2">No slots defined. Add one below.</p>
                          )
                        ) : (
                          <div className="py-2">
                             <span className="text-slate-400 font-black uppercase text-sm tracking-widest opacity-50">Unavailable</span>
                          </div>
                        )}
                        
                        {day.enabled && (
                          <button 
                            onClick={() => addSlot(dayIndex)}
                            className="flex items-center gap-2 text-blue-600 font-black text-sm hover:translate-x-1 transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            Add New Slot
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
             </div>
             <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-10 py-5 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                >
                   {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                   {saving ? "Saving Changes..." : "Save Schedule"}
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
