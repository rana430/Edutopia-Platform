"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Home, FileText, MessageSquare, LogOut } from "lucide-react"; // Icons

export default function Chatbot() {
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() === "") return;
    setMessages([...messages, { text: input, isUser: true }, { text: "Hello! How can I help you?", isUser: false }]);
    setInput("");
  };

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar */}
      <motion.aside
        initial={{ width: "60px" }}
        animate={{ width: isSidebarOpen ? "250px" : "60px" }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 h-screen bg-gray-900 text-white shadow-lg flex flex-col py-6 overflow-hidden"
        onMouseEnter={() => setIsSidebarOpen(true)}
        onMouseLeave={() => setIsSidebarOpen(false)}
      >
        <h2 className={`mt-2 ml-5 text-2xl font-bold transition-opacity ${isSidebarOpen ? "opacity-100" : "opacity-0"}`}>
          Edutopia
        </h2>

        <nav className="w-full flex flex-col mt-10 space-y-4">
          <NavItem href="/" icon={<Home size={24} />} text="Home" isOpen={isSidebarOpen} />
          <NavItem href="/summarization" icon={<FileText size={24} />} text="Summarize" isOpen={isSidebarOpen} />
          <NavItem href="/chatbot" icon={<MessageSquare size={24} />} text="Chatbot" isOpen={isSidebarOpen} />
          <NavItem href="/" icon={<LogOut size={24} />} text="Log out" isOpen={isSidebarOpen} />  
        </nav>
      </motion.aside> 

      {/* Chat area */}
      <div className={`flex flex-col flex-1 items-center justify-center transition-all duration-300 ${isSidebarOpen ? "ml-[250px]" : "ml-[60px]"}`}>
        {/* Updated Heading with Gradient Animation */}
        <h1 
          className="animate-gradient bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-5 font-nacelle text-4xl font-semibold text-transparent md:text-5xl"
          data-aos="fade-up"
        >
          Welcome to our chatbot
        </h1>

        <div className="w-full max-w-2xl flex flex-col bg-gray-800 rounded-lg p-4 shadow-lg h-[70vh] overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex justify-start my-1">
              <div className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200">
                Ask me about anything
              </div>
            </div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.isUser ? "justify-end" : "justify-start"} my-1`}>
              <div className={`px-4 py-2 rounded-lg ${msg.isUser ? "bg-indigo-500 text-white" : "bg-gray-700 text-gray-200"}`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="w-full max-w-2xl mt-4 flex">
          <input
            type="text"
            className="flex-1 p-3 rounded-l-lg bg-gray-700 text-white border-none focus:outline-none"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage} className="px-4 bg-indigo-500 text-white rounded-r-lg hover:bg-indigo-600">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// Sidebar Nav Item Component
function NavItem({ href, icon, text, isOpen }: { href: string; icon: React.ReactNode; text: string; isOpen: boolean }) {
  return (
    <Link href={href}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        className="w-full flex items-center px-4 py-4 rounded-lg hover:bg-indigo-500 transition-all"
      >
        {icon}
        {isOpen && <span className="ml-4">{text}</span>}
      </motion.button>
    </Link>
  );
}
