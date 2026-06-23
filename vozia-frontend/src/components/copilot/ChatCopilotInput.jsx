import React from "react";
import { Send } from "lucide-react";

export default function ChatCopilotInput({ input, setInput, handleSend }) {
  return (
    <>
      <div className="p-4">
        <form
          onSubmit={handleSend}
          className="
            relative flex items-center gap-2
            px-3 py-2 rounded-2xl
            bg-white/5 border border-white/10
            backdrop-blur-2xl
            focus-within:bg-white/10
            focus-within:border-white/20
            transition
          "
        >
          <div className="absolute inset-0 rounded-2xl opacity-20 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta sobre los ingresos, el crecimiento, los clientes..."
            className="
              flex-1 bg-transparent outline-none
              text-sm text-slate-100 placeholder:text-slate-500
            "
          />

          <button
            type="submit"
            className="
              w-8 h-8 rounded-lg
              flex items-center justify-center
              bg-white/5 hover:bg-white/10
              text-slate-300
              transition
            "
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </>
  );
}
