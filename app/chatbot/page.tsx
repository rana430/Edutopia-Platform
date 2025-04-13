"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, FileText, MessageSquare, LogOut, Upload, AlertCircle } from "lucide-react";
import Sidebar from "@/components/sidebar";
interface Session {
  id: string;
  title: string;
}

interface SessionData {
  user_messages: string;  // Comma-separated string
  ai_responses: string;   // Comma-separated string
  summarized_text: string;
}

interface ChatMessage {
  text: string; 
  isUser: boolean; 
  isVisible: boolean;
  displayedText?: string;
  isTyping?: boolean;
}

export default function Chatbot() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Animation states
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Add session loading state
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  
  // Keep track of messages added during the current session
  const [currentSessionMessages, setCurrentSessionMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5218/api/Session/GetAll", {
          headers: { "Token": token }
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            router.push("/upload");
            return;
          }
          throw new Error("Failed to fetch sessions");
        }

        const data = await response.json();
        
        // Extract the array from the $values property if it exists
        const sessionsArray = data.$values || data;
        console.log("Fetched sessions:", sessionsArray);
        
        // Make sure we're working with an array
        
        if (Array.isArray(sessionsArray)) {
          setSessions(sessionsArray);
          
          if (sessionsArray.length > 0) {
            fetchSessionData(sessionsArray[0].id, true);
          }
        } else {
          console.error("Expected an array but got:", sessionsArray);
          setSessions([]);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load sessions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Convert session data to animated messages format when session changes
  useEffect(() => {
    if (currentSession) {
      const historicalMessages: ChatMessage[] = [];
      
      // Split comma-separated messages and responses
      const userMsgs = currentSession.user_messages?.split(',').filter(msg => msg.trim() !== '') || [];
      const aiResps = currentSession.ai_responses?.split(',').filter(resp => resp.trim() !== '') || [];
      
      // If there are no messages, add a welcome message
      if (userMsgs.length === 0 && aiResps.length === 0) {
        historicalMessages.push({
          text: "Hi, I'm here to help you! Feel free to ask me anything about this document.",
          isUser: false,
          isVisible: true,
          displayedText: "Hi, I'm here to help you! Feel free to ask me anything about this document.",
          isTyping: false
        });
      } else {
        // Combine user messages and AI responses in sequence
        userMsgs.forEach((msg, index) => {
          // Add user message
          historicalMessages.push({
            text: msg.trim(),
            isUser: true,
            isVisible: true
          });
          
          // Add corresponding AI response if it exists
          if (index < aiResps.length) {
            historicalMessages.push({
              text: aiResps[index].trim(),
              isUser: false,
              isVisible: true,
              displayedText: aiResps[index].trim(),
              isTyping: false
            });
          }
        });
      }
      
      // Replace all messages with the historical ones for the current session
      setMessages(historicalMessages);
      
      // Reset current session messages when switching
      setCurrentSessionMessages([]);
    }
  }, [currentSession]);

  // Effect to animate new messages appearing
  useEffect(() => {
    const newMessages = messages.filter(msg => !msg.isVisible);
    if (newMessages.length > 0) {
      // Add a small delay before showing the message
      const timer = setTimeout(() => {
        setMessages(prevMessages => 
          prevMessages.map((msg, i) => {
            if (!msg.isVisible) {
              return { 
                ...msg, 
                isVisible: true,
                displayedText: msg.isUser ? msg.text : "", // Start empty for bot messages
                isTyping: !msg.isUser // Start typing animation for bot messages
              };
            }
            return msg;
          })
        );
      }, 300); // 300ms delay before showing the message
      
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // Effect for typing animation
  useEffect(() => {
    const typingMessage = messages.find(msg => msg.isTyping && msg.isVisible);
    
    if (typingMessage) {
      const fullText = typingMessage.text;
      const currentText = typingMessage.displayedText || "";
      
      if (currentText.length < fullText.length) {
        // Continue typing
        const timer = setTimeout(() => {
          setMessages(prevMessages => 
            prevMessages.map(msg => {
              if (msg === typingMessage) {
                const nextChar = fullText.charAt(currentText.length);
                const newDisplayedText = currentText + nextChar;
                
                return {
                  ...msg,
                  displayedText: newDisplayedText,
                  isTyping: newDisplayedText.length < fullText.length
                };
              }
              return msg;
            })
          );
        }, 5 + Math.random() * 10); // Faster typing animation
        
        return () => clearTimeout(timer);
      }
    }
  }, [messages]);

  const fetchSessionData = async (sessionId: string, isInitialLoad = false) => {
    try {
      // Set session loading state to true
      setIsSessionLoading(true);
      
      // Reset any existing messages immediately when switching sessions
      if (!isInitialLoad) {
        setMessages([]);
        setCurrentSessionMessages([]);
      }
      
      // Update current session ID immediately
      setCurrentSessionId(sessionId);
      
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5218/api/session/${sessionId}`, {
        headers: { "Token": token }
      });

      if (!response.ok) throw new Error("Failed to fetch session data");

      const data: SessionData = await response.json();
      
      // Now we set the current session with the fetched data
      setCurrentSession(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load session data. Please try again.");
      setCurrentSession(null); // Reset current session on error
    } finally {
      // Set session loading state to false when done
      setIsSessionLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentSessionId) return;
    
    // Create a new user message
    const newUserMessage: ChatMessage = { 
      text: input, 
      isUser: true, 
      isVisible: false 
    };
    
    // Add to both messages arrays
    setMessages(prev => [...prev, newUserMessage]);
    setCurrentSessionMessages(prev => [...prev, newUserMessage]);
    
    const userInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5218/api/Chat/c`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Token': token
        },
        body: JSON.stringify({ 
          query: userInput,
          id: currentSessionId  // Using currentSessionId instead of hardcoded value
        })
      });

      if (!response.ok) throw new Error("Failed to send message");
      
      const responseData = await response.json();
      
      // Add AI response to UI
      const aiResponse: ChatMessage = {
        text: responseData.response || "I received your message.",
        isUser: false,
        isVisible: false
      };
      
      // Add to both message arrays
      setMessages(prev => [...prev, aiResponse]);
      setCurrentSessionMessages(prev => [...prev, aiResponse]);
      
    } catch (err) {
      console.error(err);
      setError("Failed to send message. Please try again.");
      
      // Add error message to chat
      const errorMessage: ChatMessage = { 
        text: "Failed to send message. Please try again.", 
        isUser: false,
        isVisible: false
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setCurrentSessionMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar />

      <div className="flex flex-1 flex-col items-center justify-center transition-all duration-300 ml-[60px] mr-[250px]">
        <h1 className="animate-gradient bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-5 font-nacelle text-4xl font-semibold text-transparent md:text-5xl">
          Chat History
        </h1>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 text-red-400 rounded-lg mb-4">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        <div className="w-full max-w-2xl flex flex-col bg-gray-800 rounded-lg p-4 shadow-lg h-[70vh] overflow-y-auto">
          {!currentSession ? (
            <div className="flex flex-col justify-center items-center h-full text-gray-400 space-y-4">
              <p>No chat session selected</p>
              <Link href="/upload">
                <button className="px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-600 text-white transition-colors">
                  Upload New Document
                </button>
              </Link>
            </div>
          ) : isSessionLoading ? (
            // ChatGPT-like loading effect
            <div className="flex flex-col justify-center items-center h-full text-gray-400 space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <p>Loading conversation...</p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <motion.div 
                  key={index} 
                  className={`flex ${msg.isUser ? "justify-end" : "justify-start"} my-1`}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ 
                    opacity: msg.isVisible ? 1 : 0, 
                    y: msg.isVisible ? 0 : 20,
                    scale: msg.isVisible ? 1 : 0.8 
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`px-4 py-2 rounded-lg ${msg.isUser ? "bg-indigo-500 text-white" : "bg-gray-700 text-gray-200"}`}>
                    {msg.isUser ? msg.text : msg.displayedText}
                    {msg.isTyping && (
                      <span className="inline-block w-1 h-4 ml-1 bg-gray-200 animate-blink"></span>
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start my-1">
                  <div className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 flex items-center">
                    <span className="mr-2">Thinking</span>
                    <span className="loading-dots">
                      <span className="dot-1">.</span>
                      <span className="dot-2">.</span>
                      <span className="dot-3">.</span>
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="w-full max-w-2xl mt-4 flex">
          <input
            type="text"
            className="flex-1 p-3 rounded-l-lg bg-gray-700 text-white border-none focus:outline-none"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={!currentSession || isLoading || isSessionLoading}
          />
          <button 
            onClick={sendMessage} 
            disabled={!currentSession || isLoading || isSessionLoading}
            className={`px-4 text-white rounded-r-lg ${isLoading || !currentSession || isSessionLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'}`}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      <motion.aside className="fixed top-0 right-0 h-screen w-[250px] bg-gray-900 text-white shadow-lg flex flex-col py-6 overflow-hidden">
        <div className="px-4">
          <h2 className="text-xl font-bold mb-4">Your Sessions</h2>
          {sessions.length === 0 ? (
            <div className="text-center text-gray-400">
              <p className="mb-4">No sessions found</p>
              <Link href="/upload">
                <button className="px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors">
                  Upload Document
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-gray-800">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => fetchSessionData(session.id)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    currentSessionId === session.id
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                  disabled={isSessionLoading}
                >
                  <div className="font-medium">{session.title}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.aside>

      <style jsx>{`
        .loading-dots {
          display: inline-block;
        }
        .loading-dots span {
          animation: pulse 1.4s infinite;
          animation-fill-mode: both;
          margin-left: 2px;
        }
        .dot-1 { animation-delay: 0.0s; }
        .dot-2 { animation-delay: 0.2s; }
        .dot-3 { animation-delay: 0.4s; }
        
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0; }
          40% { opacity: 1; }
        }

        @keyframes blink {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        
        .animate-blink {
          animation: blink 0.8s infinite;
        }
      `}</style>
    </div>
  );
}