import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { EmailService } from "@/services/emailService";
import { Consultant } from "@/types";
import { Clock, AlertCircle, Loader, CalendarDays } from "lucide-react";

interface BookingPageProps {
  consultant: Consultant & { user?: any };
  serviceType: "chat" | "video_call" | "voice_call";
  onBack: () => void;
  onSuccess: () => void;
}

export default function BookingPage({
  consultant,
  serviceType,
  onBack,
  onSuccess,
}: BookingPageProps) {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState(15);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [dbSlots, setDbSlots] = useState<any[]>([]);
  const [generatedTimes, setGeneratedTimes] = useState<string[]>([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);

  useEffect(() => {
    const fetchSlots = async () => {
      setFetchingSlots(true);
      const consultantId = consultant.user?.id || consultant.id;
      const { data } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("consultant_id", consultantId);
      setDbSlots(data || []);
      setFetchingSlots(false);
    };
    fetchSlots();
  }, [consultant]);

  useEffect(() => {
    if (!selectedDate) {
      setGeneratedTimes([]);
      return;
    }

    const dayOfWeek = new Date(`${selectedDate}T00:00:00`).getDay();
    const overrideSlots = dbSlots.filter(s => s.specific_date === selectedDate);
    const applicableSlots = overrideSlots.length > 0 ? overrideSlots : dbSlots.filter(s => !s.specific_date && s.day_of_week === dayOfWeek);

    const times: string[] = [];

    const parseTime = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const formatTime = (mins: number) => {
      const h = Math.floor(mins / 60).toString().padStart(2, '0');
      const m = (mins % 60).toString().padStart(2, '0');
      return `${h}:${m}`;
    };

    applicableSlots.forEach(slot => {
      const start = parseTime(slot.start_time);
      const end = parseTime(slot.end_time);

      // Generate 15 minute intervals, ensuring the duration fits before the end time
      for (let i = start; i + duration <= end; i += 15) {
        times.push(formatTime(i));
      }
    });

    setGeneratedTimes(times.sort());
    setSelectedTime("");
  }, [selectedDate, dbSlots, duration]);

  const getRate = () => {
    switch (serviceType) {
      case "chat":
        return consultant.chat_rate_per_minute || 0;
      case "video_call":
        return consultant.video_rate_per_minute || 0;
      case "voice_call":
        return consultant.chat_rate_per_minute || 0;
      default:
        return 0;
    }
  };

  const calculateAmount = () => {
    const rate = getRate();
    return (rate * duration).toFixed(2);
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!selectedDate || !selectedTime) {
      setError("Please select a date and time slot");
      setLoading(false);
      return;
    }

    if (!profile?.id) {
      setError("You must be logged in to book");
      setLoading(false);
      return;
    }

    try {
      const amount = parseFloat(calculateAmount());

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert([
          {
            client_id: profile.id,
            consultant_id: consultant.user?.id || consultant.id,
            service_type: serviceType,
            scheduled_at: `${selectedDate}T${selectedTime}:00`,
            duration_minutes: duration,
            status: "pending",
            amount: amount,
            notes: notes,
          },
        ])
        .select()
        .single();

      if (bookingError) throw bookingError;

      const { error: paymentError } = await supabase.from("payments").insert([
        {
          booking_id: booking.id,
          user_id: profile.id, // Added user_id which is required
          amount: amount,
          currency: "USD",
          status: "pending",
        },
      ]);

      if (paymentError) {
        await supabase.from("bookings").delete().eq("id", booking.id);
        throw paymentError;
      }

      const formattedDate = new Date(selectedDate).toLocaleDateString();
      const formattedTime = new Date(`${selectedDate}T${selectedTime}`).toLocaleTimeString();

      const emailData = {
        bookingId: booking.id,
        consultantName: `${consultant.user?.first_name} ${consultant.user?.last_name}`,
        consultantEmail: consultant.user?.email || "",
        clientName: profile?.first_name || "Client",
        clientEmail: profile?.email || "",
        bookingDate: formattedDate,
        bookingTime: formattedTime,
        duration: duration,
        topic: notes || serviceType.replace("_", " "),
        amount: amount,
        currency: "USD",
        paymentStatus: "Pending",
      };

      try {
        await EmailService.sendBookingConfirmation(emailData);
        await EmailService.sendConsultantNotification(emailData);
      } catch (emailError) {
        console.error("Failed to send notification emails:", emailError);
      }

      onSuccess();
    } catch (err: any) {
      setError(
        err.message || "Failed to create booking. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onBack}
      />
      
      <div className="fixed inset-y-0 right-0 z-[60] w-full max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-slide-in-right">
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          .animate-slide-in-right {
            animation: slideInRight 300ms ease-out forwards;
          }
        `}</style>
        
        <div className="flex-none p-6 bg-white border-b border-slate-100 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 capitalize flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              Book {serviceType.replace("_", " ")}
            </h2>
            <p className="text-slate-500 text-sm mt-1">Schedule a session with {consultant.user?.first_name}</p>
          </div>
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center">
              <div>
                <p className="text-white/80 text-sm font-medium uppercase tracking-wider">Service Rate</p>
                <p className="text-2xl font-bold">${getRate().toFixed(2)}<span className="text-lg font-normal text-white/70">/min</span></p>
              </div>
              <CalendarDays className="w-8 h-8 text-white/30" />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleBook} className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
               <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    1. Select Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => {
                      setDuration(parseInt(e.target.value));
                      setSelectedTime("");
                    }}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
               </div>

               <div>
                 <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2 mt-4">
                   2. Select Date
                 </label>
                 <input
                   type="date"
                   value={selectedDate}
                   onChange={(e) => setSelectedDate(e.target.value)}
                   min={minDate}
                   max={maxDateStr}
                   className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50"
                   required
                 />
               </div>

               {selectedDate && (
                 <div className="pt-4 align-top">
                   <label className="block text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                     3. Select Time Block <span className="text-xs font-normal text-slate-500">(Consultant's local time)</span>
                   </label>
                   
                   {fetchingSlots ? (
                     <div className="flex items-center justify-center p-6 text-slate-400">
                        <Loader className="w-6 h-6 animate-spin" />
                     </div>
                   ) : generatedTimes.length > 0 ? (
                     <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                       {generatedTimes.map(time => (
                         <button
                           key={time}
                           type="button"
                           onClick={() => setSelectedTime(time)}
                           className={`py-2 px-2 text-sm rounded-lg border font-medium transition-all ${
                             selectedTime === time 
                               ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200" 
                               : "bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600"
                           }`}
                         >
                           {time}
                         </button>
                       ))}
                     </div>
                   ) : (
                     <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-slate-500 text-sm">
                        No availability slots fit the selected duration on this date. Try another date or a shorter duration.
                     </div>
                   )}
                 </div>
               )}
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Notes for Consultant (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Briefly describe what you'd like to discuss..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50 resize-none text-sm"
              />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Rate ({duration} mins)</span>
                <span className="font-medium text-slate-900">${getRate().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold border-t border-slate-100 pt-3">
                <span className="text-slate-900">Total Estimation</span>
                <span className="text-blue-600">${calculateAmount()}</span>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Platform fee (10%) calculated at final checkout
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedDate || !selectedTime}
              className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-300 disabled:text-slate-500 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg disabled:shadow-none"
            >
              {loading && <Loader className="w-5 h-5 animate-spin" />}
              {loading ? "Processing Booking..." : "Confirm & Request Booking"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
