import { createContext, useContext, useState } from "react";
import { API_URL } from "../config/api"
const ChatCopilotContext = createContext(null);

export function ChatCopilotProvider({ children }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  const [pageContext, setPageContext] = useState(null);

  const handleSend = async (e, actualPageContext) => {
    e.preventDefault();

    if (!input.trim() || loading) return;

    const currentInput = input;

    setMessages((prev) => [
      ...prev,
      { type: "user", content: currentInput }
    ]);

    setInput("");
    setLoading(true);

    try {
      const session_id = actualPageContext?.session_id || "DEMO_001";

      const res = await fetch(`${API_URL}/copilot/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: currentInput,
            session_id,
          }),
        });

      if (!res.ok) throw new Error(`Error backend: ${res.status}`);

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { type: "ai", content: data.response }
      ]);

    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { type: "signal", content: "Error al conectar con el copiloto" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChatCopilotContext.Provider
      value={{
        input,
        setInput,
        loading,
        messages,
        handleSend,
        pageContext,
        setPageContext,
      }}
    >
      {children}
    </ChatCopilotContext.Provider>
  );
}

export function useChatCopilotContext() {
  const context = useContext(ChatCopilotContext);

  if (!context) {
    throw new Error("useChatCopilotContext must be used inside provider");
  }

  return context;
}