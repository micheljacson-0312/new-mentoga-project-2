import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Course } from "@/types";
import { BookOpen, Plus, Trash2, Eye, Users, TrendingUp, X, Save, Edit, Image as ImageIcon, Upload } from "lucide-react";

export default function CourseLMS() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const emptyForm = { title: "", description: "", price: 0, category: "", level: "beginner" };
  const [formData, setFormData] = useState(emptyForm);
  const [editForm, setEditForm] = useState<Partial<Course>>({});

  useEffect(() => {
    if (profile?.id) fetchCourses();
  }, [profile?.id]);

  const fetchCourses = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("consultant_id", profile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCourses((data || []) as Course[]);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadThumbnail = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${profile?.id}/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('course-thumbnails').upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('course-thumbnails').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    try {
      setSaving(true);
      let thumbnailUrl = null;
      if (thumbnailFile) {
        thumbnailUrl = await uploadThumbnail(thumbnailFile);
      }

      const { error } = await supabase.from("courses").insert([{ consultant_id: profile.id, thumbnail_url: thumbnailUrl, ...formData }]).select();
      if (error) throw error;
      
      setFormData(emptyForm);
      setThumbnailFile(null);
      setShowCreateForm(false);
      fetchCourses();
    } catch (error: any) {
      alert(`Failed to create course: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCourse) return;
    setSaving(true);
    try {
      let thumbnailUrl = editForm.thumbnail_url;
      if (thumbnailFile) {
        thumbnailUrl = await uploadThumbnail(thumbnailFile);
      }

      const { error } = await supabase
        .from("courses")
        .update({
          title: editForm.title,
          description: editForm.description,
          price: editForm.price,
          category: editForm.category,
          level: editForm.level,
          is_published: editForm.is_published,
          thumbnail_url: thumbnailUrl
        })
        .eq("id", editingCourse.id);
      if (error) throw error;
      
      setEditingCourse(null);
      setThumbnailFile(null);
      fetchCourses();
    } catch (error: any) {
      alert(`Failed to save: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      const { error } = await supabase.from("courses").delete().eq("id", courseId);
      if (error) throw error;
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  if (profile?.role !== "consultant") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <p className="text-blue-900 font-medium">Only consultants can create courses</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* View Modal */}
      {viewingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setViewingCourse(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            {viewingCourse.thumbnail_url && (
              <img src={viewingCourse.thumbnail_url} alt={viewingCourse.title} className="w-full h-48 object-cover rounded-t-2xl" />
            )}
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold text-slate-900">{viewingCourse.title}</h2>
                {viewingCourse.is_published ? (
                  <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">Published</span>
                ) : (
                  <span className="bg-slate-100 text-slate-500 text-xs px-2.5 py-1 rounded-full font-medium">Draft</span>
                )}
              </div>
              {viewingCourse.category && <p className="text-sm text-blue-600 font-medium mb-2">{viewingCourse.category} · {viewingCourse.level}</p>}
              <p className="text-slate-600 text-sm leading-relaxed mb-4">{viewingCourse.description || "No description."}</p>
              <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-slate-900">${viewingCourse.price?.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">Price</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-slate-900">{viewingCourse.total_students}</p>
                  <p className="text-xs text-slate-500">Students</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-slate-900">${viewingCourse.total_earnings?.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">Earned</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Edit Course</h2>
              <button onClick={() => setEditingCourse(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Course Thumbnail</label>
                <div 
                  onClick={() => editFileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden"
                >
                  {thumbnailFile ? (
                    <div className="flex items-center gap-2 text-blue-600 font-medium px-4">
                      <ImageIcon className="w-5 h-5 shrink-0" />
                      <span className="truncate">{thumbnailFile.name}</span>
                    </div>
                  ) : editForm.thumbnail_url ? (
                    <img src={editForm.thumbnail_url} alt="Thumbnail preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-slate-500">
                      <Upload className="w-6 h-6 mb-2 text-slate-400" />
                      <span className="text-sm font-medium">Click to upload thumbnail</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={editFileInputRef}
                  onChange={(e) => {
                     if (e.target.files && e.target.files[0]) {
                       setThumbnailFile(e.target.files[0]);
                     }
                  }}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title || ""}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.price || 0}
                    onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={editForm.category || ""}
                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Level</label>
                <select
                  value={editForm.level || "beginner"}
                  onChange={e => setEditForm({ ...editForm, level: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  value={editForm.description || ""}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={!!editForm.is_published}
                  onChange={e => setEditForm({ ...editForm, is_published: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="is_published" className="text-sm font-bold text-slate-700">Published (visible on Creators)</label>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100">
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2.5 rounded-xl transition-all"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setEditingCourse(null)}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Courses</h1>
          <p className="text-slate-600 mt-1">Create and manage your online courses</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all"
        >
          <Plus className="w-4 h-4" />
          + Create Course
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Create New Course</h2>
          <form onSubmit={handleCreateCourse} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Course Thumbnail (Optional)</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden"
              >
                {thumbnailFile ? (
                  <div className="flex items-center gap-2 text-blue-600 font-medium px-4">
                    <ImageIcon className="w-6 h-6 shrink-0" />
                    <span className="truncate">{thumbnailFile.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-slate-500">
                    <Upload className="w-8 h-8 mb-2 text-slate-400" />
                    <span className="text-sm font-medium">Click to upload thumbnail</span>
                    <span className="text-xs mt-1 text-slate-400">16:9 ratio recommended</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                   if (e.target.files && e.target.files[0]) {
                     setThumbnailFile(e.target.files[0]);
                   }
                }}
                accept="image/*"
                className="hidden"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Course Title</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., Advanced JavaScript" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Price ($)</label>
                <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="99.99" step="0.01" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <input type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., Technology" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Level</label>
                <select value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Describe your course..." rows={4} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">Create Course</button>
              <button type="button" onClick={() => setShowCreateForm(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-6 py-2 rounded-lg font-medium">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-slate-50 rounded-lg p-12 text-center border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">No courses yet</p>
          <p className="text-slate-500 text-sm mt-1">Create your first course to start teaching</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
              {course.thumbnail_url ? (
                <img src={course.thumbnail_url} alt={course.title} className="w-full h-40 object-cover" />
              ) : (
                <div className="h-40 bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-white/60" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg text-slate-900 leading-tight">{course.title}</h3>
                  {course.is_published ? (
                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ml-2">Live</span>
                  ) : (
                    <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ml-2">Draft</span>
                  )}
                </div>
                {course.category && <p className="text-xs text-blue-600 font-medium mb-2">{course.category}</p>}
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{course.description}</p>
                <div className="space-y-1.5 mb-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Price</span>
                    <span className="font-bold text-slate-900">${course.price?.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{course.total_students} students</div>
                    <div className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />${course.total_earnings?.toFixed(2)} earned</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewingCourse(course)}
                    className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button
                    onClick={() => { setEditingCourse(course); setEditForm({ ...course }); }}
                    className="flex-1 border border-blue-200 hover:bg-blue-50 text-blue-700 font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="flex-1 border border-red-200 hover:bg-red-50 text-red-600 font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


