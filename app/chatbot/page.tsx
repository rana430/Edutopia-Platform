"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, FileText, Upload, Loader2, X, Send, Sparkles, MessageCircle, BookOpen, History, LogOut, Plus, Paperclip, Zap, HelpCircle, ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
// The 'next/navigation' import has been removed as it's specific to the Next.js framework.
// Standard browser APIs will be used for navigation instead.

// This is a placeholder for your logo component.
// In a real app, you would import it from your project structure.
 import Fulllogo from "@/components/ui/fulllogo";

interface ChatMessage {
text: string; 
isUser: boolean; 
isVisible: boolean;
displayedText?: string;
isTyping?: boolean;
}

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

interface SessionData {
  summarized_text: string;
  title?: string;
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
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  // Left Panel State
  const [activeView, setActiveView] = useState<'summary' | 'diagrams' | 'quiz'>('summary');
  
  // Summarization state
  const [summaryText, setSummaryText] = useState("Summary will be displayed here.");
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  // --- Quiz State Management ---
  const [quizState, setQuizState] = useState<'not_started' | 'selecting_type' | 'in_progress' | 'completed'>('not_started');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: number}>({});
  const [score, setScore] = useState(0);
  const [questionType, setQuestionType] = useState<'mcq' | 'true_false'>('mcq');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  const handleStartQuiz = () => {
    setQuizState('selecting_type');
  };

  const handleSelectQuestionType = async (type: 'mcq' | 'true_false') => {
    try {
      setQuestionType(type);
      setIsGeneratingQuestions(true);
      
      // Get the current session ID and token
      const sessionId = localStorage.getItem("currentSessionId");
      const token = localStorage.getItem("token");
      
      if (!sessionId || !token) {
        throw new Error("Session ID or token missing");
      }
      
      // Fetch the summary text first
      const sessionResponse = await fetch(`http://localhost:5218/api/session/${sessionId}`, {
        headers: { "Token": token }
      });
      
      if (!sessionResponse.ok) {
        throw new Error("Failed to fetch session data");
      }
      
      const sessionData: SessionData = await sessionResponse.json();
      let summaryContent = sessionData.summarized_text || "No summary available";
      
      // Send the summary to the chatbot API to generate questions
      const response = await fetch("http://localhost:5000/api/generate_questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: summaryContent,
          type: type === 'mcq' ? 'mcq' : 'true_false'
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate questions");
      }
      
      const data = await response.json();
      
      // Parse the questions from the response
      // This assumes the API returns questions in the expected format
      // You may need to adjust this based on the actual response format
      let parsedQuestions: QuizQuestion[] = [];
      
      try {
        // Try to parse the questions from the response
        // This is a simplified example - you'll need to adapt based on your API's response format
        const questionLines = data.questions.split('\n\n');
        
        parsedQuestions = questionLines.map((questionBlock: string, index: number) => {
          const lines = questionBlock.split('\n');
          const questionText = lines[0].replace(/^\d+\.\s*/, '').trim();
          
          if (type === 'mcq') {
            // Parse MCQ format
            const options = lines.slice(1, 5).map(line => 
              line.replace(/^[A-D]\)\s*/, '').trim()
            );
            
            // Find the correct answer (assuming it's marked with *)
            const correctAnswerLine = lines.find(line => line.includes('*')) || '';
            const correctAnswerIndex = ['A)', 'B)', 'C)', 'D)'].findIndex(
              prefix => correctAnswerLine.startsWith(prefix)
            );
            
            return {
              id: index + 1,
              questionText,
              options,
              correctAnswerIndex: correctAnswerIndex !== -1 ? correctAnswerIndex : 0
            };
          } else {
            // Parse True/False format
            return {
              id: index + 1,
              questionText,
              options: ['True', 'False'],
              correctAnswerIndex: lines.find(line => 
                line.toLowerCase().includes('answer') && line.toLowerCase().includes('true')
              ) ? 0 : 1
            };
          }
        }).filter(q => q.questionText && q.options.length > 0);
        
        // If parsing failed or no questions were found, use dummy questions
        if (parsedQuestions.length === 0) {
          console.warn("Failed to parse questions, using dummy data");
          parsedQuestions = dummyQuestions;
        }
      } catch (error) {
        console.error("Error parsing questions:", error);
        parsedQuestions = dummyQuestions;
      }
      
      setQuestions(parsedQuestions);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setScore(0);
      setQuizState('in_progress');
      
    } catch (error) {
      console.error("Error generating questions:", error);
      alert("Failed to generate questions. Using sample questions instead.");
      
      // Fallback to dummy questions
      setQuestions(dummyQuestions);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setScore(0);
      setQuizState('in_progress');
    } finally {
      setIsGeneratingQuestions(false);
    }
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
  // Add this state for diagrams
  const [diagrams, setDiagrams] = useState<{id: string, filePath: string}[]>([]);
  const [isLoadingDiagrams, setIsLoadingDiagrams] = useState(false);
  
  // Diagrams content that displays actual diagrams
  const diagramsContent = (
    <div className="space-y-4">
      {isLoadingDiagrams ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
        </div>
      ) : diagrams.length > 0 ? (
        diagrams.map((diagram, index) => (
          <motion.div
            key={diagram.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 hover:border-violet-500/50 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <h3 className="text-violet-300 font-semibold mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-violet-400" />
              Diagram {index + 1}
            </h3>
            <div className="h-48 bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-xl flex items-center justify-center border border-slate-600/30 overflow-hidden">
              <img 
                src={diagram.filePath} 
                alt={`Diagram ${index + 1}`}
                className="object-contain max-h-full max-w-full"
                onError={(e) => {
                  e.currentTarget.src = "/images/placeholder-diagram.png";
                  e.currentTarget.onerror = null;
                }}
              />
            </div>
          </motion.div>
        ))
      ) : (
        ['No diagrams available'].map((title, index) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 transition-all duration-300"
          >
            <div className="h-32 bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-xl flex items-center justify-center border border-slate-600/30">
              <span className="text-slate-400 font-medium">
                {title}
              </span>
            </div>
          </motion.div>
        ))
      )}
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
                    <motion.button 
                      whileHover={{ scale: 1.02 }} 
                      whileTap={{ scale: 0.98 }} 
                      onClick={handleStartQuiz} 
                      className="w-full py-3 bg-gradient-to-r from-cyan-600 to-violet-600 text-white rounded-xl font-semibold hover:from-cyan-700 hover:to-violet-700 transition-all duration-300 shadow-lg"
                    >
                        Start Quiz
                    </motion.button>
                </div>
            </motion.div>
        )}
        
        {quizState === 'selecting_type' && (
            <motion.div key="select-type" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="text-center">
                <div className="group relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50">
                    <HelpCircle size={40} className="mx-auto text-cyan-400 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Select Question Type</h3>
                    <p className="text-slate-400 mb-6">Choose the type of questions you want to answer.</p>
                    
                    <div className="space-y-4">
                        <motion.button 
                          whileHover={{ scale: 1.02 }} 
                          whileTap={{ scale: 0.98 }} 
                          onClick={() => handleSelectQuestionType('mcq')}
                          disabled={isGeneratingQuestions}
                          className="w-full py-3 bg-gradient-to-r from-cyan-600 to-violet-600 text-white rounded-xl font-semibold hover:from-cyan-700 hover:to-violet-700 transition-all duration-300 shadow-lg disabled:opacity-50"
                        >
                            {isGeneratingQuestions && questionType === 'mcq' ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 size={18} className="animate-spin" /> Generating MCQs...
                                </span>
                            ) : 'Multiple Choice Questions'}
                        </motion.button>
                        
                        <motion.button 
                          whileHover={{ scale: 1.02 }} 
                          whileTap={{ scale: 0.98 }} 
                          onClick={() => handleSelectQuestionType('true_false')}
                          disabled={isGeneratingQuestions}
                          className="w-full py-3 bg-gradient-to-r from-cyan-600 to-violet-600 text-white rounded-xl font-semibold hover:from-cyan-700 hover:to-violet-700 transition-all duration-300 shadow-lg disabled:opacity-50"
                        >
                            {isGeneratingQuestions && questionType === 'true_false' ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 size={18} className="animate-spin" /> Generating T/F Questions...
                                </span>
                            ) : 'True/False Questions'}
                        </motion.button>
                    </div>
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
  // Keep track of messages added during the current session
  const [currentSessionMessages, setCurrentSessionMessages] = useState<ChatMessage[]>([]);
  // --- Chat functionality with chatbot API integration ---
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    // Create a new user message
    const newUserMessage: Message = { 
      text: input, 
      isUser: true,
      timestamp: new Date()
    };
    
    // Add to messages array
    setMessages(prev => [...prev, newUserMessage]);
    
    const userInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // First, check if we have a current session
      const sessionId = localStorage.getItem("currentSessionId");
      
      // If we have a session ID, use the backend chat API
      if (sessionId) {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:5218/api/Chat/c`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Token': token || ''
          },
          body: JSON.stringify({ 
            query: userInput,
            id: sessionId
          })
        });

        if (!response.ok) throw new Error("Failed to send message to backend");
        
        const responseData = await response.json();
        
        // Add AI response to UI
        const aiResponse: Message = {
          text: responseData.response || "I received your message.",
          isUser: false,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiResponse]);
      } 
      // If no session ID, use the chatbot API directly
      else {
        // Send to chatbot API
        const response = await fetch("http://localhost:5000/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: userInput
          })
        });
        
        if (!response.ok) throw new Error("Failed to send message to chatbot API");
        
        const data = await response.json();
        
        // Add AI response to UI
        const aiResponse: Message = {
          text: data.message || data.full_response || "I received your message.",
          isUser: false,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiResponse]);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      
      // Add error message to chat
      const errorMessage: Message = { 
        text: "Failed to send message. Please try again.", 
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
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
      const response = await fetch("http://localhost:5218/api/upload/document", {
        method: "POST", headers: { "Token": token }, body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        // Extract session ID from the response
        const sessionId = data.history?.id || data.sessionId;

        console.log("Session ID:", sessionId);
        
        // Store the session ID in localStorage
        if (sessionId) {
          localStorage.setItem("currentSessionId", sessionId);
        }
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
      
      // Step 1 & 2: Send video URL to backend
      const response = await fetch("http://localhost:5218/api/upload/video", {
        method: "POST", 
        mode: "cors", 
        headers: { "Content-Type": "application/json", "Token": token }, 
        body: JSON.stringify({ videoUrl }),
      });

      console.log("uploaded");
      
      // Step 3: Handle the response from backend
      const data = await response.json();
      if (response.ok) {
         // Extract session ID from the response
        const sessionId = data.history?.id || data.sessionId;
        const videoId = data.video?.id || data.videoId;
        
        // Store the session ID in localStorage
        if (sessionId) {
          localStorage.setItem("currentSessionId", sessionId.toString());
          
          // Step 4: Request summarization
          try {
            const token = localStorage.getItem("token");
            // add 10 seconds delay
            await new Promise(resolve => setTimeout(resolve, 10000));
            const response = await fetch(`http://localhost:5218/api/session/${sessionId}`, {
              headers: { "Token": token }
            });
      
            if (!response.ok) {
              throw new Error("Failed to fetch session data");
            }
      
            const data: SessionData = await response.json();
            console.log(data);
            
            // Parse the summarized_text as it's a JSON string
            let summaryContent = "No summary available for this document.";
            if (data.summarized_text) {
              try {
                const parsedSummary = JSON.parse(data.summarized_text);
                let analysisText = parsedSummary.analysis || parsedSummary.text || parsedSummary;
                
                // Format the text: convert **text** to bold using Markdown
                analysisText = analysisText
                  // Replace ** with proper bold markdown
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  // Preserve headers (###)
                  .replace(/### (.*?)(\n|$)/g, '<h3>$1</h3>')
                  // Preserve bullet points
                  .replace(/\* (.*?)(\n|$)/g, '<li>$1</li>')
                  // Wrap bullet point lists in ul tags
                  .replace(/<li>(.*?)(<\/li>\n*)+/g, '<ul><li>$1</li>$2</ul>');
                
                summaryContent = analysisText;
              } catch (e) {
                // If parsing fails, use the raw text
                summaryContent = data.summarized_text;
              }
            }
            
            setSummaryText(summaryContent);
            setCurrentSessionId(sessionId);
            // This console.log will show the old value due to state update timing
            // The updated value will be reflected in the next render
            console.log("Current summary:", summaryText);
            console.log(data.summarized_text);
            
            // Update localStorage with current session
            localStorage.setItem("currentSessionId", sessionId);
          } catch (err) {
            console.error(err);
            setSummaryText("Error loading summary. Please try again.");
          }
        }

        
        // Add system message
        const systemMessage: Message = { 
          text: "✨ I've processed the video. Ask away!", 
          isUser: false, 
          timestamp: new Date() 
        };
        setMessages(prev => [...prev, systemMessage]);
        setShowUploadPopup(false);
      } else { 
        throw new Error(data.message || "Upload failed"); 
      }
    } catch (error) {
      console.error('Error uploading video URL:', error);
      alert(error.message || "Failed to upload video URL");
    } finally {
      setIsProcessingFile(false);
      setVideoURL("");
    }
  };

  const fetchDiagrams = async (sessionId: string) => {
    try {
      setIsLoadingDiagrams(true);
  
      // Call your backend endpoint to get diagrams
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const response = await fetch(`http://localhost:5218/api/video/${sessionId}/diagrams`, {
        headers: { "Token": token }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch diagrams from backend");
      }
      
      const data = await response.json();
      
      // Parse the nested structure and extract diagrams from $values
      const diagramsArray = data.diagrams?.$values || [];
      
      // Map the diagrams to the correct format with web-accessible paths
      const parsedDiagrams = diagramsArray.map(diagram => ({
        id: diagram.id,
        filePath: diagram.filePath.replace('F:\\GP\\Frontend\\Edutopia-frontend\\public', '').replace(/\\/g, '/')
      }));
      
      setDiagrams(parsedDiagrams);
      console.log("Diagrams:", parsedDiagrams);
    } catch (err) {
      console.error("Error fetching diagrams:", err);
      alert("Failed to load diagrams. Please try again.");
      setDiagrams([]);
    } finally {
      setIsLoadingDiagrams(false);
    }
  };

  const extractDiagrams = async () => {
    try {
      setIsLoadingDiagrams(true);
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
      setIsLoadingDiagrams(false);

    } catch (err) {
      console.error(err);
      setIsLoadingDiagrams(false);
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
                {activeView === 'summary' && (
                  <motion.div 
                    key="summary" 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="prose prose-invert max-w-none text-slate-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: summaryText }}
                  />
                )}
                {activeView === 'diagrams' && (
                  <motion.div 
                    key="diagrams" 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                  >
                    <div className="space-y-4">
                      <div className="flex justify-center mb-6">
                        <button
                          onClick={() => {
                            extractDiagrams();
                          }}
                          className="px-6 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-violet-700 hover:to-cyan-700 transition-all duration-300 shadow-lg"
                        >
                          {isLoadingDiagrams ? 'Loading...' : 'View Diagrams'}
                        </button>
                      </div>
                      {diagramsContent}
                    </div>
                  </motion.div>
                )}
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
