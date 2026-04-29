import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { sendMessage, getMessages, subscribeToMessages } from "@/services/contractMessageService";
import type { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type ContractMessage = Tables<"contract_messages"> & {
  sender?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
};

interface ContractChatProps {
  contractId: string;
  currentUserId: string;
  clientId: string;
  providerId: string;
  clientName?: string;
  providerName?: string;
}

export function ContractChat({
  contractId,
  currentUserId,
  clientId,
  providerId,
  clientName = "Client",
  providerName = "Provider",
}: ContractChatProps) {
  const [messages, setMessages] = useState<ContractMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    loadMessages();
    const unsubscribe = subscribeToMessages(contractId, handleNewMessage);
    return () => unsubscribe();
  }, [contractId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadMessages() {
    setLoading(true);
    const { data, error } = await getMessages(contractId);
    if (error) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setMessages(data);
    }
    setLoading(false);
  }

  function handleNewMessage(message: ContractMessage) {
    setMessages((prev) => [...prev, message]);
  }

  async function handleSend() {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const { data, error } = await sendMessage(contractId, currentUserId, newMessage);

    if (error) {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setNewMessage("");
    }
    setSending(false);
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / 60000);
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    if (diffDays === 1) {
      return `Yesterday ${date.toLocaleTimeString("en-NZ", { hour: "2-digit", minute: "2-digit" })}`;
    }
    return date.toLocaleDateString("en-NZ", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function getSenderName(senderId: string) {
    if (senderId === clientId) return clientName;
    if (senderId === providerId) return providerName;
    return "Unknown";
  }

  function getSenderInitials(senderId: string) {
    const name = getSenderName(senderId);
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Messages
        </CardTitle>
        <CardDescription>
          Communicate securely within the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm mt-1">Start the conversation with {currentUserId === clientId ? providerName : clientName}</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {messages.map((message) => {
              const isCurrentUser = message.sender_id === currentUserId;
              const isClient = message.sender_id === clientId;

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={isClient ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}>
                      {getSenderInitials(message.sender_id)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 max-w-[70%] ${isCurrentUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{getSenderName(message.sender_id)}</span>
                      <Badge variant={isClient ? "default" : "secondary"} className="text-xs">
                        {isClient ? "Client" : "Provider"}
                      </Badge>
                    </div>
                    <div className={`rounded-lg px-4 py-2 ${isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatTime(message.created_at)}</span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 w-full"
        >
          <Input
            placeholder="Type your message... (max 500 characters)"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            maxLength={500}
            disabled={sending}
          />
          <Button type="submit" disabled={!newMessage.trim() || sending} size="icon">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}