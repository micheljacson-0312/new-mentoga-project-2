import { 
  Users, 
  TrendingUp, 
  Copy, 
  DollarSign, 
  Gift,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';

export default function PeerProfit() {
  const referrals = [
    { id: '1', name: 'Zeeshan Ahmed', date: 'Oct 12, 2023', status: 'Active', commission: '$45.00' },
    { id: '2', name: 'Sarah Khan', date: 'Oct 10, 2023', status: 'Pending', commission: '$0.00' },
    { id: '3', name: 'Bilal Malik', date: 'Oct 08, 2023', status: 'Active', commission: '$30.00' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">PeerProfit</h2>
          <p className="text-slate-500 font-medium mt-1">Earn 10% commission for every consultant you refer to Mentoga.</p>
        </div>
        <div className="flex items-center gap-4 bg-blue-50/50 p-2 rounded-2xl border border-blue-100">
           <div className="px-5 py-3 bg-white border border-blue-100 rounded-xl font-black text-blue-600 shadow-sm">
              REF-8291-XT
           </div>
           <button className="p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:scale-105 transition-all">
              <Copy className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-blue-200 transition-all">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <Users className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Referrals</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2">12</h3>
         </div>
         <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-green-200 transition-all">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <DollarSign className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commission Earned</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2">$840.50</h3>
         </div>
         <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-orange-200 transition-all">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg. Monthly</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2">$120.00</h3>
         </div>
         <div className="bg-blue-600 p-8 rounded-[2rem] shadow-xl shadow-blue-600/20 text-white relative overflow-hidden group">
            <Gift className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-all" />
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Reward Level</p>
            <h3 className="text-2xl font-black text-white mt-2">Platinum Partner</h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold bg-white/10 w-fit px-3 py-1 rounded-full border border-white/20">
               Next Milestone at $1,000
            </div>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
           <h3 className="text-xl font-black text-slate-900 italic">Referral Network</h3>
           <button className="text-blue-600 font-black text-sm flex items-center gap-2 hover:underline">
              View All <ArrowUpRight className="w-4 h-4" />
           </button>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full">
              <thead>
                 <tr className="bg-slate-50/50 text-left border-b border-slate-50">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultant Name</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined On</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Commission</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Progress</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {referrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-slate-50/50 transition-all">
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-500">
                                {ref.name[0]}
                             </div>
                             <p className="font-black text-slate-900">{ref.name}</p>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-slate-500 font-bold text-sm tracking-tight">{ref.date}</td>
                       <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${ref.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                             {ref.status}
                          </span>
                       </td>
                       <td className="px-8 py-6 font-black text-slate-900">{ref.commission}</td>
                       <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end">
                             {ref.status === 'Active' ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                             ) : (
                                <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center">
                                   <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse" />
                                </div>
                             )}
                          </div>
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
