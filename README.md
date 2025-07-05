# Edutopia System Architecture

## Overview

Edutopia is an educational platform that leverages AI to enhance learning experiences. The system consists of three main components that work together to provide content processing, interactive chatbot functionality, and knowledge assessment.

## Core Components

### 1. Frontend Application

A Next.js-based web application that provides the user interface for all platform features:

- **Authentication System**: Handles user registration, login, and session management
- **Content Viewer**: Displays educational materials and summaries
- **Interactive Chatbot Interface**: Allows users to interact with the AI assistant
- **Quiz System**: Generates and presents assessments based on learning materials
- **Diagram Visualization**: Displays visual representations of complex concepts

### 2. Backend API Service

A RESTful API service that manages data persistence and business logic:

- **User Management**: Handles user data and authentication tokens
- **Session Management**: Tracks and stores learning sessions
- **Content Processing**: Summarizes and processes educational materials
- **Data Storage**: Maintains persistent storage of user data and learning materials

### 3. AI Chatbot Service

A specialized service focused on natural language processing and content generation:

- **Conversational AI**: Processes user queries and generates contextual responses
- **Question Generation**: Creates quiz questions based on educational content
- **Content Summarization**: Produces concise summaries of learning materials
- **Diagram Generation**: Creates visual representations of concepts

## Data Flow

1. **Content Processing Flow**:
   - User uploads educational content through the frontend
   - Backend API stores the raw content and requests processing
   - AI service analyzes and summarizes the content
   - Processed content is stored in the backend and displayed to the user

2. **Interactive Learning Flow**:
   - User interacts with the chatbot through the frontend interface
   - Queries are sent to the AI service for processing
   - AI service generates responses based on the educational context
   - Responses are displayed to the user in real-time

3. **Assessment Flow**:
   - User requests a quiz on specific content
   - Backend retrieves the relevant summarized content
   - AI service generates appropriate questions based on content type
   - Frontend presents the quiz and tracks user performance
   - Results are stored in the backend for progress tracking

## Integration Points

- **Frontend ↔ Backend**: RESTful API calls with authentication tokens
- **Backend ↔ AI Service**: Internal API communication for content processing
- **User ↔ System**: Web interface with real-time interactions

## Technical Stack

- **Frontend**: Next.js, React, TailwindCSS, Framer Motion
- **Backend**: RESTful API service (endpoint: localhost:5218)
- **AI Service**: Specialized NLP service (endpoint: localhost:5000)
- **Authentication**: Token-based authentication system

This architecture provides a scalable and modular approach to delivering AI-enhanced educational experiences while maintaining clear separation of concerns between the presentation layer, business logic, and AI capabilities.
