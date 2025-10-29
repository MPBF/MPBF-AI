import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  isTyping?: boolean;
}

// Detect if text contains Arabic characters
function containsArabic(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text);
}

// Get text direction based on content
function getTextDirection(text: string): "rtl" | "ltr" {
  return containsArabic(text) ? "rtl" : "ltr";
}

export function ChatInterface({ messages, onSendMessage, isLoading = false, isTyping = false }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [voiceLang, setVoiceLang] = useState<"ar-SA" | "en-US">("ar-SA"); // Default to Arabic
  const [recognition, setRecognition] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Initialize speech recognition
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

  // Detect language from recent messages and update voice language
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
      // Set language before starting
      recognition.lang = voiceLang;
      recognition.start();
      setIsRecording(true);
    }
  };

  const toggleVoiceLang = () => {
    const newLang = voiceLang === "ar-SA" ? "en-US" : "ar-SA";
    setVoiceLang(newLang);
    toast({
      title: newLang === "ar-SA" ? "تم التبديل إلى العربية" : "Switched to English",
      description: newLang === "ar-SA" 
        ? "سيتم التعرف على الصوت باللغة العربية" 
        : "Voice will be recognized in English",
    });
  };

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language based on text content
      utterance.lang = containsArabic(text) ? 'ar-SA' : 'en-US';
      utterance.rate = 0.9; // Slightly slower for better clarity
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
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="max-w-4xl mx-auto py-8 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                    M
                  </AvatarFallback>
                </Avatar>
              </div>
              <h3 className="text-2xl font-semibold mb-2">مرحباً أبو خالد!</h3>
              <p className="text-muted-foreground max-w-md" dir="rtl">
                أنا مودرن، مساعدك الذكي. أنا هنا لمساعدتك في العمليات التجارية والمهام وتذكر كل ما تشاركه معي. كيف يمكنني مساعدتك اليوم؟
              </p>
              <p className="text-muted-foreground max-w-md mt-2">
                I'm Modern, your AI assistant. I support Arabic and English - just speak or type!
              </p>
            </div>
          )}

          {messages.map((message) => {
            const dir = getTextDirection(message.content);
            const isArabic = dir === "rtl";
            
            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 items-start",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
                data-testid={`message-${message.id}`}
              >
                {message.role === "assistant" && (
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      M
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 max-w-2xl",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <p 
                      className={cn(
                        "text-base leading-relaxed whitespace-pre-wrap break-words flex-1",
                        dir
                      )}
                      dir={dir}
                      lang={isArabic ? "ar" : "en"}
                    >
                      {message.content}
                    </p>
                    {message.role === "assistant" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => speakMessage(message.content)}
                        data-testid={`button-speak-${message.id}`}
                      >
                        <Volume2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <p className={cn(
                    "text-xs mt-1",
                    message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {message.role === "user" && (
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      AK
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 items-start">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  M
                </AvatarFallback>
              </Avatar>
              <div className="bg-card border rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="relative">
            <Textarea
              ref={textareaRef}
              placeholder={containsArabic(input) ? "اكتب رسالتك..." : "Type your message..."}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className={cn(
                "resize-none pr-24 min-h-[56px] max-h-[200px]",
                getTextDirection(input)
              )}
              dir={getTextDirection(input)}
              rows={1}
              data-testid="input-message"
            />
            <div className="absolute left-2 bottom-2 flex gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={toggleRecording}
                className={cn(
                  "rounded-full",
                  isRecording && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                )}
                data-testid="button-voice"
                title={voiceLang === "ar-SA" ? "تسجيل صوتي بالعربية" : "Voice recording in English"}
              >
                {isRecording ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={toggleVoiceLang}
                className="h-9 px-2 text-xs rounded-full"
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
              className="absolute right-2 bottom-2 rounded-full"
              data-testid="button-send"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {containsArabic(input) 
              ? "مودرن يتذكر كل شيء في هذه المحادثة" 
              : "Modern remembers everything in this conversation"}
          </p>
        </div>
      </div>
    </div>
  );
}
