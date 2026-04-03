import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MainLayout from "../../components/layout/MainLayout";
import messageService from "../../services/messageService";
import { useAuth } from "../../contexts/AuthContext";
import { getAvatarFallback } from "../../utils/helpers";
import {
  Send,
  Search,
  ArrowLeft,
  Trash2,
  MessageSquare,
  Loader2,
  CheckCheck,
  Check,
  MoreVertical,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

// ============================================
// HELPERS
// ============================================
function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "Vừa xong";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút`;
  if (diff < 86400000)
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  if (diff < 604800000) {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return days[d.getDay()];
  }
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function formatMessageTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Avatar({ src, name, size = "md" }) {
  const sizeMap = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };
  return (
    <div
      className={`${sizeMap[size]} rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0`}
    >
      {src ? (
        <img
          src={`http://localhost:5024${src}`}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        getAvatarFallback(name)
      )}
    </div>
  );
}

// ============================================
// CONVERSATION ITEM
// ============================================
function ConversationItem({ conv, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left ${isActive ? "bg-blue-50 border-r-2 border-blue-500" : ""}`}
    >
      <div className="relative flex-shrink-0">
        <Avatar src={conv.userAvatar} name={conv.userName} size="md" />
        {conv.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold">
            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p
            className={`text-sm truncate ${conv.unreadCount > 0 ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}
          >
            {conv.userName}
          </p>
          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
            {formatTime(conv.lastMessageAt)}
          </span>
        </div>
        <p
          className={`text-xs truncate ${conv.unreadCount > 0 ? "text-gray-700 font-medium" : "text-gray-400"}`}
        >
          {conv.lastMessage || "Bắt đầu cuộc trò chuyện"}
        </p>
      </div>
    </button>
  );
}

// ============================================
// MESSAGE BUBBLE
// ============================================
function MessageBubble({ msg, isOwn, onDelete }) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`flex items-end gap-2 group ${isOwn ? "flex-row-reverse" : ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isOwn && (
        <Avatar src={msg.fromUserAvatar} name={msg.fromUserName} size="sm" />
      )}

      <div
        className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}
      >
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
            msg.recalled
              ? "bg-gray-100 text-gray-400 italic border border-dashed border-gray-200"
              : isOwn
                ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-sm"
                : "bg-white border border-gray-100 text-gray-800 shadow-sm rounded-bl-sm"
          }`}
        >
          {msg.recalled ? "Tin nhắn đã bị thu hồi" : msg.content}
        </div>
        <div
          className={`flex items-center gap-1 ${isOwn ? "flex-row-reverse" : ""}`}
        >
          <span className="text-[10px] text-gray-400">
            {formatMessageTime(msg.createdAt)}
          </span>
          {isOwn &&
            (msg.isRead ? (
              <CheckCheck size={12} className="text-blue-400" />
            ) : (
              <Check size={12} className="text-gray-400" />
            ))}
        </div>
      </div>

      {/* Delete button */}
      {isOwn && !msg.recalled && showActions && (
        <button
          onClick={() => onDelete(msg.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================
function EmptyState({ onSelectConversation }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <MessageSquare size={28} className="text-blue-400" />
        </div>
        <p className="text-gray-500 font-medium">Chọn một cuộc trò chuyện</p>
        <p className="text-sm text-gray-400 mt-1">
          hoặc bắt đầu nhắn tin với ai đó
        </p>
      </div>
    </div>
  );
}

// ============================================
// CHAT PANEL
// ============================================
function ChatPanel({ partnerId, partnerInfo, currentUserId, onBack }) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [page, setPage] = useState(1);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ["messages", partnerId, page],
    queryFn: () =>
      messageService
        .getMessages(partnerId, { page, pageSize: 30 })
        .then((r) => r.data.data),
    enabled: !!partnerId,
    refetchInterval: 3000, // Poll mỗi 3 giây
  });

  const messages = data?.messages || [];
  const totalCount = data?.totalCount || 0;
  const hasMore = messages.length < totalCount;

  // Mark as read khi mở conversation
  useEffect(() => {
    if (partnerId) {
      messageService.markAsRead(partnerId).catch(() => {});
      queryClient.invalidateQueries(["conversations"]);
      queryClient.invalidateQueries(["unreadCount"]);
    }
  }, [partnerId]);

  // Scroll to bottom khi có tin mới
  useEffect(() => {
    if (page === 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: (content) =>
      messageService.sendMessage({ toUserId: partnerId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries(["messages", partnerId]);
      queryClient.invalidateQueries(["conversations"]);
      setInput("");
      inputRef.current?.focus();
    },
    onError: () => toast.error("Gửi tin nhắn thất bại"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => messageService.deleteMessage(id),
    onSuccess: (_, id) => {
      // Không xóa khỏi UI, chỉ đánh dấu là đã thu hồi
      queryClient.setQueryData(["messages", partnerId, page], (old) => {
        if (!old?.messages) return old;
        return {
          ...old,
          messages: old.messages.map((m) =>
            m.id === id ? { ...m, content: null, recalled: true } : m,
          ),
        };
      });
    },
    onError: () => toast.error("Thu hồi thất bại"),
  });

  const handleSend = () => {
    const text = input.trim();
    if (!text || sendMutation.isPending) return;
    sendMutation.mutate(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
        >
          <ArrowLeft size={18} />
        </button>
        <Avatar
          src={partnerInfo?.userAvatar}
          name={partnerInfo?.userName}
          size="md"
        />
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">
            {partnerInfo?.userName || "..."}
          </p>
          <p className="text-xs text-green-500">Đang hoạt động</p>
        </div>
        <Link
          to={`/profile/${partnerId}`}
          className="text-xs text-blue-600 hover:underline hidden sm:block"
        >
          Xem hồ sơ
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/30">
        {hasMore && (
          <button
            onClick={() => setPage((p) => p + 1)}
            className="w-full text-xs text-blue-600 hover:underline text-center py-2"
          >
            Tải thêm tin nhắn cũ
          </button>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">
              Chưa có tin nhắn. Hãy bắt đầu trò chuyện!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isOwn={msg.fromUserId === currentUserId}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn... (Enter để gửi)"
              className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none resize-none leading-relaxed"
              style={{ minHeight: "24px" }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white hover:opacity-90 transition disabled:opacity-40 flex-shrink-0"
          >
            {sendMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================
export default function MessagesPage() {
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(
    paramUserId ? Number(paramUserId) : null,
  );
  const [mobileView, setMobileView] = useState(paramUserId ? "chat" : "list");

  // Fetch conversations
  const { data: convsData, isLoading: loadingConvs } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messageService.getConversations().then((r) => r.data.data),
    refetchInterval: 5000,
  });

  const conversations = convsData?.conversations || [];
  const filtered = conversations.filter(
    (c) => !search || c.userName?.toLowerCase().includes(search.toLowerCase()),
  );

  // Nếu có paramUserId nhưng chưa có conversation → tạo placeholder
  const activeConv =
    conversations.find((c) => c.userId === activeId) ||
    (activeId ? { userId: activeId, userName: "...", userAvatar: null } : null);

  const handleSelect = (userId) => {
    setActiveId(userId);
    setMobileView("chat");
    navigate(`/messages/${userId}`, { replace: true });
  };

  const handleBack = () => {
    setMobileView("list");
    navigate("/messages", { replace: true });
  };

  if (!currentUser) return null;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          style={{ height: "calc(100vh - 140px)", minHeight: "500px" }}
        >
          <div className="flex h-full">
            {/* ---- SIDEBAR: Danh sách cuộc trò chuyện ---- */}
            <div
              className={`${mobileView === "chat" ? "hidden" : "flex"} md:flex flex-col w-full md:w-72 lg:w-80 border-r border-gray-100 flex-shrink-0`}
            >
              {/* Sidebar header */}
              <div className="px-4 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900 mb-3">
                  Tin nhắn
                </h2>
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Conversation list */}
              <div className="flex-1 overflow-y-auto">
                {loadingConvs ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={18} className="animate-spin text-gray-400" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <MessageSquare
                      size={24}
                      className="mx-auto text-gray-200 mb-2"
                    />
                    <p className="text-sm text-gray-400">
                      {search
                        ? "Không tìm thấy"
                        : "Chưa có cuộc trò chuyện nào"}
                    </p>
                  </div>
                ) : (
                  filtered.map((conv) => (
                    <ConversationItem
                      key={conv.userId}
                      conv={conv}
                      isActive={activeId === conv.userId}
                      onClick={() => handleSelect(conv.userId)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* ---- MAIN: Chat panel ---- */}
            <div
              className={`${mobileView === "list" ? "hidden" : "flex"} md:flex flex-col flex-1 min-w-0`}
            >
              {activeId && activeConv ? (
                <ChatPanel
                  partnerId={activeId}
                  partnerInfo={activeConv}
                  currentUserId={currentUser.id}
                  onBack={handleBack}
                />
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
