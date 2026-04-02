import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";

interface LoginPageProps {
  onSwitchToSignup: () => void;
  onBackToCreators?: () => void;
}

export default function LoginPage({ onSwitchToSignup, onBackToCreators }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to sign in. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="text-center lg:text-left">
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Sign In</h1>
          <p className="text-slate-500 font-bold text-sm">Sign in to your Mentoga account</p>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 border border-red-100 rounded-[2rem] flex items-center gap-3 text-red-600 text-sm font-bold animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="group relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-16 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-[2rem] font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-300 text-sm"
                placeholder="Email address"
                required
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200">
                  <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center font-bold text-[10px]">i</div>
               </div>
            </div>

            <div className="group relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-16 pr-14 py-4 bg-slate-50 border-2 border-slate-50 rounded-[2rem] font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-300 text-sm"
                placeholder="Password"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end px-2">
            <button type="button" className="text-sm font-black text-slate-900 border-b-2 border-transparent hover:border-blue-600 transition-all italic">
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[2rem] transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50 text-sm"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-xs font-black text-slate-300 uppercase tracking-widest bg-white px-4">
            Or Sign In With
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
            {['google', 'facebook', 'apple'].map((platform) => (
              <button key={platform} className="flex justify-center py-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors group">
                <img 
                  src={`https://www.vectorlogo.zone/logos/${platform}/${platform}-icon.svg`} 
                  alt={platform} 
                  className="w-5 h-5 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all"
                />
              </button>
            ))}
          </div>

        <div className="text-center space-y-4">
          <p className="text-slate-400 font-bold">Don't have an account?</p>
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={onSwitchToSignup}
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-10 py-3 rounded-full font-black text-sm hover:bg-black transition-all active:scale-95 shadow-lg shadow-black/20"
            >
              Sign Up
            </button>
            {onBackToCreators && (
              <button
                onClick={onBackToCreators}
                className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
               >
                ← Back to Creators
              </button>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
