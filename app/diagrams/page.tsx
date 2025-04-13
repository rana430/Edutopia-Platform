"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import PageIllustration from "@/components/page-illustration";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { AlertCircle, FileWarning } from "lucide-react";

// Add this style to hide the navigation bar
const hideNavStyle = {
  nav: {
    display: 'none'
  }
};

interface Diagram {
  filePath: string;
  id: string;
}

interface DiagramResponse {
  $id: string;
  diagrams: {
    $id: string;
    $values: Diagram[];
  };
}

export default function DiagramsPage() {
  const router = useRouter();
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    const sessionId = localStorage.getItem("currentSessionId");
    if (!sessionId) {
      router.push("/");
      return;
    }
  
    // Only fetch once on initial mount
    fetchDiagrams(sessionId);
  }, []); // Empty dependency array ensures it runs only once
  
  const fetchDiagrams = async (sessionId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`http://localhost:5218/api/video/${sessionId}/diagrams`, {
        headers: { "Token": token }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch diagrams");
      }

      const data = await response.json();
      // Parse the nested structure and extract diagrams from $values
      const diagramsArray = data.diagrams?.$values || [];
      const parsedDiagrams = diagramsArray.map(diagram => ({
        id: diagram.id,
        filePath: diagram.filePath.replace('F:\\GP\\Frontend\\Edutopia-frontend\\public', '').replace(/\\/g, '/')
      }));
      setDiagrams(parsedDiagrams);
      console.log("Diagrams:", parsedDiagrams);
    } catch (err) {
      console.error(err);
      setError("Failed to load diagrams");
      setDiagrams([]); // Ensure diagrams is always an array
    } finally {
      setLoading(false);
    }
  };

  // No longer need the file:// URL conversion since we're using web paths
  // Remove or comment out the getImageUrl function
  // const getImageUrl = (filePath: string) => {
  //   return `file:///${filePath.replace(/\\/g, '/')}`;
  // };

  const extractDiagrams = async () => {
    try {
      setExtracting(true);
      const sessionId = localStorage.getItem("currentSessionId");
      const token = localStorage.getItem("token");

      if (!sessionId || !token) {
        throw new Error("Session ID or token missing");
      }

      // Check diagrams status
      const statusResponse = await fetch(`http://localhost:5218/api/video/${sessionId}/diagrams/status`, {
        headers: { "Token": token }
      });
      
      if (!statusResponse.ok) {
        throw new Error("Failed to check diagram status");
      }

      // Fetch diagrams after checking status
      await fetchDiagrams(sessionId);
      setExtracting(false);

    } catch (err) {
      console.error(err);
      setError("Failed to extract diagrams");
      setExtracting(false);
    }
  };

  // Convert Windows path to file:// URL
  const getImageUrl = (filePath: string) => {
    // Replace backslashes with forward slashes and add file:// protocol
    return `file:///${filePath.replace(/\\/g, '/')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.8 }}
      className="flex h-screen"
    >
      <Sidebar />
      
      <motion.section 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative flex-1 flex flex-col p-6 ml-12 overflow-y-auto"
      >
        <PageIllustration />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full bg-gray-900 text-white p-6 rounded-lg shadow-lg border border-indigo-500 relative z-10 mb-8"
        >
          <motion.h2 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-2xl font-semibold text-indigo-300 text-center mb-4"
          >
            Extracted Diagrams
          </motion.h2>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-500/10 text-red-400 rounded-lg mb-4">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          {diagrams.length === 0 && (
            <div className="flex justify-center mb-6">
              <button
                onClick={extractDiagrams}
                disabled={extracting}
                className="px-6 py-3 bg-indigo-500 text-white rounded-lg shadow-md hover:bg-indigo-600 transition-all duration-300 disabled:opacity-50"
              >
                {extracting ? 'Extracting...' : 'Extract Diagrams'}
              </button>
            </div>
          )}

          {loading || extracting ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : diagrams.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              No diagrams found. Click "Extract Diagrams" to start the extraction process.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {diagrams.map((diagram, index) => (
                <motion.div 
                  key={diagram.id || index}
                  className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-indigo-500/20 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="relative h-48 w-full bg-gray-700 flex justify-center items-center">
                    <img
                      src={diagram.filePath}
                      alt={`Diagram ${index + 1}`}
                      className="object-contain h-full w-full p-2"
                      onError={(e) => {
                        // Error handling code remains the same
                      }}
                    />
                  </div>
                  <div className="p-4 border-t border-gray-700">
                    <p className="text-sm text-gray-300 font-medium">Diagram {index + 1}</p>
                    <p className="text-xs text-gray-400 truncate mt-1">
                      {diagram.filePath.split('\\').pop()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.section>
    </motion.div>
  );
}