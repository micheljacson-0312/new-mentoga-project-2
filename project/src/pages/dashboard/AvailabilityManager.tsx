import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, Calendar as CalendarIcon, Plus, Trash2, Save, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface TimeSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  specific_date?: string | null;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function AvailabilityManager() {
  const { profile } = useAuth();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"weekly" | "specific">("weekly");

  useEffect(() => {
    if (profile?.id) {
      fetchAvailability();
    }
  }, [profile?.id]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("consultant_id", profile?.id)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      setSlots(data || []);
    } catch (error) {
      console.error("Error fetching availability:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = () => {
    const defaultDay = selectedDate ? selectedDate.getDay() : 1;
    const specificDateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null;

    const newSlot: any = {
      id: `temp-${crypto.randomUUID()}`,
      day_of_week: defaultDay,
      start_time: "09:00",
      end_time: "17:00",
      is_available: true,
      specific_date: viewMode === "specific" ? specificDateStr : null,
      consultant_id: profile?.id
    };
    setSlots([...slots, newSlot]);
  };

  const handleUpdateSlot = (id: string, updates: Partial<TimeSlot>) => {
    setSlots(slots.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleDeleteSlot = async (id: string) => {
    if (id.startsWith("temp-")) {
      setSlots(slots.filter(s => s.id !== id));
      return;
    }

    try {
      const { error } = await supabase.from("availability_slots").delete().eq("id", id);
      if (error) throw error;
      setSlots(slots.filter(s => s.id !== id));
      setMessage({ type: "success", text: "Slot deleted" });
    } catch (error) {
      console.error("Error deleting slot:", error);
      setMessage({ type: "error", text: "Failed to delete slot" });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const slotsToUpsert = slots.map(({ id, ...rest }) => ({
        id: id.startsWith("temp-") ? id.replace("temp-", "") : id,
        ...rest
      }));

      const { error } = await supabase
        .from("availability_slots")
        .upsert(slotsToUpsert)
        .select();

      if (error) throw error;

      setMessage({ type: "success", text: "Availability saved successfully!" });
      fetchAvailability();
    } catch (error: any) {
      console.error("Detailed error saving availability:", error);
      setMessage({ type: "error", text: `Failed to save availability: ${error.message || "Unknown error"}` });
    } finally {
      setSaving(false);
    }
  };

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Filter slots for current view
  const visibleSlots = slots.filter(slot => {
    if (viewMode === "weekly") {
      return !slot.specific_date; // Show only recurring slots
    } else {
      const selectedDateStr = selectedDate?.toISOString().split('T')[0];
      return slot.specific_date === selectedDateStr; // Show overrides for this specific date
    }
  });

  const overrideSlotsMap = slots.reduce((acc, slot) => {
    if (slot.specific_date) {
      acc[slot.specific_date] = true;
    }
    return acc;
  }, {} as Record<string, boolean>);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Availability Management</h1>
          <p className="text-slate-600 mt-1">Configure your weekly schedule or plan specific months</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAddSlot}
            disabled={viewMode === "specific" && !selectedDate}
            className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-900 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Slot
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {message.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="font-medium text-sm">{message.text}</p>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit mb-8">
        <button
          onClick={() => setViewMode("weekly")}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "weekly" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
        >
          Recurring Weekly Default
        </button>
        <button
          onClick={() => {
            setViewMode("specific");
            if (!selectedDate) setSelectedDate(new Date());
          }}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "specific" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
        >
          Full Month Calendar Overrides
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Calendar (Only visible in specific mode) */}
        {viewMode === "specific" && (
          <div className="lg:col-span-1 border border-slate-200 bg-white rounded-2xl shadow-sm p-6 max-h-fit">
            <div className="flex justify-between items-center mb-6">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h2 className="font-bold text-lg text-slate-900">
                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h2>
              <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-slate-400 py-1">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {blanks.map(blank => <div key={`blank-${blank}`} className="p-2" />)}
              {days.map(day => {
                const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const dateStr = dateObj.toISOString().split('T')[0];
                const isSelected = selectedDate?.toISOString().split('T')[0] === dateStr;
                const hasOverride = overrideSlotsMap[dateStr];
                
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateObj)}
                    className={`
                      aspect-square flex items-center justify-center rounded-full text-sm font-medium transition-all
                      ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-100 text-slate-700'}
                      ${hasOverride && !isSelected ? 'border-2 border-blue-400 relative' : ''}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-6 text-xs text-slate-500 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-blue-400"></div>
              <span>Has custom schedule override</span>
            </div>
          </div>
        )}

        {/* Right Column: Time Slots */}
        <div className={`border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden ${viewMode === "weekly" ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              {viewMode === "weekly" ? "Weekly Base Schedule" : (
                selectedDate ? `Override for ${selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}` : "Select a date to set overrides"
              )}
            </h3>
            {viewMode === "specific" && selectedDate && (
               <p className="text-sm text-slate-500 mt-1">Times set here will completely override your base schedule for this specific date.</p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white border-b border-slate-200">
                  {viewMode === "weekly" && <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Day</th>}
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Start Time</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">End Time</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleSlots.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600 font-medium">No slots configured</p>
                      <p className="text-slate-500 text-sm mt-1">
                        {viewMode === "weekly" ? "Add weekly recurring slots" : "Add an override slot for this date"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  visibleSlots.map((slot) => (
                    <tr key={slot.id} className="hover:bg-slate-50 transition-colors">
                      {viewMode === "weekly" && (
                        <td className="px-6 py-4">
                          <select
                            value={slot.day_of_week}
                            onChange={(e) => handleUpdateSlot(slot.id, { day_of_week: parseInt(e.target.value) })}
                            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          >
                            {DAYS.map((day, index) => (
                              <option key={day} value={index}>{day}</option>
                            ))}
                          </select>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="relative">
                          <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                          <input
                            type="time"
                            value={slot.start_time}
                            onChange={(e) => handleUpdateSlot(slot.id, { start_time: e.target.value })}
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full max-w-[160px]"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                          <input
                            type="time"
                            value={slot.end_time}
                            onChange={(e) => handleUpdateSlot(slot.id, { end_time: e.target.value })}
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full max-w-[160px]"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove slot"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
