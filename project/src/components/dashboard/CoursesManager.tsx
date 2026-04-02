import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Star,
  Eye,
  Edit,
  Trash2,
  Image as ImageIcon,
  Upload,
  X,
  ChevronRight
} from 'lucide-react';
import { useState, useRef } from 'react';

export default function CoursesManager() {
  const [courses, setCourses] = useState([
    { id: '1', title: 'Mastering React Design Patterns', price: 49.99, students: 128, rating: 4.9, status: 'Published', thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop' },
    { id: '2', title: 'Advanced Tailwind CSS Techniques', price: 34.99, students: 85, rating: 4.7, status: 'Draft', thumbnail: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&h=250&fit=crop' },
    { id: '3', title: 'Building Scalable APIs with Node.js', price: 59.99, students: 210, rating: 4.8, status: 'Published', thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop' }
  ]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    price: '',
    description: '',
    thumbnail: null as string | null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCourse({ ...newCourse, thumbnail: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Courses</h2>
          <p className="text-slate-500 font-medium mt-1">Create and manage your digital learning content.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95"
        >
           <Plus className="w-5 h-5" />
           Create New Course
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search courses..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
              />
           </div>
           <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-600 transition-all">
                 <Filter className="w-4 h-4" />
                 All Status
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
           {courses.map((course) => (
             <div key={course.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/20 overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                <div className="h-48 relative overflow-hidden bg-slate-100">
                   <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                   <div className="absolute top-4 right-4">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${course.status === 'Published' ? 'bg-green-500 text-white' : 'bg-slate-900 text-white'}`}>
                        {course.status}
                      </span>
                   </div>
                </div>
                <div className="p-6 space-y-4">
                   <h3 className="text-lg font-black text-slate-900 leading-tight line-clamp-2">{course.title}</h3>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-black text-slate-900">{course.rating}</span>
                         </div>
                         <div className="flex items-center gap-1 text-slate-400">
                            <Users className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">{course.students}</span>
                         </div>
                      </div>
                      <p className="text-xl font-black text-blue-600">${course.price}</p>
                   </div>
                   <div className="pt-4 border-t border-slate-50 flex items-center justify-between gap-2">
                      <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all">
                         <Edit className="w-4 h-4" />
                         <span className="text-xs font-black uppercase tracking-widest">Edit</span>
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all">
                         <Eye className="w-4 h-4" />
                         <span className="text-xs font-black uppercase tracking-widest">View</span>
                      </button>
                      <button className="p-3 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all">
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>
      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Create New Course</h3>
                <p className="text-slate-400 text-sm font-medium mt-1">Fill in the details to launch your expertise.</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-3 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-2xl border border-slate-100 transition-all active:scale-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
              {/* Thumbnail Upload Section */}
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Course Thumbnail</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative h-64 rounded-[2.5rem] border-4 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group overflow-hidden ${
                    newCourse.thumbnail 
                      ? 'border-blue-600 bg-blue-50/30' 
                      : 'border-slate-100 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/30'
                  }`}
                >
                  {newCourse.thumbnail ? (
                    <>
                      <img src={newCourse.thumbnail} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <div className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-black shadow-xl flex items-center gap-2">
                           <Upload className="w-5 h-5" />
                           Change Image
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                      <div className="text-center">
                        <p className="text-slate-900 font-black">Upload a beautiful thumbnail</p>
                        <p className="text-slate-400 text-sm font-medium">Recommended: 1200x800px (JPG, PNG)</p>
                      </div>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                  />
                </div>
              </div>

              {/* Title and Price */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Course Title</label>
                  <input 
                    type="text"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    placeholder="e.g. Masterclass in Brand Design"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Price ($)</label>
                  <input 
                    type="number"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })}
                    placeholder="49.99"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">About the Course</label>
                <textarea 
                  rows={4}
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="What will your students learn?"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="p-10 bg-slate-50/50 border-t border-slate-50 flex gap-4">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-8 py-5 bg-white text-slate-500 font-black rounded-2xl border border-slate-100 hover:bg-slate-50 shadow-sm transition-all active:scale-95"
              >
                Discard
              </button>
              <button 
                onClick={() => {
                  const id = (courses.length + 1).toString();
                  setCourses([...courses, {
                    id,
                    title: newCourse.title || 'Untitled Course',
                    price: parseFloat(newCourse.price) || 0,
                    students: 0,
                    rating: 0,
                    status: 'Draft',
                    thumbnail: newCourse.thumbnail || 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&h=250&fit=crop'
                  }]);
                  setShowCreateModal(false);
                  setNewCourse({ title: '', price: '', description: '', thumbnail: null });
                }}
                className="flex-[2] flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-5 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/30 active:scale-95 group"
              >
                Create Course
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
