import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Chat() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    loadConversations();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!activeConversation) return;
    const unsub = base44.agents.subscribeToConversation(activeConversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return unsub;
  }, [activeConversation?.id]);

  const loadConversations = async () => {
    try {
      const convs = await base44.agents.listConversations({ agent_name: "assistente_clinica" });
      setConversations(convs || []);
    } catch {
      setConversations([]);
    }
  };

  const startNewConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: "assistente_clinica",
      metadata: { name: `Conversa ${new Date().toLocaleDateString("pt-BR")}` },
    });
    setConversations((prev) => [conv, ...prev]);
    setActiveConversation(conv);
    setMessages(conv.messages || []);
  };

  const selectConversation = async (conv) => {
    const full = await base44.agents.getConversation(conv.id);
    setActiveConversation(full);
    setMessages(full.messages || []);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    let conv = activeConversation;
    if (!conv) {
      conv = await base44.agents.createConversation({
        agent_name: "assistente_clinica",
        metadata: { name: `Conversa ${new Date().toLocaleDateString("pt-BR")}` },
      });
      setConversations((prev) => [conv, ...prev]);
      setActiveConversation(conv);
    }
    const text = input;
    setInput("");
    setLoading(true);
    await base44.agents.addMessage(conv, { role: "user", content: text });
    setLoading(false);
  };

  return (
    <div className="flex h-[calc(100vh-180px)] bg-white border border-[#EEEEEE] rounded-sm overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-[#EEEEEE] flex flex-col bg-[#F9F9F7]">
        <div className="p-4 border-b border-[#EEEEEE]">
          <h2 className="font-serif text-lg text-[#121212] mb-3">Bate-papo IA</h2>
          <Button
            onClick={startNewConversation}
            className="w-full bg-[#121212] hover:bg-[#2a2a2a] text-white text-xs tracking-wider uppercase rounded-sm"
          >
            Nova Conversa
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="text-xs text-[#BBBBBB] text-center mt-8 px-4">Nenhuma conversa ainda</p>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv)}
              className={cn(
                "w-full text-left px-4 py-3 border-b border-[#EEEEEE] hover:bg-white transition-colors",
                activeConversation?.id === conv.id && "bg-white border-l-2 border-l-[#C5A059]"
              )}
            >
              <p className="text-sm text-[#121212] truncate">{conv.metadata?.name || "Conversa"}</p>
              <p className="text-xs text-[#BBBBBB] mt-0.5">
                {new Date(conv.created_date).toLocaleDateString("pt-BR")}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {!activeConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 p-8">
            <MessagesSquare className="h-12 w-12 text-[#DDDDDD]" />
            <h3 className="font-serif text-xl text-[#121212]">Assistente da Clínica</h3>
            <p className="text-sm text-[#BBBBBB] max-w-xs">
              Tire dúvidas, obtenha insights clínicos e muito mais com a assistente de IA.
            </p>
            <Button
              onClick={startNewConversation}
              className="bg-[#121212] hover:bg-[#2a2a2a] text-white text-xs tracking-wider uppercase rounded-sm mt-2"
            >
              Iniciar Conversa
            </Button>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  {msg.role !== "user" && (
                    <Avatar className="h-7 w-7 border border-[#C5A059]/30 flex-shrink-0 mt-0.5">
                      <AvatarFallback className="bg-[#C5A059]/10 text-[#C5A059] text-[10px]">IA</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] px-4 py-2.5 rounded-sm text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-[#121212] text-white"
                        : "bg-[#F9F9F7] border border-[#EEEEEE] text-[#121212]"
                    )}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <Avatar className="h-7 w-7 border border-[#EEEEEE] flex-shrink-0 mt-0.5">
                      <AvatarFallback className="bg-[#F9F9F7] text-[#121212] text-[10px]">
                        {user?.full_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-7 w-7 border border-[#C5A059]/30 flex-shrink-0 mt-0.5">
                    <AvatarFallback className="bg-[#C5A059]/10 text-[#C5A059] text-[10px]">IA</AvatarFallback>
                  </Avatar>
                  <div className="bg-[#F9F9F7] border border-[#EEEEEE] px-4 py-2.5 rounded-sm">
                    <span className="text-sm text-[#BBBBBB]">Digitando...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#EEEEEE] bg-white">
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="bg-[#F9F9F7] border-[#EEEEEE] text-[#121212] placeholder:text-[#BBBBBB] rounded-sm focus:border-[#121212]"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-[#121212] hover:bg-[#2a2a2a] text-white rounded-sm px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}