import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, AlertCircle, Loader2, User, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";

interface SignupPageProps {
  onSwitchToLogin: () => void;
  onBackToCreators?: () => void;
}

export default function SignupPage({ onSwitchToLogin, onBackToCreators }: SignupPageProps) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  
  const { signUp, checkEmailExists } = useAuth();
  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    let interval: any;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const exists = await checkEmailExists(email);
      if (exists) {
        setError("This email is already registered. Please sign in instead.");
        setLoading(false);
        return;
      }
      
      // Simulate sending OTP
      console.log("OTP sent to:", email);
      setStep(2);
      setTimer(30);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const fullName = firstName.trim(); // We'll just use firstName field as "Full Name" based on mockup
    if (!fullName) {
      setError("Please enter your name");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (otp.some(digit => !digit)) {
      setError("Please enter the 4-digit code sent to your email");
      return;
    }

    setLoading(true);

    try {
      // In a real app, we'd verify OTP here
      // Splitting name for existing signUp function
      const parts = fullName.split(" ");
      const fName = parts[0];
      const lName = parts.slice(1).join(" ") || "-";
      
      await signUp(email, password, fName, lName);
      // Redirect/Success handled by AuthContext state change or success state
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  if (step === 1) {
    return (
      <AuthLayout activeStep={1}>
        <div className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 tracking-tight">Create Account</h1>
            <p className="text-slate-500 font-bold text-sm">Join the Mentoga community today</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <button className="flex items-center justify-center gap-3 py-3 border-2 border-slate-50 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm">
                <img src="https://www.vectorlogo.zone/logos/google/google-icon.svg" className="w-5 h-5" alt="Google" />
                Google
             </button>
             <button className="flex items-center justify-center gap-3 py-3 border-2 border-slate-50 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm">
                <img src="https://www.vectorlogo.zone/logos/facebook/facebook-icon.svg" className="w-5 h-5" alt="Facebook" />
                Facebook
             </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] bg-white px-4">
              Or Register With Email
            </div>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="group relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-16 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-[2rem] font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-300 text-sm"
                placeholder="Enter your email"
                required
              />
            </div>
            {error && (
                <div className="px-6 py-3 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-2 text-red-600 text-sm font-bold animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[2rem] transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50 text-sm"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="text-center space-y-4">
            <p className="text-slate-400 font-bold">Already have an account?</p>
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={onSwitchToLogin}
                className="bg-slate-900 text-white px-8 py-3 rounded-full font-black text-sm hover:bg-black transition-all active:scale-95"
              >
                Sign In
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

  const getPasswordStrength = () => {
    if (!password) return { label: "", color: "bg-slate-100" };
    if (password.length < 6) return { label: "Weak", color: "bg-red-500" };
    if (password.length < 10) return { label: "Medium", color: "bg-yellow-500" };
    return { label: "Strong", color: "bg-green-500" };
  };

  const strength = getPasswordStrength();

  return (
    <AuthLayout activeStep={2}>
      <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-700">
        <div className="text-center lg:text-left">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 tracking-tight">Almost There!</h1>
          <p className="text-slate-500 font-bold text-sm break-all sm:break-normal">Complete your profile for {email}</p>
        </div>

        <form onSubmit={handleFinalSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="group relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full pl-16 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-[2rem] font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-300 text-sm"
                placeholder="Full Name"
                required
              />
               <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200">
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
                placeholder="Create Password"
                required
              />
               <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
               >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
               </button>
            </div>

            {password && (
               <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password Strength: <span className={strength.label === "Strong" ? "text-blue-600" : "text-slate-900"}>{strength.label}</span></span>
                     {strength.label === "Strong" && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className={`h-full transition-all duration-500 ${strength.color}`} style={{ width: strength.label === "Weak" ? "33%" : strength.label === "Medium" ? "66%" : "100%" }} />
                  </div>
               </div>
            )}
          </div>

          <div className="bg-blue-50/50 p-4 sm:p-6 rounded-[2rem] border-2 border-dashed border-blue-100">
            <div className="text-center mb-4">
              <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Verify Email</p>
              <p className="text-slate-400 text-[10px] font-bold">Enter the 4-digit code sent to your inbox</p>
            </div>
            <div className="flex justify-center gap-2 sm:gap-3">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={otpRefs[i]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-11 sm:w-12 h-14 bg-white border-2 border-blue-100 rounded-2xl text-center text-xl font-black text-blue-600 focus:border-blue-600 outline-none transition-all shadow-sm"
                  placeholder="•"
                />
              ))}
            </div>
            <div className="text-blue-600 font-bold text-sm text-center mt-4">
              {timer > 0 ? (
                `00:${timer.toString().padStart(2, '0')}`
              ) : (
                <button type="button" onClick={() => setTimer(30)} className="hover:underline">Resend Code</button>
              )}
            </div>
          </div>

          {error && (
            <div className="px-6 py-3 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-2 text-red-600 text-sm font-bold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[2rem] transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50 text-sm"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Registration"}
          </button>
        </form>

        <div className="text-center space-y-4">
            <p className="text-slate-400 font-bold">Already have an account?</p>
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={onSwitchToLogin}
                className="bg-slate-900 text-white px-8 py-3 rounded-full font-black text-sm hover:bg-black transition-all active:scale-95"
              >
                Sign In
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
