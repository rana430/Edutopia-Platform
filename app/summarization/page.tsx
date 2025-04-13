"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import PageIllustration from "@/components/page-illustration";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import Link from 'next/link';

interface Session {
  id: string;
  title: string;
  preview?: string;
}

interface SessionData {
  summarized_text: string;
  title?: string;
}

export default function SummarizationPage() {
  const router = useRouter();
  
  // State variables
  const [summaryText, setSummaryText] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSession, setLoadingSession] = useState(false);
  const [error, setError] = useState("");
  
  // Fetch session data on page load
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }
        
        const response = await fetch("http://localhost:5218/api/Session/GetAll", {
          headers: { "Token": token }
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch sessions");
        }

        const data = await response.json();
        
        // Extract the array from the $values property if it exists
        const sessionsArray = data.$values || data;
        
        if (Array.isArray(sessionsArray)) {
          setSessions(sessionsArray);
        } else {
          console.error("Expected an array but got:", sessionsArray);
          setSessions([]);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load sessions");
      }
    };

    fetchSessions();
    
    // Get the session ID from localStorage that was set during upload
    const sessionId = localStorage.getItem("currentSessionId");
    if (sessionId) {
      setCurrentSessionId(sessionId);
      fetchSessionData(sessionId);
    } else {
      setLoading(false);
    }
  }, [router]);

  // Fetch data for a specific session
  const fetchSessionData = async (sessionId: string) => {
    setLoadingSession(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5218/api/session/${sessionId}`, {
        headers: { "Token": token }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch session data");
      }

      const data: SessionData = await response.json();
      setSummaryText(data.summarized_text || "No summary available for this document.");
      setCurrentSessionId(sessionId);
      
      // Update localStorage with current session
      localStorage.setItem("currentSessionId", sessionId);
    } catch (err) {
      console.error(err);
      setError("Failed to load session summary");
      setSummaryText("Error loading summary. Please try again.");
    } finally {
      setLoadingSession(false);
      setLoading(false);
    }
  };

  // Function to handle session selection
  const handleSessionSelect = (sessionId: string) => {
    if (sessionId === currentSessionId && !loadingSession) return;
    setError("");
    fetchSessionData(sessionId);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.8 }}
      className="flex h-screen"
    >
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <motion.section 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative flex-1 flex justify-center items-center transition-all duration-300 ml-12"
      >
        {/* Page Illustration */}
        <PageIllustration />
        
        {/* Content Box */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-[80%] max-w-[1200px] bg-gray-900 text-white p-6 rounded-lg shadow-lg border border-indigo-500 relative z-10"
        >
          <motion.h2 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-2xl font-semibold text-indigo-300 text-center mb-4"
          >
            Summarized Text
          </motion.h2>
          
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-500/10 text-red-400 rounded-lg mb-4">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="relative">
              {loadingSession && (
                <div className="absolute inset-0 bg-gray-800/70 flex justify-center items-center z-20 rounded-lg">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    <p className="mt-4 text-indigo-300">Loading summary...</p>
                  </div>
                </div>
              )}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7 }}
                className="max-h-[650px] w-full p-6 overflow-y-auto bg-gray-800 rounded-lg shadow-md text-lg leading-relaxed scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-gray-700"
              >
                {summaryText || "Select a session to view its summary."}
              </motion.div>
            </div>
          )}
          
          {/* Buttons Container */}
          <div className="flex justify-center gap-4 mt-6">
            <button 
              onClick={() => {
                if (currentSessionId) {
                  localStorage.setItem("currentSessionId", currentSessionId);
                }
                router.push("/chatbot");
              }}
              className="px-6 py-3 bg-indigo-500 text-white rounded-lg shadow-md hover:bg-indigo-600 transition-all duration-300"
              disabled={loading || !currentSessionId || loadingSession}
            >
              Go to Chatbot
            </button>
            
            <button 
              onClick={async () => {
                if (currentSessionId) {
                  const token = localStorage.getItem("token");
                  await fetch(`http://localhost:5218/api/video/${currentSessionId}/diagrams/status`, {
                    headers: { "Token": token }
                  });
                  router.push("/diagrams");
                }
              }}
              className="px-6 py-3 bg-emerald-500 text-white rounded-lg shadow-md hover:bg-emerald-600 transition-all duration-300"
              disabled={loading || !currentSessionId || loadingSession}
            >
              Extract Diagrams
            </button>
          </div>
        </motion.div>
      </motion.section>
      
      {/* Right Sidebar - Session History */}
      <div className="w-64 bg-gray-900 text-white p-4 border-l border-gray-700 h-full overflow-y-auto">
        <h3 className="text-lg font-semibold text-indigo-400 mb-4">Session History</h3>
        
        {sessions.length === 0 ? (
          <div className="text-gray-400 text-center py-6">
            <p>No sessions found</p>
          </div>
        ) : (
          <ul>
            {sessions.map((session) => (
              <li 
                key={session.id} 
                className={`mb-4 p-3 ${currentSessionId === session.id ? 'bg-indigo-800' : 'bg-gray-800'} rounded-lg hover:bg-gray-700 cursor-pointer transition-colors ${loadingSession && currentSessionId === session.id ? 'opacity-70' : ''}`}
                onClick={() => handleSessionSelect(session.id)}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium">{session.title}</h4>
                  {loadingSession && currentSessionId === session.id && (
                    <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-indigo-300"></div>
                  )}
                </div>
                {session.preview && (
                  <p className="text-sm text-gray-400 mt-1">{session.preview}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}