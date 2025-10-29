# Design Guidelines for Modern AI Assistant

## Design Approach

**Selected Approach:** Design System (Productivity-Focused)

**Primary References:** ChatGPT (conversational UI), Linear (typography & professional aesthetic), Notion (information organization)

**Core Principles:**
- Clarity and readability for extended conversations
- Professional, trustworthy interface for business context
- Efficient information hierarchy for multi-modal content (chat, tasks, documents)
- Seamless cross-device experience

---

## Typography

**Font Families:**
- Primary: Inter (Google Fonts) - body text, UI elements
- Monospace: JetBrains Mono (Google Fonts) - code snippets, technical content

**Type Scale:**
- Hero/Page Titles: text-4xl (36px) font-bold
- Section Headers: text-2xl (24px) font-semibold
- Chat Messages: text-base (16px) font-normal
- User Name/Timestamp: text-sm (14px) font-medium
- Labels/Meta: text-xs (12px) font-medium
- Task Items: text-base (16px) font-normal

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4, p-6
- Section margins: mb-6, mb-8
- Card spacing: gap-4, gap-6
- Icon spacing: mr-2, ml-2

**Grid Structure:**
- Desktop: Three-column layout (Sidebar 280px | Main Chat flex-1 | Context Panel 320px)
- Tablet: Two-column (Collapsible Sidebar | Main Chat)
- Mobile: Single column, hamburger navigation

**Container Widths:**
- Main chat container: max-w-4xl mx-auto
- Message bubbles: max-w-3xl
- Task cards: w-full
- Input area: w-full with max-w-4xl

---

## Component Library

### Navigation & Structure

**Sidebar (Desktop/Tablet):**
- Fixed left panel with conversation history
- Logo/Brand at top (h-16)
- Search conversations (p-4)
- Conversation list with infinite scroll
- New conversation button (prominent, p-3)
- User profile at bottom (p-4)

**Mobile Navigation:**
- Fixed top bar with hamburger menu
- Slide-in sidebar overlay
- Quick action button (floating, bottom-right)

### Chat Interface

**Message Bubbles:**
- User messages: Right-aligned, max-w-2xl, rounded-2xl, p-4
- AI responses: Left-aligned, max-w-2xl, rounded-2xl, p-4
- Avatar: 40x40px rounded-full
- Timestamp: text-xs, mt-1
- Spacing between messages: mb-6

**Message Types:**
- Text: Standard paragraph formatting with line-height-relaxed
- Code blocks: Rounded corners, syntax highlighting area, copy button
- Lists: Proper bullet/number styling with pl-6
- Links: Underlined on hover, external icon for outbound

**Input Area:**
- Fixed bottom position with backdrop blur
- Multi-line textarea with auto-expand (max 8 lines)
- Send button (icon-only, rounded-full)
- Attachment button, voice input button (icon-only)
- Typing indicator: Three animated dots

### Task Management

**Task Cards:**
- Rounded corners (rounded-lg)
- Border on hover
- Checkbox (left-aligned)
- Title (text-base, font-medium)
- Description (text-sm, truncated with "Show more")
- Due date badge (if applicable)
- Status indicator (small dot or chip)
- Action menu (three-dot icon, right-aligned)

**Task List View:**
- Group by: Pending, In Progress, Completed
- Collapsible sections with count badges
- Drag-and-drop reordering
- Empty state with helpful illustration

### Business Process Documentation

**Document Cards:**
- Icon + Title (text-lg, font-semibold)
- Last updated timestamp
- Preview snippet (2-3 lines, text-sm)
- Tag system for categorization
- Quick actions (Edit, Share, Archive)

**Document Viewer:**
- Full-screen overlay modal
- Table of contents (sticky sidebar on desktop)
- Search within document
- Breadcrumb navigation
- Print/Export options

### Context Panel (Desktop)

**Information Sections:**
- Current Context header (text-lg, font-semibold)
- Related documents (compact list)
- Quick facts/summary cards
- Referenced tasks
- Collapsible sections with chevron icons

---

## Interactions & States

**Loading States:**
- Message streaming: Animated gradient shimmer
- Skeleton screens for list items
- Spinner for longer operations

**Empty States:**
- Centered illustration (max 200px)
- Helpful message (text-lg)
- Call-to-action button

**Error States:**
- Inline error messages (rounded-md, p-3)
- Toast notifications for system errors (top-right)
- Retry action prominently displayed

**Focus States:**
- All interactive elements: ring-2 offset-2 on focus
- Input fields: border highlight, no ring

---

## Responsive Behavior

**Desktop (1280px+):**
- Three-column layout fully visible
- Sidebar always visible
- Context panel toggleable

**Tablet (768px - 1279px):**
- Two-column: Sidebar + Main
- Context panel as overlay/modal
- Sidebar collapsible

**Mobile (<768px):**
- Single column, full-width chat
- Hamburger menu for sidebar
- Bottom navigation for quick actions
- Context info in bottom sheet

---

## Icons

**Icon Library:** Heroicons (via CDN)
- Message: chat-bubble-left-right
- Tasks: check-circle
- Documents: document-text
- Search: magnifying-glass
- Menu: bars-3
- Send: paper-airplane
- User: user-circle
- Settings: cog-6-tooth

**Icon Sizing:**
- Navigation icons: w-5 h-5
- Message actions: w-4 h-4
- User avatar placeholder: w-10 h-10

---

## Accessibility

- All interactive elements keyboard navigable
- ARIA labels for icon-only buttons
- Focus visible on all controls
- Semantic HTML (nav, main, aside, article)
- Skip to main content link
- Screen reader announcements for new messages
- High contrast mode support
- Minimum touch target: 44x44px

---

## Images

**Profile Avatars:**
- User avatar: 40x40px rounded-full (placeholder with initials if no image)
- AI assistant avatar: 40x40px rounded-full with Modern logo/icon

**Empty State Illustrations:**
- No conversations: Friendly illustration of chat bubbles (max 240px)
- No tasks: Illustration of checklist/clipboard (max 240px)
- No documents: Illustration of folder/files (max 240px)

**Background Treatments:**
- Subtle gradient mesh in sidebar (very low opacity)
- Clean, solid background for chat area (no distractions)