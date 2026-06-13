import { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  MapPin, 
  Globe, 
  Camera, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Tag,
  Plus,
  Trash2,
  Briefcase
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileEditor() {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    bio: '',
    location: '',
    profile_image_url: '',
    expertise_tags: [] as string[],
    years_of_experience: 0,
    languages: [] as string[]
  });

  const [newTag, setNewTag] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  useEffect(() => {
    if (profile?.id) {
      fetchProfileDetails();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchProfileDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch both user_profile and consultant details
      const { data: consultant, error: consultantError } = await supabase
        .from('consultants')
        .select('*')
        .eq('user_id', profile?.id)
        .single();

      if (consultantError && consultantError.code !== 'PGRST116') throw consultantError;

      setFormData({
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        email: profile?.email || '',
        bio: profile?.bio || '',
        location: profile?.location || '',
        profile_image_url: profile?.profile_image_url || '',
        expertise_tags: consultant?.expertise_tags || [],
        years_of_experience: consultant?.years_of_experience || 0,
        languages: consultant?.languages || []
      });

    } catch (error) {
      console.error('Error fetching profile details:', error);
      setMessage({ type: 'error', text: 'Failed to load profile details' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    try {
      setSaving(true);
      
      // 1. Update user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          bio: formData.bio,
          location: formData.location,
          profile_image_url: formData.profile_image_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // 2. Update consultants
      const { error: consultantError } = await supabase
        .from('consultants')
        .update({
          expertise_tags: formData.expertise_tags,
          years_of_experience: formData.years_of_experience,
          languages: formData.languages,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.id);

      if (consultantError) throw consultantError;

      await refreshProfile();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.expertise_tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        expertise_tags: [...prev.expertise_tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      expertise_tags: prev.expertise_tags.filter(t => t !== tag)
    }));
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }));
      setNewLanguage('');
    }
  };

  const removeLanguage = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== lang)
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      {message && (
        <div className={`fixed top-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="font-black text-sm">{message.text}</p>
        </div>
      )}

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-10">
         <div className="relative group">
            <div className="w-40 h-40 rounded-[2.5rem] bg-blue-50 overflow-hidden border-4 border-white shadow-xl group-hover:opacity-80 transition-opacity">
               {formData.profile_image_url ? (
                  <img src={formData.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                  <div className="w-full h-full flex items-center justify-center text-blue-600 text-6xl font-black">
                     {formData.first_name[0]}
                  </div>
               )}
            </div>
            <button className="absolute -bottom-4 -right-4 w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95">
               <Camera className="w-6 h-6" />
            </button>
         </div>
         <div className="flex-1 space-y-2">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight italic">Public Profile</h2>
            <p className="text-slate-500 font-medium text-lg">Manage how you appear to your fans and potential clients.</p>
            <div className="flex items-center gap-2 text-emerald-500 font-black text-sm uppercase tracking-widest bg-emerald-50 w-fit px-4 py-1 rounded-full mt-4">
               <CheckCircle2 className="w-4 h-4" />
               Verified Consultant
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Personal Info */}
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
               <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                     <User className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 italic">Personal Information</h3>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                     <input 
                        type="text" 
                        value={formData.first_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:border-blue-600 focus:bg-white transition-all outline-none"
                        placeholder="e.g. John"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                     <input 
                        type="text" 
                        value={formData.last_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:border-blue-600 focus:bg-white transition-all outline-none"
                        placeholder="e.g. Doe"
                     />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address (Private)</label>
                     <div className="relative">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                           type="email" 
                           value={formData.email}
                           disabled
                           className="w-full pl-16 pr-6 py-4 bg-slate-100 border-2 border-transparent rounded-2xl font-bold text-slate-400 cursor-not-allowed"
                        />
                     </div>
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
                     <div className="relative">
                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                           type="text" 
                           value={formData.location}
                           onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                           className="w-full pl-16 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:border-blue-600 focus:bg-white transition-all outline-none"
                           placeholder="e.g. Dubai, UAE"
                        />
                     </div>
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional Bio</label>
                     <textarea 
                        rows={5}
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:border-blue-600 focus:bg-white transition-all outline-none resize-none"
                        placeholder="Tell your fans about your expertise and how you can help them..."
                     />
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
               <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                     <Briefcase className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 italic">Expertise & Experience</h3>
               </div>

               <div className="space-y-6">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Years of Experience</label>
                     <input 
                        type="number" 
                        value={formData.years_of_experience}
                        onChange={(e) => setFormData(prev => ({ ...prev, years_of_experience: parseInt(e.target.value) || 0 }))}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:border-blue-600 focus:bg-white transition-all outline-none"
                     />
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expertise Tags</label>
                     <div className="flex flex-wrap gap-2 mb-4">
                        {formData.expertise_tags.map(tag => (
                           <span key={tag} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-black flex items-center gap-2 group">
                              {tag}
                              <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                                 <Trash2 className="w-3.5 h-3.5" />
                              </button>
                           </span>
                        ))}
                     </div>
                     <div className="flex gap-3">
                        <div className="relative flex-1">
                           <Tag className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                           <input 
                              type="text" 
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addTag()}
                              className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:border-blue-600 focus:bg-white transition-all outline-none"
                              placeholder="e.g. Digital Marketing"
                           />
                        </div>
                        <button onClick={addTag} className="px-6 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all">
                           <Plus className="w-5 h-5" />
                        </button>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Languages</label>
                     <div className="flex flex-wrap gap-2 mb-4">
                        {formData.languages.map(lang => (
                           <span key={lang} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-black flex items-center gap-2 group">
                              {lang}
                              <button onClick={() => removeLanguage(lang)} className="hover:text-red-500">
                                 <Trash2 className="w-3.5 h-3.5" />
                              </button>
                           </span>
                        ))}
                     </div>
                     <div className="flex gap-3">
                        <div className="relative flex-1">
                           <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                           <input 
                              type="text" 
                              value={newLanguage}
                              onChange={(e) => setNewLanguage(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
                              className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:border-blue-600 focus:bg-white transition-all outline-none"
                              placeholder="e.g. English"
                           />
                        </div>
                        <button onClick={addLanguage} className="px-6 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all">
                           <Plus className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Sidebar / Actions */}
         <div className="space-y-8">
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-8 sticky top-8">
               <h3 className="text-2xl font-black italic tracking-tight">Save Changes</h3>
               <p className="text-slate-400 font-medium">Any changes you make here will be reflected on your public profile immediately.</p>
               
               <div className="space-y-4 pt-4 border-t border-white/10">
                  <button 
                     onClick={handleSave}
                     disabled={saving}
                     className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white py-5 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                  >
                     {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                     {saving ? "Saving Profile..." : "Publish Updates"}
                  </button>
                  <button className="w-full py-4 text-slate-500 font-black uppercase text-xs tracking-widest hover:text-white transition-colors">
                     Discard Changes
                  </button>
               </div>

               <div className="pt-8 border-t border-white/10 space-y-4">
                  <div className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                     <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                     Profile Completion: 85%
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                     <div className="w-[85%] h-full bg-blue-600 rounded-full" />
                  </div>
               </div>
            </div>
            
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
               <div className="flex items-center gap-2 text-amber-500 mb-4">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-black text-xs uppercase tracking-widest">Privacy Tip</span>
               </div>
               <p className="text-slate-500 text-xs font-medium leading-relaxed">
                  Your email and phone number are never shared publicly. They are only used for booking confirmations and notifications.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
