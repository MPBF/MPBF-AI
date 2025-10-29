# Modern - AI Assistant Agent

## Overview
Modern is an intelligent AI assistant designed to work as a personal assistant for AbuKhalid's company. The agent learns business processes, remembers all conversations, tracks tasks, and provides context-aware assistance powered by OpenAI's GPT-5.

## Project Status
**Current State:** MVP Complete and Fully Functional
**Last Updated:** October 29, 2025

## Purpose & Goals
- Provide an AI assistant that remembers all interactions and conversations
- Learn and understand business processes
- Track tasks and help with organization
- Serve as a personal company assistant accessible via web, mobile browsers, and desktop browsers
- Maintain context across sessions for continuity

## Technology Stack

### Frontend
- **Framework:** React with TypeScript
- **Routing:** Wouter
- **State Management:** TanStack Query v5
- **UI Components:** Shadcn UI with Radix primitives
- **Styling:** Tailwind CSS with custom design tokens
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js with Express
- **Database:** PostgreSQL (Neon) with Drizzle ORM
- **AI Integration:** OpenAI GPT-5 via Replit AI Integrations
- **Real-time:** WebSocket server (server-side ready, frontend uses polling)
- **API:** RESTful endpoints with Zod validation

## Key Features

### 1. Conversational AI Interface
- Chat with Modern using natural language
- AI remembers conversation context across messages
- Typing indicators and real-time message updates
- Beautiful message bubbles with timestamps
- Empty states with welcoming messages

### 2. Task Management
- Create, update, and delete tasks
- Track task status (Pending, In Progress, Completed)
- Filter tasks by status with tabs
- Associate tasks with conversations
- Checkbox for quick completion

### 3. Knowledge Base
- Document business processes and procedures
- Categorize knowledge entries
- Add tags for organization
- Search across all knowledge entries
- Detailed view with full content

### 4. Dark Mode Support
- Toggle between light and dark themes
- Persistent theme preference in localStorage
- All components adapt to selected theme

### 5. Export Functionality
- Export tasks in JSON, CSV, or Markdown formats
- Export knowledge base in JSON or Markdown formats
- Client-side processing with automatic downloads
- Filenames include current date for organization
- CSV with proper escaping for special characters
- Markdown with grouped sections by status/category

### 6. Responsive Design
- Works on desktop browsers
- Optimized for mobile browsers
- Tablet-friendly layouts
- Collapsible sidebar for smaller screens

## Architecture

### Database Schema
```
conversations
- id (uuid, primary key)
- title (text)
- createdAt (timestamp)
- updatedAt (timestamp)

messages
- id (uuid, primary key)
- conversationId (uuid, foreign key)
- role (text: 'user' | 'assistant')
- content (text)
- createdAt (timestamp)

tasks
- id (uuid, primary key)
- conversationId (uuid, foreign key, nullable)
- title (text)
- description (text, nullable)
- status (text: 'pending' | 'in_progress' | 'completed')
- createdAt (timestamp)
- updatedAt (timestamp)

businessProcesses
- id (uuid, primary key)
- title (text)
- description (text)
- category (text)
- content (text)
- tags (text array)
- createdAt (timestamp)
- updatedAt (timestamp)
```

### API Endpoints

#### Conversations
- `GET /api/conversations` - List all conversations
- `GET /api/conversations/:id` - Get conversation details
- `POST /api/conversations` - Create new conversation

#### Messages
- `GET /api/messages/:conversationId` - Get messages for conversation
- `GET /api/messages/current` - Get messages from latest conversation
- `POST /api/messages/:conversationId?` - Send message and receive AI response

#### Tasks
- `GET /api/tasks` - List all tasks
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

#### Knowledge Base
- `GET /api/knowledge` - List all knowledge entries
- `GET /api/knowledge/:id` - Get knowledge entry
- `POST /api/knowledge` - Create knowledge entry
- `DELETE /api/knowledge/:id` - Delete knowledge entry

## User Information
- **Primary User:** AbuKhalid
- **Role:** Administrator
- **User Preferences:** Professional, business-focused AI assistant

## Recent Changes
- October 29, 2025: Export functionality added
  - Implemented export library for Tasks and Knowledge Base
  - Tasks export: JSON, CSV, and Markdown formats
  - Knowledge Base export: JSON and Markdown formats
  - Client-side processing with automatic downloads
  - Proper CSV escaping and Markdown formatting
  - Date-based filenames for organization
  - End-to-end testing completed successfully

- October 29, 2025: Initial MVP implementation
  - Complete database schema with PostgreSQL and Drizzle ORM
  - OpenAI GPT-5 integration for AI responses with conversation context
  - Full CRUD operations for conversations, messages, tasks, and knowledge base
  - Responsive UI with dark mode support
  - WebSocket server infrastructure (frontend uses polling)
  - Error handling for AI service failures with p-retry (7 retries, exponential backoff)
  - End-to-end testing completed successfully

## Development Workflow

### Running the Application
```bash
npm run dev
```
This starts both the Express backend and Vite frontend on port 5000.

### Database Migrations
```bash
npm run db:push
```
Push schema changes to the PostgreSQL database.

### Environment Variables
Required environment variables (automatically set by Replit):
- `DATABASE_URL` - PostgreSQL connection string
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI API base URL
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key

## Design System
The application follows a professional, productivity-focused design system with:
- **Typography:** Inter for UI, JetBrains Mono for code
- **Colors:** Blue primary (#3B82F6), professional neutrals
- **Spacing:** Consistent 4/6/8/12/16px scale
- **Components:** Shadcn UI components with custom styling
- **Interactions:** Subtle hover states and smooth transitions

## Known Limitations & Future Enhancements

### Current MVP Limitations
1. WebSocket client not implemented on frontend (uses React Query polling instead)
2. No file upload/attachment support in chat
3. No voice input/output capabilities
4. No native mobile apps (web-only)
5. No Windows desktop application

### Planned Next Phase Features
1. Native mobile apps (iOS and Android)
2. Windows desktop application
3. File attachment support (infrastructure complete, UI integration pending)
4. Voice input/output
5. Advanced analytics dashboard
6. Team collaboration features
7. Calendar integration
8. Custom workflow automation
9. Full WebSocket real-time updates

## Production Considerations
- Database connection pooling is handled by Neon
- OpenAI API calls include error handling and graceful degradation
- React Query caching reduces API calls
- All secrets managed via Replit environment variables
- No hardcoded credentials or API keys
- CORS and security headers should be configured for production

## Testing
- End-to-end tests completed successfully
- All core user journeys verified:
  - Creating conversations and sending messages
  - Receiving AI responses
  - Creating and managing tasks
  - Creating and viewing knowledge entries
  - Theme toggling
  - Navigation between pages

## Support & Maintenance
- Monitor OpenAI API usage and costs
- Regular database backups recommended
- Keep dependencies updated
- Monitor error logs for AI service failures
