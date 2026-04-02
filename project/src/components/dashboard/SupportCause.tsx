import { useState } from 'react';
import { 
  Heart, 
  ExternalLink, 
  Edit2
} from 'lucide-react';

export default function SupportCause() {
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Support a Cause</h2>
          <p className="text-slate-500 font-medium mt-1">Donate a percentage of your earnings to an organization you believe in.</p>
        </div>
        <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 rounded-2xl border border-slate-100">
           <span className="font-black text-slate-900 text-sm">Active</span>
           <div className={`w-12 h-6 rounded-full relative transition-all ${enabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${enabled ? 'left-7' : 'left-1'}`} />
           </div>
           <input type="checkbox" className="hidden" checked={enabled} onChange={() => setEnabled(!enabled)} />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8">
                 <div className="flex items-start gap-8">
                    <div className="w-32 h-32 rounded-[2rem] bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border-2 border-white shadow-xl">
                       <img src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=400&fit=crop" alt="Charity" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-4">
                       <div className="flex items-center justify-between">
                          <h3 className="text-2xl font-black text-slate-900 italic">Save the Children</h3>
                          <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-black">Verified Organization</span>
                       </div>
                       <p className="text-slate-500 font-medium leading-relaxed">
                          Helping children in need through education, health care, and disaster relief. Currently focusing on the flood relief programs in Asia.
                       </p>
                       <div className="flex items-center gap-4">
                          <button className="flex items-center gap-2 text-blue-600 font-black text-sm hover:underline">
                             <ExternalLink className="w-4 h-4" />
                             Visit Website
                          </button>
                          <button className="flex items-center gap-2 text-slate-400 font-black text-sm hover:text-slate-600">
                             <Edit2 className="w-4 h-4" />
                             Change Organization
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="px-8 py-10 bg-slate-50/50 border-t border-slate-50">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Donation Percentage</label>
                       <div className="relative">
                          <input 
                            type="number" 
                            defaultValue={10}
                            className="w-full px-6 py-5 bg-white border-2 border-slate-100 rounded-2xl font-black text-2xl text-slate-900 outline-none focus:border-blue-600 transition-all"
                          />
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">%</span>
                       </div>
                    </div>
                    <div className="flex flex-col justify-end">
                       <p className="text-sm text-slate-400 font-medium mb-4">You've donated <span className="text-slate-900 font-black text-lg">$1,240</span> this year.</p>
                       <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                          <div className="w-[60%] h-full bg-blue-600 rounded-full transition-all" />
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-600/20">
              <Heart className="w-10 h-10 text-white fill-white/20 mb-6" />
              <h4 className="text-xl font-black mb-2 tracking-tight italic">Be the Change</h4>
              <p className="text-blue-100 text-sm font-medium leading-relaxed">
                 Displaying your support on your profile increases trust and client engagement by up to 24%.
              </p>
              <button className="mt-8 w-full py-4 bg-white text-blue-600 font-black rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95">
                 Share on Profile
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
