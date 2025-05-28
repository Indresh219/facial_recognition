import React, { useState, useEffect, useRef } from "react";

export default function ChatWidget() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const socket = useRef(null);

  useEffect(() => {
    socket.current = new WebSocket("ws://localhost:4000");

    socket.current.onmessage = (event) => {
      setMessages((prev) => [...prev, { sender: "bot", text: event.data }]);
    };

    return () => socket.current.close();
  }, []);

  const sendMessage = () => {
    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    socket.current.send(input);
    setInput("");
  };

  return (
    <div className="p-4 max-w-md mx-auto border rounded shadow">
      <div className="h-64 overflow-y-scroll border p-2 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 text-${msg.sender === "bot" ? "blue" : "green"}-600`}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <h1>Chat BOT</h1>
      <input
        className="border p-2 w-full"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        placeholder="Ask something..."
      />
    </div>
  );
}
