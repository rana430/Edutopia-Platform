"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, FileText, Upload, Loader2, X, Send, Sparkles, MessageCircle, BookOpen, History, LogOut, Plus, Paperclip, Zap, HelpCircle, ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
// The 'next/navigation' import has been removed as it's specific to the Next.js framework.
// Standard browser APIs will be used for navigation instead.

// This is a placeholder for your logo component.
// In a real app, you would import it from your project structure.
 import Fulllogo from "@/components/ui/fulllogo";


interface Message {
  text: string;
  isUser: boolean;
  timestamp?: Date;
}

interface Session {
  id: number;
  title: string;
  preview: string;
  type?: string;
}

// Interface for Quiz Questions
interface QuizQuestion {
    id: number;
    questionText: string;
    options: string[];
    correctAnswerIndex: number;
}

// Dummy Quiz Data (This should be replaced by data from your backend)
const dummyQuestions: QuizQuestion[] = [
    {
        id: 1,
        questionText: "What is the primary goal of gradient descent in machine learning?",
        options: [
            "To randomly initialize weights",
            "To find the minimum of a cost function",
            "To increase model complexity",
            "To perform data normalization"
        ],
        correctAnswerIndex: 1
    },
    {
        id: 2,
        questionText: "Which of the following is a core component of a neural network?",
        options: [
            "A decision tree",
            "A support vector",
            "A neuron or node",
            "A cluster centroid"
        ],
        correctAnswerIndex: 2
    },
    {
        id: 3,
        questionText: "What does 'backpropagation' refer to?",
        options: [
            "A method for improving data quality",
            "The process of feeding data forward through a network",
            "A technique for deploying models to production",
            "An algorithm for training neural networks by calculating gradients"
        ],
        correctAnswerIndex: 3
    }
];


export default function ModernChatbotUI() {
  // Chatbot state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Left Panel State
  const [activeView, setActiveView] = useState<'summary' | 'diagrams' | 'quiz'>('summary');
  
  // Summarization state
  const [summaryText, setSummaryText] = useState(
    "The lecture covered various topics including machine learning fundamentals, neural networks, and their applications in modern technology. The key concepts discussed were gradient descent, backpropagation, and the importance of data preprocessing in achieving optimal model performance."
  );
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  // --- Quiz State Management ---
  const [quizState, setQuizState] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: number}>({});
  const [score, setScore] = useState(0);

  const handleStartQuiz = () => {
    // In a real app, you would fetch questions from the backend here
    // For now, we use dummy data.
    setQuestions(dummyQuestions);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setScore(0);
    setQuizState('in_progress');
  };

  const handleSelectAnswer = (questionId: number, optionIndex: number) => {
    setSelectedAnswers(prev => ({...prev, [questionId]: optionIndex}));
  };

  const handleSubmitQuiz = () => {
    let finalScore = 0;
    questions.forEach(q => {
        if (selectedAnswers[q.id] === q.correctAnswerIndex) {
            finalScore++;
        }
    });
    setScore(finalScore);
    setQuizState('completed');
  };

  const handleRetryQuiz = () => {
    setQuizState('not_started');
  };
  
  // Diagrams placeholder content
  const diagramsContent = (
    <div className="space-y-4">
      {['Concept Map', 'Flow Chart', 'Timeline'].map((title, index) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="group relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 hover:border-violet-500/50 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <h3 className="text-violet-300 font-semibold mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-violet-400" />
            {title}
          </h3>
          <div className="h-32 bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-xl flex items-center justify-center border border-slate-600/30">
            <span className="text-slate-400 font-medium">
              {title === 'Concept Map' ? 'Neural Network Architecture' : 
               title === 'Flow Chart' ? 'ML Training Process' : 'Learning Progress'}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );

  // --- Quiz Content with Full MCQ Logic ---
  const quizContent = (
    <AnimatePresence mode="wait">
        {quizState === 'not_started' && (
            <motion.div key="start" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="text-center">
                <div className="group relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50">
                    <HelpCircle size={40} className="mx-auto text-cyan-400 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Knowledge Check</h3>
                    <p className="text-slate-400 mb-6">Test your understanding of the material with a quick quiz.</p>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleStartQuiz} className="w-full py-3 bg-gradient-to-r from-cyan-600 to-violet-600 text-white rounded-xl font-semibold hover:from-cyan-700 hover:to-violet-700 transition-all duration-300 shadow-lg">
                        Start Quiz
                    </motion.button>
                </div>
            </motion.div>
        )}
        {quizState === 'in_progress' && questions.length > 0 && (
            <motion.div key="progress" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.4, ease: "easeInOut" }}>
                <div className="mb-4 text-sm font-medium text-slate-400">Question {currentQuestionIndex + 1} of {questions.length}</div>
                <p className="text-lg font-semibold text-white mb-6 min-h-[80px]">{questions[currentQuestionIndex].questionText}</p>
                <div className="space-y-3 mb-8">
                    {questions[currentQuestionIndex].options.map((option, index) => (
                        <motion.button key={index} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleSelectAnswer(questions[currentQuestionIndex].id, index)}
                            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${selectedAnswers[questions[currentQuestionIndex].id] === index ? 'bg-violet-500/20 border-violet-500 text-white font-semibold' : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 text-slate-300'}`}>
                            {option}
                        </motion.button>
                    ))}
                </div>
                <div className="flex justify-between items-center">
                    <motion.button onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} disabled={currentQuestionIndex === 0} className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed">
                        <ChevronLeft size={18} /> Prev
                    </motion.button>
                    {currentQuestionIndex < questions.length - 1 ? (
                        <motion.button onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
                            Next <ChevronRight size={18} />
                        </motion.button>
                    ) : (
                         <motion.button onClick={handleSubmitQuiz} disabled={selectedAnswers[questions[currentQuestionIndex].id] === undefined} className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-violet-600 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            Finish
                        </motion.button>
                    )}
                </div>
            </motion.div>
        )}
        {quizState === 'completed' && (
             <motion.div key="completed" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
                <div className="text-center p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                    <h3 className="text-2xl font-bold text-white mb-2">Quiz Completed!</h3>
                    <p className="text-slate-300 mb-6">You scored</p>
                    <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-400 mb-8">{score} / {questions.length}</div>
                     <motion.button onClick={handleRetryQuiz} className="w-full py-3 bg-gradient-to-r from-cyan-600 to-violet-600 text-white rounded-xl font-semibold hover:from-cyan-700 hover:to-violet-700 transition-all duration-300">
                        Try Again
                    </motion.button>
                </div>
                <div className="mt-6 space-y-4">
                     <h4 className="text-lg font-semibold text-white">Review Your Answers</h4>
                     {questions.map((q, index) => {
                         const userAnswer = selectedAnswers[q.id];
                         const isCorrect = userAnswer === q.correctAnswerIndex;
                         return (
                            <div key={q.id} className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
                                <p className="font-medium text-slate-300 mb-3">{index + 1}. {q.questionText}</p>
                                <div className={`flex items-start gap-3 p-3 rounded-md text-sm ${isCorrect ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
                                    {isCorrect ? <CheckCircle size={20} className="flex-shrink-0 mt-0.5" /> : <XCircle size={20} className="flex-shrink-0 mt-0.5" />}
                                    <div>
                                        <p className="font-semibold">{userAnswer !== undefined ? q.options[userAnswer] : "No answer selected"}{isCorrect ? " (Correct)" : " (Incorrect)"}</p>
                                        {!isCorrect && (<p className="mt-1 text-slate-400">Correct answer: <span className="font-medium text-green-400">{q.options[q.correctAnswerIndex]}</span></p>)}
                                    </div>
                                </div>
                            </div>
                         );
                     })}
                </div>
            </motion.div>
        )}
    </AnimatePresence>
  );
  
  // Sessions state
  const [sessions] = useState<Session[]>([
    { id: 1, title: "PDF Summary - March 29", preview: "Summary of uploaded PDF..." },
    { id: 2, title: "Video Summary - March 28", preview: "Summary of analyzed video..." },
    { id: 3, title: "Lecture Notes - March 27", preview: "AI and Machine Learning basics..." },
  ]);

  // Upload popup state
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [uploadType, setUploadType] = useState<"file" | "link">("file");
  const [videoUrl, setVideoURL] = useState("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- RESTORED: Backend Integrated Functions ---

  const sendMessage = async () => {
    if (input.trim() === "" || isLoading) return;
    const userMessage: Message = { text: input, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setChatHistory(prev => [input, ...prev]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, context: summaryText, history: chatHistory.slice(0, 5) }),
      });
      if (response.ok) {
        const data = await response.json();
        const aiMessage: Message = { text: data.response || data.message || "I can help with that.", isUser: false, timestamp: new Date() };
        setMessages(prev => [...prev, aiMessage]);
      } else { throw new Error('API response not ok'); }
    } catch (error) {
      console.error('Error sending message:', error);
      const fallbackMessage: Message = { text: "Sorry, I'm having trouble connecting right now.", isUser: false, timestamp: new Date() };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsProcessingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem("token");
      if (!token) { throw new Error("Authentication required"); }
      const response = await fetch("http://localhost:5218/api/videos/upload", {
        method: "POST", headers: { "Token": token }, body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("videoId", data.videoId);
        setSummaryText(data.summary || data.text || `Summary of ${file.name} is ready.`);
        const systemMessage: Message = { text: `✨ I've processed "${file.name}". Ask away!`, isUser: false, timestamp: new Date() };
        setMessages(prev => [...prev, systemMessage]);
        setShowUploadPopup(false);
      } else { throw new Error('Upload failed'); }
    } catch (error) {
      console.error('Error uploading file:', error);
      setSummaryText(`Content from ${file.name} is available for discussion.`);
      const fallbackMessage: Message = { text: `I've received "${file.name}". Let's discuss it.`, isUser: false, timestamp: new Date() };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsProcessingFile(false);
      event.target.value = '';
    }
  };

  const handleVideoUrlUpload = async () => {
    if (!videoUrl.startsWith("http")) { alert("Invalid video link."); return; }
    setIsProcessingFile(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { throw new Error("Authentication required"); }
      const response = await fetch("http://localhost:5218/api/videos/upload", {
        method: "POST", mode: "cors", headers: { "Content-Type": "application/json", "Token": token }, body: JSON.stringify({ videoUrl }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("videoId", data.videoId);
        setSummaryText(data.summary || data.text || `Video content from ${videoUrl} is ready.`);
        const systemMessage: Message = { text: "✨ I've processed the video. Ask away!", isUser: false, timestamp: new Date() };
        setMessages(prev => [...prev, systemMessage]);
        setShowUploadPopup(false);
      } else { throw new Error(data.message || "Upload failed"); }
    } catch (error) {
      console.error('Error uploading video URL:', error);
      alert(error.message || "Failed to upload video URL");
    } finally {
      setIsProcessingFile(false);
      setVideoURL("");
    }
  };
  
  const loadSession = async (sessionId: number) => {
    const session = sessions.find(s => s.id === sessionId);
    if(session) {
        setSummaryText(session.preview);
        setMessages([]);
    }
  };
  
  const handleLogout = () => {
    // Replaced Next.js router with standard web API for navigation
    window.location.href = "/";
  };

  useEffect(() => {
    setShowUploadPopup(true);
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col relative overflow-hidden font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 p-4 z-10">
        <div className="flex justify-between items-center">
          <Fulllogo />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowUploadPopup(true)} className="relative group px-6 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-semibold overflow-hidden">
            <div className="relative flex items-center space-x-2"><Plus size={18} /> <span>New Upload</span></div>
          </motion.button>
        </div>
      </motion.div>
      <AnimatePresence>
        {showUploadPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 w-full max-w-lg border border-slate-700/50 shadow-2xl"> 
              <button onClick={() => setShowUploadPopup(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800/50 rounded-xl"> <X size={20} /> </button>
              <div className="relative">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3"><Upload className="text-violet-400" size={28} /> Upload Content</h2>
                <p className="text-slate-400 mb-8">Share your learning materials with AI</p>
                <div className="flex space-x-2 mb-8">
                  <motion.button onClick={() => setUploadType("file")} className={`flex-1 py-4 px-6 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${ uploadType === "file" ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg" : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50" }`}> <Paperclip size={18} /> Upload File </motion.button>
                  <motion.button onClick={() => setUploadType("link")} className={`flex-1 py-4 px-6 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${ uploadType === "link" ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg" : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50" }`}> <Zap size={18} /> Video Link </motion.button>
                </div>
                {uploadType === "file" ? (
                  <label className="block"><span className="text-slate-300 font-medium mb-3 block">Select your file</span><input type="file" accept=".pdf,.ppt,.pptx,video/*" onChange={handleFileUpload} className="block w-full text-slate-300 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:font-semibold file:bg-violet-500 file:text-white hover:file:bg-violet-600 file:transition-all file:duration-300" disabled={isProcessingFile} /></label>
                ) : (
                  <div className="space-y-4">
                     <input type="url" value={videoUrl} onChange={(e) => setVideoURL(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full px-4 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500" disabled={isProcessingFile} />
                    <motion.button onClick={handleVideoUrlUpload} disabled={isProcessingFile || !videoUrl} className="w-full py-4 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-2xl font-semibold disabled:opacity-50">{isProcessingFile ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Process Video"}</motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-1 overflow-hidden relative p-4 gap-4">
        <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-1/4 flex flex-col">
          <div className="h-full bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-700/50 flex flex-col overflow-hidden relative">
            <div className="relative p-4 border-b border-slate-700/50">
                <h2 className="text-lg font-bold text-white flex items-center gap-3 mb-3">
                  {activeView === 'summary' && <BookOpen className="text-violet-400" />}
                  {activeView === 'diagrams' && <BarChart3 className="text-cyan-400" />}
                  {activeView === 'quiz' && <HelpCircle className="text-cyan-400" />}
                  {activeView === 'summary' ? "Summary" : activeView === 'diagrams' ? "Diagrams" : "Quiz"}
                </h2>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setActiveView('summary')} className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-all ${activeView === 'summary' ? 'bg-violet-600 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'}`}><FileText size={14} /><span>Summary</span></button>
                    <button onClick={() => setActiveView('diagrams')} className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-all ${activeView === 'diagrams' ? 'bg-violet-600 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'}`}><BarChart3 size={14} /><span>Diagrams</span></button>
                    <button onClick={() => setActiveView('quiz')} className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-all ${activeView === 'quiz' ? 'bg-violet-600 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'}`}><HelpCircle size={14} /><span>Quiz</span></button>
                </div>
            </div>
            <div className="relative flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-violet-500/50 scrollbar-track-transparent">
              <AnimatePresence mode="wait">
                {activeView === 'summary' && (<motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="prose prose-invert max-w-none text-slate-300 leading-relaxed"><p>{summaryText}</p></motion.div>)}
                {activeView === 'diagrams' && (<motion.div key="diagrams" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{diagramsContent}</motion.div>)}
                {activeView === 'quiz' && (<motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{quizContent}</motion.div>)}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex-1 flex flex-col">
          <div className="flex-1 bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-700/50 flex flex-col overflow-hidden relative">
            <div className="relative p-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg flex items-center justify-center"><MessageCircle className="text-white" size={20} /></div>
                <div><h3 className="text-lg font-semibold text-white">AI Assistant</h3><p className="text-sm text-slate-400">Ready to help</p></div>
              </div>
            </div>
            <div className="relative flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-violet-500/50 scrollbar-track-transparent">
              {messages.length === 0 && (<div className="flex justify-start mb-6"><div className="bg-slate-800/50 text-slate-200 px-6 py-4 rounded-2xl rounded-tl-md"><p>Hello! Ask me anything about the content.</p></div></div>)}
              {messages.map((msg, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.isUser ? "justify-end" : "justify-start"} mb-4`}>
                  <div className={`px-5 py-3 rounded-2xl max-w-[85%] ${msg.isUser ? "bg-gradient-to-br from-violet-600 to-cyan-600 text-white rounded-br-md" : "bg-slate-800/50 text-slate-200 rounded-bl-md"}`}><p className="leading-relaxed">{msg.text}</p></div>
                </motion.div>
              ))}
              {isLoading && (<div className="flex justify-start mb-4"><div className="bg-slate-800/50 text-slate-200 px-6 py-4 rounded-2xl rounded-tl-md"><div className="flex items-center gap-2"><Loader2 className="animate-spin w-4 h-4" /><span>Thinking...</span></div></div></div>)}
              <div ref={messagesEndRef} />
            </div>
            <div className="relative p-4 border-t border-slate-700/50">
              <div className="flex items-center gap-3">
                <input type="text" className="w-full px-5 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="Ask a follow-up..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} disabled={isLoading} />
                <button onClick={sendMessage} disabled={isLoading || input.trim() === ""} className="p-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl disabled:opacity-50"><Send size={20} /></button>
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-72 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl flex-col h-full relative hidden lg:flex">
          <div className="relative p-4 border-b border-slate-700/50"><h3 className="text-lg font-bold text-white flex items-center gap-3"><History className="text-cyan-400" size={20} /> Session History </h3></div>
          <div className="relative flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-violet-500/50 scrollbar-track-transparent">
            <div className="space-y-3">
              {sessions.map((session) => (
                <motion.div key={session.id} whileHover={{ scale: 1.02, x: 4 }} onClick={() => loadSession(session.id)} className="p-4 bg-slate-800/30 hover:bg-slate-700/40 rounded-xl cursor-pointer transition-all duration-300 border border-slate-700/30 hover:border-slate-600/50">
                  <h4 className="font-semibold text-white mb-1 group-hover:text-violet-300 transition-colors">{session.title}</h4>
                  <p className="text-sm text-slate-400 line-clamp-2">{session.preview}</p>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="relative p-4 border-t border-slate-700/50">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded-xl transition-all duration-300">
              <LogOut size={18} /> <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
