import { 
  Download, 
  ExternalLink, 
  Play, 
  Calendar,
  Clock,
  Search,
  MoreVertical,
  Shield
} from 'lucide-react';

export default function RecordingManager() {
  const recordings = [
    { id: '1', title: 'Consultation with John Doe', date: 'Oct 12, 2023', duration: '58:20', size: '420 MB', type: 'Video Call' },
    { id: '2', title: 'Technical Architecture Review', date: 'Oct 10, 2023', duration: '45:15', size: '310 MB', type: 'Video Call' },
    { id: '3', title: 'Product Strategy Session', date: 'Oct 08, 2023', duration: '30:00', size: '210 MB', type: 'Video Call' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Recordings</h2>
          <p className="text-slate-500 font-medium mt-1">Access and manage your session video recordings.</p>
        </div>
        <div className="bg-orange-50 text-orange-600 px-6 py-3 rounded-2xl font-black flex items-center gap-3 border border-orange-100">
          <Shield className="w-5 h-5" />
          Auto-delete after 30 days
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search by title or date..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
              />
           </div>
        </div>

        <div className="overflow-x-auto">
           <table className="w-full">
              <thead>
                 <tr className="bg-slate-50/50 text-left border-b border-slate-50">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recording Name</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Size</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {recordings.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-all group">
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-sm">
                                <Play className="w-5 h-5 fill-current" />
                             </div>
                             <div>
                                <p className="font-black text-slate-900">{rec.title}</p>
                                <p className="text-xs font-bold text-slate-400 mt-0.5">{rec.type}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                             <Calendar className="w-4 h-4" />
                             {rec.date}
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                             <Clock className="w-4 h-4" />
                             {rec.duration}
                          </div>
                       </td>
                       <td className="px-8 py-6 text-slate-500 font-black text-sm">{rec.size}</td>
                       <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <button className="p-3 bg-white hover:bg-blue-600 text-slate-400 hover:text-white border border-slate-100 rounded-xl transition-all shadow-sm">
                                <Download className="w-4 h-4" />
                             </button>
                             <button className="p-3 bg-white hover:bg-blue-600 text-slate-400 hover:text-white border border-slate-100 rounded-xl transition-all shadow-sm">
                                <ExternalLink className="w-4 h-4" />
                             </button>
                             <button className="p-3 bg-white hover:bg-slate-50 text-slate-400 rounded-xl transition-all">
                                <MoreVertical className="w-4 h-4" />
                             </button>
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
