import { useState, useEffect } from 'react';
import { 
  Plus,
  Save, 
  TrendingUp,
  Tag,
  Zap,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function PricingManager() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [pricing, setPricing] = useState({
    hourly: 0,
    chat: 0,
    video: 0,
    trial: 0
  });

  const [discounts, setDiscounts] = useState([
    { id: '1', title: 'First Session', type: 'percentage', value: 20, active: true },
    { id: '2', title: 'Bulk Booking (5+)', type: 'fixed', value: 50, active: false }
  ]);

  useEffect(() => {
    if (profile?.id) {
      fetchPricing();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('consultants')
        .select('hourly_rate, chat_rate_per_minute, video_rate_per_minute, trial_fee')
        .eq('user_id', profile?.id)
        .single();

      if (error) throw error;

      if (data) {
        setPricing({
          hourly: data.hourly_rate || 0,
          chat: data.chat_rate_per_minute || 0,
          video: data.video_rate_per_minute || 0,
          trial: data.trial_fee || 0
        });
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
      setMessage({ type: 'error', text: 'Failed to load pricing' });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyChanges = async () => {
    if (!profile?.id) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('consultants')
        .update({
          hourly_rate: pricing.hourly,
          chat_rate_per_minute: pricing.chat,
          video_rate_per_minute: pricing.video,
          trial_fee: pricing.trial,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Pricing updated successfully!' });
    } catch (error: any) {
      console.error('Error updating pricing:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update pricing' });
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {message && (
        <div className={`fixed top-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="font-black text-sm">{message.text}</p>
        </div>
      )}

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pricing & Rates</h2>
          <p className="text-slate-500 font-medium mt-1">Set your session rates and manage special offers.</p>
        </div>
        <div className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-black flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Market Average: $120/hr
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Core Rates */}
        <div className="md:col-span-2 space-y-6">
           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden text-slate-900">
              <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
                 <h3 className="text-xl font-black text-slate-900">Standard Rates</h3>
              </div>
              <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Hourly Session</label>
                    <div className="relative group">
                       <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">$</span>
                       <input 
                        type="number" 
                        value={pricing.hourly}
                        onChange={(e) => setPricing(prev => ({ ...prev, hourly: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-12 pr-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-2xl text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all appearance-none"
                       />
                       <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">/ hour</span>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Paid Chat</label>
                    <div className="relative group">
                       <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">$</span>
                       <input 
                        type="number" 
                        step="0.1"
                        value={pricing.chat}
                        onChange={(e) => setPricing(prev => ({ ...prev, chat: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-12 pr-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-2xl text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all appearance-none"
                       />
                       <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">/ min</span>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Video Call</label>
                    <div className="relative group">
                       <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">$</span>
                       <input 
                        type="number" 
                        step="0.1"
                        value={pricing.video}
                        onChange={(e) => setPricing(prev => ({ ...prev, video: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-12 pr-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-2xl text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all appearance-none"
                       />
                       <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">/ min</span>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">15-Min Trial</label>
                    <div className="relative group">
                       <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">$</span>
                       <input 
                        type="number" 
                        value={pricing.trial}
                        onChange={(e) => setPricing(prev => ({ ...prev, trial: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-12 pr-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-2xl text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all appearance-none"
                       />
                       <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <span className="text-slate-400 font-bold">Fixed</span>
                          {pricing.trial === 0 && <span className="bg-green-100 text-green-600 text-[10px] px-2 py-0.5 rounded-full uppercase font-black">Free</span>}
                       </div>
                    </div>
                 </div>
              </div>
              <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex justify-end">
                 <button 
                  onClick={handleApplyChanges}
                  disabled={saving}
                  className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-10 py-5 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95 translate-y-0 active:translate-y-1"
                 >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {saving ? "Updating Rates..." : "Apply Changes"}
                 </button>
              </div>
           </div>
        </div>

        {/* Discounts & Offers */}
        <div className="space-y-6">
           <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                 <Zap className="w-5 h-5 text-blue-600" />
                 Active Offers
              </h3>
              <div className="space-y-4">
                 {discounts.map((discount) => (
                    <div key={discount.id} className={`p-5 rounded-2xl border-2 transition-all ${discount.active ? 'border-blue-600 bg-blue-50/20' : 'border-slate-50 opacity-60'}`}>
                       <div className="flex items-center justify-between mb-2">
                          <span className="font-black text-slate-900">{discount.title}</span>
                          <span className="bg-white text-blue-600 border border-blue-100 px-3 py-1 rounded-full text-xs font-black">
                             {discount.value}{discount.type === 'percentage' ? '%' : '$'} OFF
                          </span>
                       </div>
                       <div className="flex items-center justify-between mt-4">
                          <span className="text-xs font-bold text-slate-400">Status: {discount.active ? 'Active' : 'Paused'}</span>
                          <button 
                            className={`text-xs font-black uppercase tracking-widest ${discount.active ? 'text-red-500' : 'text-blue-600'}`}
                            onClick={() => {
                               const newD = [...discounts];
                               const d = newD.find(i => i.id === discount.id);
                               if (d) d.active = !d.active;
                               setDiscounts(newD);
                            }}
                          >
                             {discount.active ? 'Pause' : 'Activate'}
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
              <button className="w-full flex items-center justify-center gap-2 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black rounded-2xl border-2 border-dashed border-slate-200 transition-all">
                 <Plus className="w-4 h-4" />
                 Create New Offer
              </button>
           </div>

           <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl opacity-50" />
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                 <Tag className="w-6 h-6 text-blue-400" />
              </div>
              <h4 className="text-lg font-black mb-2 relative z-10">Smart Pricing</h4>
              <p className="text-slate-400 text-sm font-medium leading-relaxed relative z-10">
                 Enable automatic price adjustments based on demand and your current booking rate.
              </p>
              <button className="mt-8 w-full py-4 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl border border-white/10 transition-all relative z-10">
                 Learn More
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
