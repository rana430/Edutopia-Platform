"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar";
import PageIllustration from "@/components/page-illustration";
import { motion } from "framer-motion";

export default function SummarizationPage() {
  const [summaryText, setSummaryText] = useState(
    "I can’t believe how much time has passed since we last caught up! Lately, I’ve been thinking about you and all the great memories we shared, and I realized I just had to reach out..."
  );

  const [sessions, setSessions] = useState([
    { id: 1, title: "PDF Summary - March 29", preview: "Summary of uploaded PDF..." },
    { id: 2, title: "Video Summary - March 28", preview: "Summary of analyzed video..." },
  ]);

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
        <PageIllustration/>

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
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
            className="max-h-[650px] w-full p-6 overflow-y-auto bg-gray-800 rounded-lg shadow-md text-lg leading-relaxed scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-gray-700"
          >
            {summaryText}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Right Sidebar - Session History */}
      <div className="w-64 bg-gray-900 text-white p-4 border-l border-gray-700 h-full overflow-y-auto">
        <h3 className="text-lg font-semibold text-indigo-400 mb-4">Session History</h3>
        <ul>
          {sessions.map((session) => (
            <li key={session.id} className="mb-4 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer">
              <h4 className="text-md font-medium">{session.title}</h4>
              <p className="text-sm text-gray-400">{session.preview}</p>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
