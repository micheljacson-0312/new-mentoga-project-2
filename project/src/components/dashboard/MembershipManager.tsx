import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Check 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface MembershipPackage {
  id: string;
  title: string;
  description: string;
  price: number;
  billing_cycle: string;
  features: string[];
  is_active: boolean;
}

export default function MembershipManager() {
  const { profile } = useAuth();
  const [packages, setPackages] = useState<MembershipPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [newPackage, setNewPackage] = useState<Partial<MembershipPackage>>({
    title: '',
    description: '',
    price: 199.99,
    billing_cycle: 'monthly',
    features: ['Private Chat Access', 'Priority Bookings'],
    is_active: true
  });

  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    if (profile?.id) {
      fetchPackages();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('membership_packages')
        .select('*')
        .eq('consultant_id', profile?.id)
        .order('price', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setMessage({ type: 'error', text: 'Failed to load packages' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!profile?.id || !newPackage.title) return;

    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('membership_packages')
        .insert([{
          ...newPackage,
          consultant_id: profile.id
        }])
        .select()
        .single();

      if (error) throw error;

      setPackages(prev => [...prev, data]);
      setIsAdding(false);
      setMessage({ type: 'success', text: 'Package created successfully!' });
      setNewPackage({
        title: '',
        description: '',
        price: 199.99,
        billing_cycle: 'monthly',
        features: ['Private Chat Access', 'Priority Bookings'],
        is_active: true
      });
    } catch (error: any) {
      console.error('Error creating package:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to create package' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;

    try {
      const { error } = await supabase
        .from('membership_packages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPackages(prev => prev.filter(p => p.id !== id));
      setMessage({ type: 'success', text: 'Package deleted successfully' });
    } catch (error) {
      console.error('Error deleting package:', error);
      setMessage({ type: 'error', text: 'Failed to delete' });
    }
  };

  const addFeature = () => {
    if (newFeature.trim() && !newPackage.features?.includes(newFeature.trim())) {
      setNewPackage(prev => ({
        ...prev,
        features: [...(prev.features || []), newFeature.trim()]
      }));
      setNewFeature('');
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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {message && (
        <div className={`fixed top-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="font-black text-sm">{message.text}</p>
        </div>
      )}

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center shadow-inner">
            <Shield className="w-8 h-8 fill-current" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Membership Packages</h2>
            <p className="text-slate-500 font-medium">Create exclusive subscription plans for your audience.</p>
          </div>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-5 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20"
          >
            <Plus className="w-5 h-5" />
            Launch New Tier
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-10 rounded-[3rem] border-2 border-indigo-600 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 italic">Package Details</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 font-black hover:text-red-500 transition-colors">Cancel</button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                 <div className="space-y-3">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Package Name</label>
                    <input 
                     type="text" 
                     value={newPackage.title}
                     onChange={(e) => setNewPackage(prev => ({ ...prev, title: e.target.value }))}
                     className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:border-indigo-600 outline-none"
                     placeholder="e.g. VIP Elite"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                       <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Price ($)</label>
                       <input 
                        type="number" 
                        value={newPackage.price}
                        onChange={(e) => setNewPackage(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:border-indigo-600 outline-none"
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Billing</label>
                       <select 
                        value={newPackage.billing_cycle}
                        onChange={(e) => setNewPackage(prev => ({ ...prev, billing_cycle: e.target.value }))}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900"
                       >
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="yearly">Yearly</option>
                       </select>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="space-y-3">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Included Features</label>
                    <div className="flex gap-2">
                       <input 
                        type="text" 
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                        className="flex-1 px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:border-indigo-600 outline-none"
                        placeholder="Add benefit..."
                       />
                       <button onClick={addFeature} className="p-4 bg-indigo-600 text-white rounded-2xl">
                          <Plus className="w-6 h-6" />
                       </button>
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="flex justify-end pt-8">
              <button onClick={handleCreate} disabled={saving} className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black shadow-xl shadow-indigo-600/20 active:scale-95">
                 {saving ? "Launching..." : "Launch Tier"}
              </button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl transition-all flex flex-col">
             <div className="flex justify-between items-start mb-6">
                <h4 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">{pkg.title}</h4>
                <button onClick={() => handleDelete(pkg.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
             </div>
             <div className="text-4xl font-black text-slate-900 mb-8 italic">$ {pkg.price} <span className="text-xs uppercase text-slate-400 not-italic">/ {pkg.billing_cycle}</span></div>
             <div className="flex-1 space-y-4 mb-8">
                {pkg.features.map(f => (
                   <div key={f} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{f}</span>
                   </div>
                ))}
             </div>
             <button className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all">Manage Members</button>
          </div>
        ))}
      </div>
    </div>
  );
}
