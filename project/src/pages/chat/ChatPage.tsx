import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Message, UserProfile, Consultant } from "@/types";
import { 
  Send, 
  Paperclip, 
  Mic, 
  ChevronLeft, 
  Phone,
  Video as VideoIcon,
  Play,
  Square,
  AlertCircle
} from "lucide-react";

interface ChatPageProps {
  conversationId: string;
  consultant: Consultant & { user?: UserProfile };
  onBack: () => void;
}

export default function ChatPage({
  conversationId,
  consultant,
  onBack,
}: ChatPageProps) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [endingSession, setEndingSession] = useState(false);
  const [sessionNotice, setSessionNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Session billing metrics
  const [sessionCount, setSessionCount] = useState({
    chars: 0,
    messages: 0,
    audio: 0,
    video: 0
  });

  useEffect(() => {
    fetchMessages();
    const channel = subscribeToMessages();
    return () => {
      if (channel) supabase.removeChannel(channel);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      const unbilled = (data || []).filter(m => !m.is_billed);
      setSessionCount({
        chars: unbilled.reduce((acc, m) => acc + (m.content?.length || 0), 0),
        messages: unbilled.length,
        audio: unbilled.filter(m => m.message_type === 'audio').length,
        video: unbilled.filter(m => m.message_type === 'video').length
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`room-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((current) => {
            if (current.find(m => m.id === msg.id)) return current;
            return [...current, msg];
          });
          
          if (!msg.is_billed) {
             setSessionCount(prev => ({
                ...prev,
                messages: prev.messages + 1,
                chars: prev.chars + (msg.content?.length || 0),
                audio: prev.audio + (msg.message_type === 'audio' ? 1 : 0),
                video: prev.video + (msg.message_type === 'video' ? 1 : 0)
             }));
          }
        }
      )
      .subscribe();
    return channel;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (e?: React.FormEvent, type: string = "text", url?: string, fileName?: string) => {
    e?.preventDefault();
    if (!profile) return;
    if (type === "text" && !newMessage.trim()) return;

    try {
      const message: any = {
        conversation_id: conversationId,
        sender_id: profile.id,
        content: type === "text" ? newMessage.trim() : null,
        message_type: type,
        attachment_url: type === "attachment" ? url || null : null,
        audio_url: type === "audio" ? url || null : null,
        video_url: type === "video" ? url || null : null,
        metadata: fileName ? { fileName } : null,
        is_billed: false
      };

      const { error } = await supabase.from("messages").insert([message]).select().single();
      if (error) throw error;
      
      if (type === "text") setNewMessage("");
      // Real-time listener will add it to state
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const startRecording = async (type: 'audio' | 'video') => {
    try {
      const constraints = type === 'audio' ? { audio: true } : { audio: true, video: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const mimeType = type === 'audio' ? 'audio/webm' : 'video/mp4';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        await uploadMedia(blob, type);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      if (type === 'audio') setIsRecordingAudio(true);
      else setIsRecordingVideo(true);
      
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing media:", error);
      setSessionNotice({ type: "error", text: `${type === 'audio' ? 'Microphone' : 'Camera'} access denied.` });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      setIsRecordingVideo(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const uploadMedia = async (blob: Blob, type: string) => {
    try {
      const ext = type === 'audio' ? 'webm' : 'webm';
      const fileName = `${profile?.id}/${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
         .from("chat-attachments")
         .upload(fileName, blob, { contentType: blob.type || undefined });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(fileName);

      await sendMessage(undefined, type, publicUrl);
    } catch (error) {
      console.error("Error uploading media:", error);
      setSessionNotice({ type: "error", text: "Failed to upload media. Please try again." });
    }
  };

  const uploadAttachment = async (file: File) => {
    try {
      const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
      const fileName = `${profile?.id}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(fileName, file, { contentType: file.type || undefined });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(fileName);

      await sendMessage(undefined, "attachment", publicUrl, file.name || `file.${ext}`);
      setSessionNotice({ type: "success", text: "Attachment sent successfully." });
    } catch (error) {
      console.error("Error uploading attachment:", error);
      setSessionNotice({ type: "error", text: "Failed to send attachment. Please try again." });
    }
  };

  const handleAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAttachment(file);
    e.target.value = "";
  };

  const startBrowserCall = (mode: 'voice' | 'video') => {
    const roomName = `mentoga-${conversationId}`;
    const suffix = mode === 'voice' ? '#config.startWithVideoMuted=true&config.startAudioOnly=true' : '';
    window.open(`https://meet.jit.si/${roomName}${suffix}`, '_blank', 'noopener,noreferrer');
    setSessionNotice({ type: 'success', text: `${mode === 'voice' ? 'Voice' : 'Video'} call opened in a new tab.` });
  };

  const handleEndSession = async () => {
    const unbilledMessages = messages.filter((message) => !message.is_billed);
    const rate = consultant.chat_rate_per_minute || 0.1;
    const amount = (unbilledMessages.length * rate).toFixed(2);

    if (unbilledMessages.length === 0) {
      setSessionNotice({ type: "success", text: "No unpaid messages left in this session." });
      onBack();
      return;
    }

    const confirmed = confirm(`End chat session?\n\nMessages: ${unbilledMessages.length}\nEstimated Total: $${amount}`);
    if (!confirmed || !profile) return;

    try {
      setEndingSession(true);
      setSessionNotice(null);

      const { error: paymentError } = await supabase.from("payments").insert([
        {
          user_id: profile.id,
          consultant_id: consultant.id,
          amount: Number(amount),
          currency: "USD",
          status: "pending",
          description: `Direct chat billing for ${unbilledMessages.length} messages`,
        },
      ]);

      if (paymentError) throw paymentError;

      const unbilledIds = unbilledMessages.map((message) => message.id);
      const { error: updateError } = await supabase
        .from("messages")
        .update({ is_billed: true })
        .in("id", unbilledIds);

      if (updateError) throw updateError;

      setMessages((current) => current.map((message) => (
        unbilledIds.includes(message.id) ? { ...message, is_billed: true } : message
      )));
      setSessionCount({ chars: 0, messages: 0, audio: 0, video: 0 });
      setSessionNotice({ type: "success", text: `Invoice generated for $${amount}. Unbilled messages were settled.` });
      onBack();
    } catch (error: any) {
      console.error("Error ending chat session:", error);
      setSessionNotice({ type: "error", text: error.message || "Could not close the session right now." });
    } finally {
      setEndingSession(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-4 py-3 flex items-center justify-between gap-3 shadow-sm z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-10 h-10 bg-blue-50 rounded-full overflow-hidden flex items-center justify-center border border-slate-100">
               {consultant.user?.profile_image_url ? (
                  <img src={consultant.user.profile_image_url} alt="" className="w-full h-full object-cover" />
               ) : (
                  <span className="text-blue-600 font-bold">
                    {consultant.user?.first_name?.[0]}{consultant.user?.last_name?.[0]}
                  </span>
               )}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 leading-tight truncate">
                {consultant.user?.first_name} {consultant.user?.last_name}
              </h2>
              <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Online
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => startBrowserCall('voice')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button onClick={() => startBrowserCall('video')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <VideoIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={handleEndSession}
            disabled={endingSession}
            className="px-3 sm:px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs sm:text-sm font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {endingSession ? "Closing..." : "End Session"}
          </button>
        </div>
      </div>

      {sessionNotice && (
        <div className={`mx-3 mt-3 sm:mx-4 rounded-2xl px-4 py-3 text-sm font-bold ${sessionNotice.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
          {sessionNotice.text}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex justify-center mb-4">
           <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-xl text-xs font-medium border border-yellow-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Direct Chat Active • Billing based on messages sent
           </div>
        </div>
        
        {messages.map((message) => {
          const isOwn = message.sender_id === profile?.id;
          return (
            <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
                  isOwn
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white text-slate-900 rounded-bl-none border border-slate-200"
                }`}
              >
                {message.message_type === 'audio' ? (
                   <div className="min-w-[220px] space-y-2">
                      <div className="flex items-center gap-2">
                        <Play className={`w-4 h-4 ${isOwn ? "text-white" : "text-blue-600"}`} />
                        <span className={`text-[10px] font-bold ${isOwn ? "text-white/80" : "text-slate-400"}`}>VOICE MESSAGE</span>
                      </div>
                      <audio src={message.audio_url || message.attachment_url || undefined} controls className="w-full max-w-[260px]" />
                   </div>
                ) : message.message_type === 'video' ? (
                   <div className="rounded-lg overflow-hidden bg-slate-900 aspect-video flex items-center justify-center relative max-w-[280px]">
                      <video src={message.video_url || message.attachment_url || undefined} className="w-full h-full" controls />
                    </div>
                ) : message.message_type === 'attachment' ? (
                   <a
                     href={message.attachment_url || undefined}
                     target="_blank"
                     rel="noreferrer"
                     className={`block text-sm font-bold underline break-all ${isOwn ? "text-white" : "text-blue-600"}`}
                   >
                     {message.metadata?.fileName || 'Open attachment'}
                   </a>
                ) : (
                   <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                )}
                <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isOwn ? "text-white/60" : "text-slate-400"}`}>
                   {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Session Billing Tracker */}
      <div className="bg-white border-t border-slate-200 px-3 sm:px-4 py-2 flex flex-col sm:flex-row justify-between gap-2 sm:items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
         <div className="flex gap-4 flex-wrap">
            <span>Messages: <span className="text-slate-900">{sessionCount.messages}</span></span>
            <span>Media: <span className="text-slate-900">{sessionCount.audio + sessionCount.video}</span></span>
         </div>
         <div className="flex items-center gap-1.5 text-blue-600">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
            Live Recording Ready
         </div>
      </div>

      {/* Input Area */}
       <div className="bg-white p-3 sm:p-4 border-t border-slate-200">
        {(isRecordingAudio || isRecordingVideo) ? (
          <div className="flex items-center justify-between bg-red-50 p-4 rounded-2xl border border-red-100 animate-pulse">
            <div className="flex items-center gap-3 text-red-600">
              <Square className="w-5 h-5 fill-current" />
              <span className="font-bold">Recording {isRecordingAudio ? 'Audio' : 'Video'}...</span>
              <span className="font-mono">{Math.floor(recordingTime/60)}:{(recordingTime%60).toString().padStart(2,'0')}</span>
            </div>
            <button 
              onClick={stopRecording}
              className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              STOP & SEND
            </button>
          </div>
        ) : (
          <form onSubmit={sendMessage} className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleAttachmentChange}
            />
            <div className="flex-1 bg-slate-100 rounded-2xl p-2 flex items-end gap-1">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 hover:text-blue-600">
                <Paperclip className="w-5 h-5" />
              </button>
              <textarea
                rows={1}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-1 max-h-32"
              />
              <button onClick={() => startRecording('video')} type="button" className="p-2 text-slate-500 hover:text-blue-600">
                <VideoIcon className="w-5 h-5" />
              </button>
              <button onClick={() => startRecording('audio')} type="button" className="p-2 text-slate-500 hover:text-orange-500">
                <Mic className="w-5 h-5" />
              </button>
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100 disabled:opacity-50 hover:bg-blue-700 transition-all shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
