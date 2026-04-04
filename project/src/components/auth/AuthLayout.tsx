import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Zap, 
  Coffee 
} from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  activeStep?: number;
}

const slides = [
  {
    icon: <Coffee className="w-8 h-8 text-blue-500" />,
    title: "Let Them Tip You When They Want",
    description: "Let fans support your work by tipping you whenever they want, just for being you.",
    bg: "bg-white",
    visual: (
      <div className="relative w-full aspect-square flex items-center justify-center">
        <div className="absolute top-10 right-10 w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-2xl animate-bounce shadow-xl shadow-blue-600/20">
          $3
        </div>
        <div className="space-y-4 w-full max-w-[280px]">
          <div className="bg-white p-4 rounded-2xl shadow-lg border border-blue-100 flex items-center gap-3 animate-in slide-in-from-left duration-700">
             <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Coffee className="w-5 h-5" />
             </div>
             <div>
                <p className="text-xs font-black text-slate-900 leading-none">Mike bought</p>
                <p className="text-[10px] font-bold text-blue-600">10x coffees</p>
             </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-lg border border-blue-100 flex items-center gap-3 animate-in slide-in-from-left duration-1000 delay-300">
             <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Coffee className="w-5 h-5" />
             </div>
             <div>
                <p className="text-xs font-black text-slate-900 leading-none">Emily bought</p>
                <p className="text-[10px] font-bold text-blue-600">5x coffees</p>
             </div>
          </div>
        </div>
        <img 
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop" 
          alt="User" 
          className="w-48 h-48 rounded-[3rem] object-cover border-4 border-white shadow-2xl relative z-[-1] mt-8 opacity-50 grayscale"
        />
      </div>
    )
  },
  {
    icon: <Zap className="w-8 h-8 text-blue-600" />,
    title: "Create Your VVIP Circle",
    description: "Allow your most avid fans to join your inner circle by paying a monthly subscription fee.",
    bg: "bg-white",
    visual: (
      <div className="space-y-4 w-full max-w-[320px]">
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-blue-100 transform -rotate-2">
           <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Standard</span>
              <span className="text-lg font-black text-slate-900">$40/mo</span>
           </div>
           <p className="text-[10px] text-slate-400 font-medium mb-4">5 Text Messages • 2 eMeetings</p>
           <div className="h-2 bg-blue-50 rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-blue-600" />
           </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-blue-50 transform rotate-1 scale-105 z-10 relative">
           <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Pro</span>
              <span className="text-lg font-black text-slate-900">$80/mo</span>
           </div>
           <p className="text-[10px] text-slate-400 font-medium italic">Unlimited Access • Priority Support</p>
           <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-[8px] font-black px-3 py-1 rounded-full shadow-lg">SAVE 30%</div>
        </div>
      </div>
    )
  },
  {
    icon: <MessageSquare className="w-8 h-8 text-blue-500" />,
    title: "Every Single Chat Gets You Paid",
    description: "Turn your inbox into income with Mentoga. Every message you receive gets you paid.",
    bg: "bg-white",
    visual: (
      <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-blue-50 w-full max-w-[280px] relative overflow-hidden">
         <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12" />
         <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none mr-8">
               <p className="text-[10px] font-bold text-slate-600">Hey, I have a great idea! Could you guide me?</p>
            </div>
            <div className="bg-blue-600 p-3 rounded-2xl rounded-tr-none ml-8">
               <p className="text-[10px] font-bold text-white">Sure, let's discuss. What's on your mind?</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
               <div className="flex gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
               </div>
               <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">+$5.00</span>
            </div>
         </div>
      </div>
    )
  }
];

export default function AuthLayout({ children }: AuthLayoutProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen w-full flex bg-white font-sans selection:bg-blue-100 overflow-hidden relative">
      {/* Left Column: Visuals & Marketing (50%) */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between bg-blue-50/30 border-r border-blue-50 relative overflow-hidden">
        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10 origin-left">
          <div className="w-10 h-10 bg-blue-600 rounded-xl shadow-xl flex items-center justify-center text-white font-black italic text-xl">M</div>
          <span className="text-2xl font-black text-slate-900 tracking-tighter">Mentoga</span>
        </div>

        {/* Content Area */}
        <div className="max-w-md mx-auto text-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700" key={currentSlide}>
          {/* Visual Asset */}
          <div className="mb-8 flex justify-center">
             {slides[currentSlide].visual}
          </div>
          
          <h2 className="text-4xl font-black text-slate-900 mb-6 leading-tight italic tracking-tight underline decoration-blue-600 decoration-8 underline-offset-8 transition-all">
            {slides[currentSlide].title}
          </h2>
          <p className="text-slate-500 font-bold text-lg leading-relaxed">
            {slides[currentSlide].description}
          </p>
        </div>

        {/* Footer: Dots */}
        <div className="flex justify-center gap-3 relative z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-3 rounded-full transition-all duration-300 ${
                i === currentSlide ? 'w-12 bg-blue-600' : 'w-3 bg-blue-100 hover:bg-blue-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Right Column: Auth Form (50%) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 pt-24 sm:p-6 sm:pt-24 lg:p-12 bg-white relative overflow-y-auto">
        {/* Small Logo for Mobile */}
        <div className="lg:hidden absolute top-5 left-4 sm:top-8 sm:left-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black italic">M</div>
          <span className="text-xl font-black text-slate-900">Mentoga</span>
        </div>

        <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-right-8 duration-700">
          {children}
        </div>

        {/* Corner Decoration */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>
  );
}
