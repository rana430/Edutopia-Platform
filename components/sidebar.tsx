"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, FileText, MessageSquare, LogOut } from "react-feather"; // Importing icons

export default function Sidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
          <NavItem href="/upload" icon={<Home size={24} />} text="Home" isOpen={isSidebarOpen} />
          <NavItem href="/summarization" icon={<FileText size={24} />} text="Summarize" isOpen={isSidebarOpen} />
          <NavItem href="/chatbot" icon={<MessageSquare size={24} />} text="Chatbot" isOpen={isSidebarOpen} />
          <NavItem href="/" icon={<LogOut size={24} />} text="Log out" isOpen={isSidebarOpen} />  
        </nav>
      </motion.aside>
    </div> // Closing div tag added
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

