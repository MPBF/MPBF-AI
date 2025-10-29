import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { ChatInterface } from "@/components/chat-interface";
import type { Message, Conversation } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.id;
  const { toast } = useToast();
  const [isTyping, setIsTyping] = useState(false);

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: conversationId ? ["/api/messages", conversationId] : ["/api/messages/current"],
    enabled: true,
  });

  const { data: conversation } = useQuery<Conversation>({
    queryKey: ["/api/conversations", conversationId],
    enabled: !!conversationId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const endpoint = conversationId 
        ? `/api/messages/${conversationId}`
        : "/api/messages";
      
      return await apiRequest("POST", endpoint, { content });
    },
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setIsTyping(false);
    },
    onError: (error: Error) => {
      setIsTyping(false);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  if (messagesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <ChatInterface
      messages={messages}
      onSendMessage={(content) => sendMessageMutation.mutate(content)}
      isLoading={sendMessageMutation.isPending}
      isTyping={isTyping && sendMessageMutation.isPending}
    />
  );
}
