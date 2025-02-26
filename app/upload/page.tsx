"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "@/components/sidebar";
import PageIllustration from "@/components/page-illustration";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoLink, setVideoLink] = useState("");
  const [uploadType, setUploadType] = useState<"file" | "link">("file");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "video/mp4",
        "video/avi",
        "video/quicktime",
      ];
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        alert("Invalid file type. Please upload a PDF, PowerPoint, or video file.");
        event.target.value = "";
      }
    }
  };

  const handleLinkChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVideoLink(event.target.value);
  };

  const handleUpload = () => {
    if (uploadType === "file") {
      alert(selectedFile ? `Uploading file: ${selectedFile.name}` : "No file selected.");
    } else {
      const isValidUrl = videoLink.startsWith("http") || videoLink.startsWith("www");
      alert(isValidUrl ? `Uploading video link: ${videoLink}` : "Invalid video link.");
    }
  };

  return (
    <div className="flex h-screen relative">
      {/* Sidebar - Ensuring it's on top */}
      <div className="relative z-50">
        <Sidebar />
      </div>

      {/* Page Illustration in Background */}
      <div className="absolute inset-0 -z-10">
        <PageIllustration />
      </div>

      {/* Main Content */}
      <section className="flex-1 flex justify-center items-center transition-all duration-300 ml-12 relative z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="py-12 md:py-20"
          >
            {/* Page Title */}
            <div className="pb-12 text-center">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-5 font-nacelle text-4xl font-semibold text-transparent md:text-5xl"
              >
                Upload your content
              </motion.h1>
            </div>

            {/* Upload Type Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              className="flex space-x-4 justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`px-4 py-2 rounded-md text-white transition-all ${
                  uploadType === "file" ? "bg-indigo-600" : "bg-gray-600"
                }`}
                onClick={() => setUploadType("file")}
              >
                Upload File
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`px-4 py-2 rounded-md text-white transition-all ${
                  uploadType === "link" ? "bg-indigo-600" : "bg-gray-600"
                }`}
                onClick={() => setUploadType("link")}
              >
                Upload Video Link
              </motion.button>
            </motion.div>

            {/* Upload Section */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
              className="mx-auto mt-8 max-w-[400px] space-y-5"
            >
              {uploadType === "file" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-indigo-200">
                    Select a file (PDF, PowerPoint, or Video)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.ppt,.pptx,video/*"
                    onChange={handleFileChange}
                    className="form-input w-full bg-gray-800 text-white border border-indigo-500 rounded-lg focus:ring-2 focus:ring-indigo-400 placeholder-gray-300"
                  />
                  {selectedFile && <p className="mt-2 text-indigo-200">{selectedFile.name}</p>}
                </div>
              )}

              {uploadType === "link" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-indigo-200">
                    Enter a video link (YouTube, Vimeo, etc.)
                  </label>
                  <input
                    type="url"
                    placeholder="Paste your video link here..."
                    value={videoLink}
                    onChange={handleLinkChange}
                    className="form-input w-full bg-gray-800 text-white border border-indigo-500 rounded-lg focus:ring-2 focus:ring-indigo-400 placeholder-gray-300"
                  />
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-full bg-indigo-600 text-white rounded-lg py-2 hover:bg-indigo-700 transition-all"
                onClick={handleUpload}
              >
                 Upload
              </motion.button>
            </motion.form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
