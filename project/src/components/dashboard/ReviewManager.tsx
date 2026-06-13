import { useState, useEffect } from 'react';
import { 
  Star, 
  ThumbsUp, 
  Filter,
  Search,
  MessageCircle,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_profiles: {
    first_name: string;
    last_name: string;
    profile_image_url: string | null;
  };
}

export default function ReviewManager() {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ average: 0, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (profile?.id) {
      fetchReviews();
    }
  }, [profile?.id]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_profiles!reviews_user_id_fkey (
            first_name,
            last_name,
            profile_image_url
          )
        `)
        .eq('consultant_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map((r: any) => ({
        ...r,
        user_profiles: r.user_profiles || { first_name: 'Anonymous', last_name: '', profile_image_url: null }
      }));

      setReviews(formattedData);

      // Calculate stats
      if (formattedData.length > 0) {
        const total = formattedData.length;
        const avg = formattedData.reduce((acc, curr) => acc + curr.rating, 0) / total;
        setStats({ average: parseFloat(avg.toFixed(1)), total });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter(r => 
    r.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${r.user_profiles.first_name} ${r.user_profiles.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center shadow-inner">
              <Star className="w-8 h-8 fill-current" />
           </div>
           <div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Client Reviews</h2>
             <p className="text-slate-500 font-medium mt-1">Manage your feedback and build your professional reputation.</p>
           </div>
        </div>
        <div className="flex items-center gap-8">
           <div className="text-center">
              <p className="text-4xl font-black text-slate-900 italic">{stats.average}</p>
              <div className="flex items-center gap-1 justify-center mt-1">
                 {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(stats.average) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                 ))}
              </div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-3">Rating Score</p>
           </div>
           <div className="w-px h-16 bg-slate-100" />
           <div className="text-center">
              <p className="text-4xl font-black text-slate-900 italic">{stats.total}</p>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-5">Verified Reviews</p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search reviews..."
                className="w-full pl-11 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-blue-600 transition-all placeholder:text-slate-300"
              />
           </div>
           <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-6 py-4 bg-white hover:bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-600 transition-all">
                 <Filter className="w-4 h-4" />
                 Latest
              </button>
           </div>
        </div>

        <div className="divide-y divide-slate-50">
           {filteredReviews.length === 0 ? (
             <div className="p-20 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-slate-200 mx-auto" />
                <p className="text-slate-400 font-bold italic text-xl">No reviews found matching your search.</p>
             </div>
           ) : filteredReviews.map((review) => (
             <div key={review.id} className="p-8 hover:bg-slate-50/50 transition-all group">
                <div className="flex flex-col md:flex-row gap-8">
                   <div className="w-20 h-20 rounded-[2rem] bg-slate-100 border-4 border-white shadow-xl overflow-hidden shrink-0 flex items-center justify-center">
                      {review.user_profiles.profile_image_url ? (
                        <img src={review.user_profiles.profile_image_url} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-black text-slate-400 uppercase">{review.user_profiles.first_name[0]}</span>
                      )}
                   </div>
                   <div className="flex-1 space-y-6">
                      <div className="flex items-start justify-between">
                         <div className="space-y-1">
                            <h4 className="text-xl font-black text-slate-900 italic tracking-tight uppercase">{review.user_profiles.first_name} {review.user_profiles.last_name}</h4>
                            <div className="flex items-center gap-4">
                               <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map(i => (
                                    <Star key={i} className={`w-3.5 h-3.5 ${i <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-100'}`} />
                                  ))}
                               </div>
                               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5" />
                                  {new Date(review.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                               </span>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <button className="p-3.5 bg-white text-slate-300 hover:text-blue-600 border border-slate-100 rounded-2xl transition-all hover:shadow-lg">
                               <ThumbsUp className="w-4.5 h-4.5" />
                            </button>
                            <button className="p-3.5 bg-white text-slate-300 hover:text-blue-600 border border-slate-100 rounded-2xl transition-all hover:shadow-lg">
                               <MessageCircle className="w-4.5 h-4.5" />
                            </button>
                         </div>
                      </div>
                      <div className="p-8 bg-slate-50 border border-slate-100/50 rounded-[2.5rem] group-hover:bg-white transition-all duration-300">
                         <p className="text-slate-600 font-medium leading-relaxed italic text-lg">
                            "{review.comment}"
                         </p>
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
