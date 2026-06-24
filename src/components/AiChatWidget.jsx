import { useState } from "react";
import { sendAiChatMessage } from "../api/aiChat";

export default function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "bot",
      content:
        "Xin chào 👋 Mình là trợ lý AI của PetGo. Anh cần hỗ trợ gì cho thú cưng hôm nay ạ?",
    },
  ]);

  const suggestions = [
    "PetGo có những dịch vụ gì?",
    "Làm sao để đặt lịch chăm sóc thú cưng?",
    "Tôi muốn mua đồ ăn cho chó mèo",
    "PetGo có hỗ trợ thanh toán online không?",
  ];

  const handleSend = async (customMessage) => {
    const text = (customMessage || message).trim();

    if (!text || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: text,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const data = await sendAiChatMessage(text);

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: data?.reply || "Xin lỗi, mình chưa có phản hồi phù hợp.",
        },
      ]);
    } catch (error) {
      console.error("AI chat error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "Chatbot đang gặp lỗi, anh thử lại sau nhé.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={styles.floatingButton}
          aria-label="Mở chatbot"
        >
          <span style={styles.floatingIcon}>💬</span>
        </button>
      )}

      {open && (
        <div style={styles.chatBox}>
          <div style={styles.header}>
            <div style={styles.headerInfo}>
              <div style={styles.avatar}>🐾</div>

              <div>
                <div style={styles.title}>PetGo Assistant</div>
                <div style={styles.subtitle}>Hỗ trợ thú cưng 24/7</div>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              style={styles.closeButton}
              aria-label="Đóng chatbot"
            >
              ✕
            </button>
          </div>

          <div style={styles.body}>
            <div style={styles.welcomeCard}>
              <div style={styles.welcomeTitle}>Gợi ý nhanh</div>

              <div style={styles.suggestionList}>
                {suggestions.map((item, index) => (
                  <button
                    key={index}
                    style={styles.suggestionButton}
                    onClick={() => handleSend(item)}
                    disabled={loading}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {messages.map((item, index) => (
              <div
                key={index}
                style={{
                  ...styles.messageRow,
                  justifyContent:
                    item.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {item.role === "bot" && <div style={styles.smallBot}>🐶</div>}

                <div
                  style={{
                    ...styles.messageBubble,
                    ...(item.role === "user"
                      ? styles.userBubble
                      : styles.botBubble),
                  }}
                >
                  {item.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={styles.messageRow}>
                <div style={styles.smallBot}>🐶</div>
                <div style={{ ...styles.messageBubble, ...styles.botBubble }}>
                  Đang trả lời...
                </div>
              </div>
            )}
          </div>

          <div style={styles.footer}>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi của anh..."
              style={styles.input}
              rows={1}
            />

            <button
              onClick={() => handleSend()}
              disabled={loading || !message.trim()}
              style={{
                ...styles.sendButton,
                opacity: loading || !message.trim() ? 0.55 : 1,
                cursor: loading || !message.trim() ? "not-allowed" : "pointer",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  floatingButton: {
    position: "fixed",
    right: 24,
    bottom: 24,
    width: 62,
    height: 62,
    borderRadius: "50%",
    border: "none",
    background: "linear-gradient(135deg, #f97316, #fb923c)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 14px 35px rgba(249, 115, 22, 0.45)",
    cursor: "pointer",
    zIndex: 9999,
  },

  floatingIcon: {
    fontSize: 28,
  },

  chatBox: {
    position: "fixed",
    right: 24,
    bottom: 24,
    width: 380,
    maxWidth: "calc(100vw - 32px)",
    height: 560,
    maxHeight: "calc(100vh - 48px)",
    background: "#fff7ed",
    borderRadius: 24,
    boxShadow: "0 24px 70px rgba(124, 45, 18, 0.28)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    zIndex: 9999,
    border: "1px solid #fed7aa",
  },

  header: {
    padding: "16px 18px",
    background: "linear-gradient(135deg, #f97316, #fb923c, #fdba74)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerInfo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.28)",
  },

  title: {
    fontWeight: 800,
    fontSize: 17,
    letterSpacing: 0.2,
  },

  subtitle: {
    fontSize: 12,
    opacity: 0.95,
    marginTop: 2,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "none",
    background: "rgba(255,255,255,0.2)",
    color: "#fff",
    cursor: "pointer",
    fontSize: 16,
  },

  body: {
    flex: 1,
    padding: 14,
    overflowY: "auto",
    background:
      "linear-gradient(180deg, #fff7ed 0%, #ffedd5 45%, #fff7ed 100%)",
  },

  welcomeCard: {
    background: "#ffffff",
    border: "1px solid #fed7aa",
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    boxShadow: "0 8px 22px rgba(251, 146, 60, 0.12)",
  },

  welcomeTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#9a3412",
    marginBottom: 10,
  },

  suggestionList: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },

  suggestionButton: {
    border: "1px solid #fdba74",
    background: "#fff7ed",
    color: "#c2410c",
    borderRadius: 999,
    padding: "7px 10px",
    fontSize: 12,
    cursor: "pointer",
    transition: "0.2s",
  },

  messageRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 11,
  },

  smallBot: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#fed7aa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    flexShrink: 0,
  },

  messageBubble: {
    maxWidth: "78%",
    padding: "10px 13px",
    borderRadius: 16,
    fontSize: 14,
    lineHeight: 1.45,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },

  botBubble: {
    background: "#fff",
    color: "#431407",
    border: "1px solid #fed7aa",
    borderBottomLeftRadius: 5,
  },

  userBubble: {
    background: "linear-gradient(135deg, #f97316, #fb923c)",
    color: "#fff",
    borderBottomRightRadius: 5,
    boxShadow: "0 8px 18px rgba(249, 115, 22, 0.25)",
  },

  footer: {
    padding: 12,
    display: "flex",
    gap: 9,
    borderTop: "1px solid #fed7aa",
    background: "#fff",
  },

  input: {
    flex: 1,
    resize: "none",
    border: "1px solid #fdba74",
    borderRadius: 16,
    padding: "11px 13px",
    outline: "none",
    fontSize: 14,
    fontFamily: "inherit",
    background: "#fff7ed",
    color: "#431407",
  },

  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(135deg, #f97316, #fb923c)",
    color: "#fff",
    fontSize: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 18px rgba(249, 115, 22, 0.3)",
  },
};