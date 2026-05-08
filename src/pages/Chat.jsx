import React, { useState } from "react";
import { useConversations } from "@/hooks/useConversations";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import { cn } from "@/lib/utils";

export default function Chat() {
  const {
    conversations,
    search,
    setSearch,
    filter,
    setFilter,
    totalUnread,
    updateConversationStatus,
    markAsRead,
  } = useConversations();

  const [activeConversation, setActiveConversation] = useState(null);
  const [mobileView, setMobileView] = useState("list"); // "list" | "chat"

  const handleSelect = (conv) => {
    setActiveConversation(conv);
    markAsRead(conv.id);
    setMobileView("chat");
  };

  const handleBack = () => {
    setMobileView("list");
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white border border-[#EEEEEE] rounded-sm overflow-hidden shadow-sm">

      {/* ── COLUMN: Conversation List ── */}
      <div
        className={cn(
          "flex-shrink-0 border-r border-[#F0F0F0] flex flex-col",
          "w-full md:w-80",
          // Mobile: show list OR chat
          mobileView === "chat" ? "hidden md:flex" : "flex"
        )}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeConversation?.id}
          onSelect={handleSelect}
          search={search}
          setSearch={setSearch}
          filter={filter}
          setFilter={setFilter}
          totalUnread={totalUnread}
        />
      </div>

      {/* ── COLUMN: Chat Window ── */}
      <div
        className={cn(
          "flex-1 flex overflow-hidden",
          mobileView === "list" ? "hidden md:flex" : "flex"
        )}
      >
        <ChatWindow
          conversation={activeConversation}
          onBack={handleBack}
          onStatusChange={updateConversationStatus}
        />
      </div>
    </div>
  );
}