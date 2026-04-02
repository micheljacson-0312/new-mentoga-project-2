import { useState } from 'react';
import { Star, Send, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ReviewFormProps {
  consultantId: string;
  bookingId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({ consultantId, bookingId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be signed in to leave a review');

      const { error: submitError } = await supabase
        .from('reviews')
        .insert([{
          consultant_id: consultantId,
          user_id: user.id,
          booking_id: bookingId,
          rating,
          comment
        }]);

      if (submitError) throw submitError;

      setSuccess(true);
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-50 border-2 border-emerald-100 p-10 rounded-[2.5rem] text-center space-y-4 animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
           <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-black text-emerald-900 italic">Thank You!</h3>
        <p className="text-emerald-700 font-medium">Your review has been submitted successfully.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl space-y-8 animate-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
      <div className="flex items-center justify-between relative z-10">
        <div>
           <h3 className="text-2xl font-black text-slate-900 tracking-tight italic">Write a Review</h3>
           <p className="text-slate-500 font-medium text-sm">How was your experience with this mentor?</p>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
        <div className="space-y-4">
           <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Your Rating</label>
           <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHoveredRating(i)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(i)}
                  className="transition-all duration-200 hover:scale-125"
                >
                  <Star 
                    className={`w-10 h-10 ${
                      i <= (hoveredRating || rating) 
                        ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm' 
                        : 'text-slate-100 fill-slate-50'
                    }`} 
                  />
                </button>
              ))}
           </div>
        </div>

        <div className="space-y-4">
           <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Your Feedback</label>
           <textarea
             rows={4}
             value={comment}
             onChange={(e) => setComment(e.target.value)}
             className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-50 rounded-[2rem] font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-300 resize-none"
             placeholder="What did you learn? Would you recommend them?"
           />
        </div>

        {error && (
          <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="w-full group relative flex items-center justify-center gap-3 py-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-[2rem] font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95 overflow-hidden"
        >
          {submitting ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              Submit My Review
              <Send className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>

      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/30 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-50/30 rounded-full -ml-16 -mb-16 blur-3xl pointer-events-none" />
    </div>
  );
}
