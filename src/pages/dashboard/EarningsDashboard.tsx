import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  Clock, 
  Calendar,
  Download,
  Filter,
  Loader2,
  Wallet
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  created_at: string;
  status: string;
}

export default function EarningsDashboard() {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    monthlyEarnings: 0,
    pendingPayout: 0,
    totalSessions: 0,
    growth: 12.5
  });

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.id) {
      fetchEarningsData();
    }
  }, [profile?.id]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      
      const { data: consultantData } = await supabase
        .from("consultants")
        .select("total_earnings, total_sessions")
        .eq("user_id", profile?.id)
        .maybeSingle();

      const { data: paymentsData } = await supabase
        .from("payments")
        .select("*")
        .eq("consultant_id", profile?.id)
        .order("created_at", { ascending: true });

      if (consultantData) {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const monthly = (paymentsData || [])
          .filter(p => {
             const d = new Date(p.created_at);
             return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
          })
          .reduce((sum, p) => sum + Number(p.amount), 0);

        setStats({
          totalEarnings: Number(consultantData.total_earnings) || 0,
          monthlyEarnings: monthly,
          pendingPayout: (paymentsData || [])
            .filter(p => p.status === "pending")
            .reduce((sum, p) => sum + Number(p.amount), 0),
          totalSessions: consultantData.total_sessions || 0,
          growth: 12.5 // Mock growth for UI
        });

        // Format chart data (Group by month for last 6 months)
        const last6Months = Array.from({ length: 6 }, (_, i) => {
           const d = new Date();
           d.setMonth(d.getMonth() - (5 - i));
           return {
              name: d.toLocaleString('default', { month: 'short' }),
              month: d.getMonth(),
              year: d.getFullYear(),
              amount: 0
           };
        });

        (paymentsData || []).forEach(p => {
           const d = new Date(p.created_at);
           const m = d.getMonth();
           const y = d.getFullYear();
           const point = last6Months.find(lp => lp.month === m && lp.year === y);
           if (point) {
              point.amount += Number(p.amount);
           }
        });

        setChartData(last6Months);
      }

      setTransactions((paymentsData || []).reverse().map(p => ({
        id: p.id,
        amount: p.amount,
        description: p.description || "Session Payment",
        created_at: p.created_at,
        status: p.status
      })));

    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Area */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center shadow-inner">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">Earnings Analytics</h1>
            <p className="text-slate-500 font-medium">Detailed breakdown of your professional revenue and growth.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 text-slate-600 px-8 py-5 rounded-2xl font-black transition-all">
              <Download className="w-5 h-5" />
              Statement
           </button>
           <button className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-5 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95">
              Withdraw Funds
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Total Revenue', value: stats.totalEarnings, icon: DollarSign, color: 'emerald', trend: '+12.5%', isCurrency: true },
          { label: 'This Month', value: stats.monthlyEarnings, icon: TrendingUp, color: 'blue', trend: '+8.2%', isCurrency: true },
          { label: 'Total Sessions', value: stats.totalSessions, icon: Users, color: 'indigo', trend: null, isCurrency: false },
          { label: 'Pending Clear', value: stats.pendingPayout, icon: Clock, color: 'orange', trend: null, isCurrency: true },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 hover:shadow-xl transition-all group">
             <div className="flex items-center justify-between">
                <div className={`w-14 h-14 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl flex items-center justify-center`}>
                   <stat.icon className="w-7 h-7" />
                </div>
                {stat.trend && (
                  <span className={`px-4 py-2 bg-${stat.color}-50 text-${stat.color}-600 rounded-full text-xs font-black italic`}>
                    {stat.trend}
                  </span>
                )}
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter">
                   {stat.isCurrency ? `$ ${stat.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : stat.value}
                </h3>
             </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 italic">Revenue Flow</h3>
                  <p className="text-slate-400 font-medium text-sm">Monthly income trend</p>
               </div>
               <div className="flex bg-slate-50 p-1.5 rounded-2xl">
                  {['6M', '1Y', 'ALL'].map(tab => (
                    <button key={tab} className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${tab === '6M' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{tab}</button>
                  ))}
               </div>
            </div>
            
            <div className="h-[400px] w-full mt-4">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                     <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                     <XAxis 
                       dataKey="name" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 800 }} 
                       dy={15}
                     />
                     <YAxis 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 800 }}
                       dx={-10}
                     />
                     <Tooltip 
                        contentStyle={{ 
                           backgroundColor: '#1e293b', 
                           border: 'none', 
                           borderRadius: '16px',
                           padding: '16px',
                           boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                        }}
                        itemStyle={{ color: '#fff', fontWeight: 900 }}
                        labelStyle={{ color: '#94a3b8', fontWeight: 800, marginBottom: '4px' }}
                     />
                     <Area 
                       type="monotone" 
                       dataKey="amount" 
                       stroke="#2563eb" 
                       strokeWidth={4} 
                       fillOpacity={1} 
                       fill="url(#colorAmount)" 
                     />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-white italic">Payment Tiers</h3>
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                     <Filter className="w-5 h-5 text-white" />
                  </div>
               </div>
               
               <div className="space-y-6">
                  {[
                     { label: 'Direct Calls', val: 65, color: '#3b82f6' },
                     { label: 'MegaSessions', val: 25, color: '#8b5cf6' },
                     { label: 'Memberships', val: 10, color: '#ec4899' },
                  ].map((item, i) => (
                    <div key={i} className="space-y-3">
                       <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                          <span>{item.label}</span>
                          <span className="text-white">{item.val}%</span>
                       </div>
                       <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 group-hover:opacity-100 opacity-80" 
                            style={{ width: `${item.val}%`, backgroundColor: item.color }} 
                          />
                       </div>
                    </div>
                  ))}
               </div>

               <div className="pt-8 mt-8 border-t border-white/5">
                  <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-between">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Withdrawal Limit</p>
                        <p className="text-xl font-black text-white italic mt-1">$ 5,000.00</p>
                     </div>
                     <button className="p-4 bg-white text-slate-900 rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
                        <ArrowUpRight className="w-6 h-6" />
                     </button>
                  </div>
               </div>
            </div>
            
            {/* Background Light */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-[100px]" />
         </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden mb-20 transition-all duration-500 hover:shadow-2xl">
        <div className="px-10 py-10 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
            <h3 className="text-2xl font-black text-slate-900 italic tracking-tight">Recent Transactions</h3>
            <p className="text-slate-400 font-medium text-sm mt-1">Real-time payment history and status tracking.</p>
           </div>
           <div className="flex gap-4">
              <div className="relative">
                 <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                 <input type="text" placeholder="Filter by date..." className="pl-12 pr-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-600 transition-all" />
              </div>
           </div>
        </div>
        <div className="overflow-x-auto overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white">
                <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Date</th>
                <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Description</th>
                <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-24 text-center">
                    <div className="max-w-xs mx-auto space-y-6">
                       <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-200">
                          <DollarSign className="w-10 h-10" />
                       </div>
                       <p className="text-slate-400 font-bold italic text-lg">Your transaction history is currently empty.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="group hover:bg-slate-50 transition-all duration-300">
                    <td className="px-10 py-8">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center font-black text-xs uppercase tracking-tighter">
                             {new Date(t.created_at).toLocaleString('default', { month: 'short' })}
                          </div>
                          <div>
                             <p className="font-black text-slate-900 italic">{new Date(t.created_at).toLocaleDateString()}</p>
                             <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-10 py-8">
                      <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{t.description}</p>
                    </td>
                    <td className="px-10 py-8">
                      <span className="text-xl font-black text-slate-900 italic tracking-tighter">$ {Number(t.amount).toFixed(2)}</span>
                    </td>
                    <td className="px-10 py-8 text-right">
                       <div className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        t.status === "completed" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-orange-50 text-orange-600 border border-orange-100"
                       }`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${t.status === 'completed' ? 'bg-emerald-500' : 'bg-orange-500'} animate-pulse`} />
                         {t.status}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
