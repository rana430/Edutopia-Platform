# Edutopia System Architecture Documentation

This directory contains simplified and abstract documentation of the Edutopia platform's system architecture.

## Contents

1. **[System Architecture Overview](system_architecture.md)** - A high-level description of the core components, data flows, and integration points of the Edutopia platform.

2. **[Vertical Architecture Diagram](vertical_architecture_diagram.md)** - Visual representation of the system's main components and their relationships in a vertical layout using ASCII diagrams.

3. **[Mermaid Architecture Diagram](mermaid_architecture_diagram.md)** - Interactive diagram using Mermaid.js syntax for modern markdown viewers.

## Purpose

This documentation provides a simplified and abstract view of the Edutopia system architecture, focusing on:

- Core components and their relationships
- Main data flows between services
- Key functional modules within each service
- Integration points between different parts of the system

The diagrams and descriptions are intentionally abstract to highlight the conceptual architecture rather than implementation details.

## System Overview

Edutopia is an educational platform with three main components:

1. **Frontend Application** - A Next.js/React web interface for user interactions
2. **Backend API Service** - Handles data persistence and business logic
3. **AI Chatbot Service** - Provides natural language processing and content generation

These components work together to deliver features like content summarization, interactive chatbot learning, quiz generation, and diagram visualization.

## Using This Documentation

This documentation can be used for:

- Understanding the high-level system design
- Onboarding new team members
- Planning system extensions or modifications
- Creating more detailed technical documentation

For implementation details, please refer to the actual codebase and API documentation.

## Diagram Formats

The architecture is represented in multiple formats:

- **System Architecture Overview** - Textual description with component details
- **Vertical Architecture Diagram** - ASCII art representation with vertical layout
- **Mermaid Architecture Diagram** - Interactive diagram for modern markdown viewers

Choose the format that best suits your needs and viewing environment.