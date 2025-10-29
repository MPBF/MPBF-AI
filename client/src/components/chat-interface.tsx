import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Mic, MicOff, Volume2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { Message } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  isTyping?: boolean;
}

function containsArabic(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text);
}

function getTextDirection(text: string): "rtl" | "ltr" {
  return containsArabic(text) ? "rtl" : "ltr";
}

export function ChatInterface({ messages, onSendMessage, isLoading = false, isTyping = false }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [voiceLang, setVoiceLang] = useState<"ar-SA" | "en-US">("ar-SA");
  const [recognition, setRecognition] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        
        recognitionInstance.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(prev => prev + (prev ? " " : "") + transcript);
          setIsRecording(false);
        };

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          toast({
            title: voiceLang === "ar-SA" ? "خطأ في التعرف على الصوت" : "Speech Recognition Error",
            description: voiceLang === "ar-SA" 
              ? "حدث خطأ أثناء التعرف على الصوت. يرجى المحاولة مرة أخرى." 
              : "An error occurred during speech recognition. Please try again.",
            variant: "destructive",
          });
        };

        recognitionInstance.onend = () => {
          setIsRecording(false);
        };

        setRecognition(recognitionInstance);
      }
    }
  }, [voiceLang]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const detectedLang = containsArabic(lastMessage.content) ? "ar-SA" : "en-US";
      setVoiceLang(detectedLang);
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  };

  const toggleRecording = () => {
    if (!recognition) {
      toast({
        title: voiceLang === "ar-SA" ? "غير مدعوم" : "Not Supported",
        description: voiceLang === "ar-SA"
          ? "متصفحك لا يدعم التعرف على الصوت"
          : "Speech recognition is not supported in your browser",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.lang = voiceLang;
      recognition.start();
      setIsRecording(true);
    }
  };

  const toggleVoiceLang = () => {
    setVoiceLang(prev => prev === "ar-SA" ? "en-US" : "ar-SA");
  };

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = containsArabic(text) ? 'ar-SA' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      toast({
        title: containsArabic(text) ? "غير مدعوم" : "Not Supported",
        description: containsArabic(text)
          ? "متصفحك لا يدعم تحويل النص إلى كلام"
          : "Text-to-speech is not supported in your browser",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="max-w-5xl mx-auto py-8 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-10 h-10 text-primary-foreground" />
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent" dir="rtl">
                مرحباً أبو خالد! 👋
              </h3>
              <p className="text-muted-foreground max-w-xl text-lg leading-relaxed" dir="rtl">
                أنا <span className="font-semibold text-foreground">مودرن</span>، مساعدك الذكي المتقدم. أنا هنا لمساعدتك في إدارة عملك، تنظيم مهامك، والإجابة على أسئلتك. أتذكر كل محادثاتنا السابقة لأقدم لك تجربة شخصية ومتكاملة.
              </p>
              <div className="flex gap-2 mt-6" dir="rtl">
                <Badge variant="secondary" className="px-4 py-2">
                  <Sparkles className="w-3 h-3 ml-1" />
                  ذكاء اصطناعي متقدم
                </Badge>
                <Badge variant="secondary" className="px-4 py-2">
                  💬 محادثات ذكية
                </Badge>
                <Badge variant="secondary" className="px-4 py-2">
                  🧠 ذاكرة كاملة
                </Badge>
              </div>
            </div>
          )}

          {messages.map((message, index) => {
            const dir = getTextDirection(message.content);
            const isArabic = dir === "rtl";
            const isUser = message.role === "user";
            const showAvatar = index === 0 || messages[index - 1].role !== message.role;
            
            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-4 items-start group",
                  isUser ? "justify-end" : "justify-start"
                )}
                data-testid={`message-${message.id}`}
              >
                {!isUser && showAvatar && (
                  <Avatar className="w-10 h-10 flex-shrink-0 ring-2 ring-primary/10">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold">
                      M
                    </AvatarFallback>
                  </Avatar>
                )}
                {!isUser && !showAvatar && <div className="w-10" />}

                <div
                  className={cn(
                    "rounded-2xl px-5 py-4 max-w-2xl shadow-sm transition-all duration-200",
                    isUser
                      ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-primary/20"
                      : "bg-card border border-border/50 hover-elevate"
                  )}
                  dir={dir}
                >
                  <div className="flex items-start gap-3">
                    <p 
                      className="text-base leading-relaxed whitespace-pre-wrap break-words flex-1"
                      dir={dir}
                      lang={isArabic ? "ar" : "en"}
                    >
                      {message.content}
                    </p>
                    {!isUser && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => speakMessage(message.content)}
                        data-testid={`button-speak-${message.id}`}
                      >
                        <Volume2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <p className={cn(
                    "text-xs mt-2 flex items-center gap-1",
                    isUser ? "text-primary-foreground/60" : "text-muted-foreground"
                  )} dir={dir}>
                    {new Date(message.createdAt).toLocaleString('ar-SA', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </p>
                </div>

                {isUser && showAvatar && (
                  <Avatar className="w-10 h-10 flex-shrink-0 ring-2 ring-primary/10">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold">
                      AK
                    </AvatarFallback>
                  </Avatar>
                )}
                {isUser && !showAvatar && <div className="w-10" />}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-4 items-start">
              <Avatar className="w-10 h-10 flex-shrink-0 ring-2 ring-primary/10">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold">
                  M
                </AvatarFallback>
              </Avatar>
              <div className="bg-card border border-border/50 rounded-2xl px-5 py-4 shadow-sm">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-lg">
        <div className="max-w-5xl mx-auto p-6">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative rounded-2xl border-2 border-border/50 bg-card shadow-sm focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-200">
              <Textarea
                ref={textareaRef}
                placeholder="اكتب رسالتك هنا..."
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className={cn(
                  "resize-none border-0 bg-transparent px-6 py-4 pr-28 pl-28 min-h-[64px] max-h-[200px] focus-visible:ring-0 text-base",
                  getTextDirection(input)
                )}
                dir={getTextDirection(input)}
                rows={1}
                data-testid="input-message"
              />
              <div className="absolute left-3 bottom-3 flex gap-1.5">
                <Button
                  type="button"
                  size="icon"
                  variant={isRecording ? "default" : "ghost"}
                  onClick={toggleRecording}
                  className={cn(
                    "rounded-xl h-10 w-10 transition-all",
                    isRecording && "bg-destructive hover:bg-destructive/90 animate-pulse"
                  )}
                  data-testid="button-voice"
                  title={voiceLang === "ar-SA" ? "تسجيل صوتي بالعربية" : "Voice recording in English"}
                >
                  {isRecording ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={toggleVoiceLang}
                  className="h-10 px-3 text-lg rounded-xl hover-elevate"
                  data-testid="button-toggle-lang"
                  title={voiceLang === "ar-SA" ? "Switch to English" : "التبديل إلى العربية"}
                >
                  {voiceLang === "ar-SA" ? "🇸🇦" : "🇬🇧"}
                </Button>
              </div>
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="absolute right-3 bottom-3 rounded-xl h-12 w-12 shadow-md shadow-primary/20"
                data-testid="button-send"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </form>
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground" dir="rtl">
            <Sparkles className="w-3 h-3" />
            <p>مودرن يتذكر جميع المحادثات ويتعلم من كل تفاعل</p>
          </div>
        </div>
      </div>
    </div>
  );
}
