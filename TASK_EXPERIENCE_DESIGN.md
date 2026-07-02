# BRMH Teams — Task Experience Design Specification

**Version:** 1.0  
**Date:** June 27, 2026  
**Status:** Design Phase — DO NOT IMPLEMENT YET

---

## Table of Contents

1. [Product Philosophy](#1-product-philosophy)
2. [Task Dashboard Architecture](#2-task-dashboard-architecture)
3. [Component Specifications](#3-component-specifications)
4. [Additional Views](#4-additional-views)
5. [Design System](#5-design-system)
6. [Implementation Roadmap](#6-implementation-roadmap)

---

## 1. Product Philosophy

### Core Principle

**BRMH Teams is NOT a CRUD application.**

It is a **Task-Centric Execution Platform** where:

- The Task Dashboard is the PRIMARY product experience
- Everything revolves around the task
- Tasks are the atomic unit of work execution
- All features serve task completion and collaboration

### Design References

Visual quality should match these enterprise SaaS products:


- **Linear** — Clean task UI, keyboard shortcuts, command palette
- **Notion** — Rich text editing, nested content, flexible layouts
- **Vercel Dashboard** — Minimal design, micro-interactions, status indicators
- **Attio** — Data-rich interfaces, smooth animations, hover states
- **Plane** — Project management, kanban boards, task details
- **Slack** — Comments, threads, reactions, real-time collaboration
- **GitHub Projects** — Issue tracking, timeline, activity logs

### Visual Characteristics

**DO:**
- ✓ Enterprise-grade and premium feel
- ✓ Minimal and clean interfaces
- ✓ Fast micro-interactions and transitions
- ✓ Modern color palette and typography
- ✓ Information density without clutter
- ✓ Purposeful whitespace

**DON'T:**
- ✗ Bootstrap-style traditional admin panels
- ✗ Table-heavy layouts for everything
- ✗ Legacy enterprise UI patterns
- ✗ Excessive borders and shadows
- ✗ Loud colors and heavy gradients



---

## 2. Task Dashboard Architecture

### 2.1 Route Structure

```
/tasks/[taskId]
```

### 2.2 Layout System

**Two-Column Responsive Layout:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                          GLOBAL HEADER                              │
│  [ Sidebar Toggle ]  Breadcrumbs  [ Search ]  [ Notifications ]    │
└─────────────────────────────────────────────────────────────────────┘
┌──────┬──────────────────────────────────────────────────────────────┐
│      │                    TASK HEADER                               │
│      │  [ Task ID ]  Task Name  [ Status ]  [ Priority ]  [Actions] │
│      ├──────────────────────────────────────────────────────────────┤
│  S   │                                                               │
│  I   │  ┌────────────────────────┬────────────────────────────────┐ │
│  D   │  │                        │                                │ │
│  E   │  │   CONTENT COLUMN       │    METADATA COLUMN             │ │
│  B   │  │   (65% width)          │    (35% width)                 │ │
│  A   │  │                        │                                │ │
│  R   │  │  • Description         │  • Effort Widget               │ │
│      │  │  • Task Steps          │  • Assignees                   │ │
│      │  │  • Attachments         │  • Sprint & Project            │ │
│      │  │  • Notes               │  • Dates                       │ │
│      │  │  • Comments            │  • Owner                       │ │
│      │  │                        │  • Assignment History          │ │
│      │  │                        │  • Audit Timeline              │ │
│      │  │                        │                                │ │
│      │  └────────────────────────┴────────────────────────────────┘ │
│      │                                                               │
└──────┴──────────────────────────────────────────────────────────────┘
```

### 2.3 Responsive Breakpoints

| Breakpoint | Width | Layout Behavior |
|------------|-------|-----------------|
| **Desktop** | ≥1280px | Full two-column layout, sidebar visible |
| **Tablet** | 768-1279px | Two-column layout, collapsible sidebar |
| **Mobile** | <768px | Single column, tabbed navigation for metadata |

### 2.4 Content Column Components (Left Side)

Priority order from top to bottom:

1. **Description** — Rich text area, inline editing
2. **Task Steps** — Collapsible checklist with progress
3. **Attachments** — File grid with preview
4. **Notes** — Markdown editor with versions
5. **Comments** — Threaded discussion with replies and reactions

### 2.5 Metadata Column Components (Right Side)

Priority order from top to bottom:

1. **Effort Tracking Widget** — Visual progress bars with slippage
2. **Assignees** — Avatar group with add/remove
3. **Sprint & Project Info** — Linked cards
4. **Dates** — Start date, planned due, actual due
5. **Priority & Status** — Quick edit dropdowns
6. **Owner** — Task owner with reassign
7. **Assignment History** — Collapsible timeline
8. **Audit Timeline** — Collapsible activity log

---

## 3. Component Specifications

### 3.1 Task Header

**Purpose:** Primary navigation and task metadata at a glance

**Visual Layout:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  [ ← Back ]                                                         │
│                                                                     │
│  Company Name › Project Name › Sprint Name › Task ID               │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ [✓] Implement user authentication system              [Done ▼] │ │
│  │                                                                 │ │
│  │ [ High ]  [ Sprint 1 ]  [ 👤 3 assignees ]        [⭐] [📋] […]│ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**Elements:**

1. **Back Button** — Returns to previous view (sprint or my tasks)
2. **Breadcrumbs** — Company › Project › Sprint › Task ID (clickable)
3. **Task Name** — Large, editable inline (click to edit)
4. **Status Dropdown** — Color-coded badge with dropdown (todo → in_progress → review → done)
5. **Quick Metadata Pills:**
   - Priority badge
   - Sprint name (linked)
   - Assignee avatars (first 3, +N if more)
6. **Quick Actions (right-aligned):**
   - ⭐ Favorite (toggle)
   - 📋 Copy Task ID (tooltip on hover)
   - … More Actions (dropdown menu)

**More Actions Dropdown:**

- Share task (copy link)
- Convert to sub-task
- Create sub-task
- Duplicate task
- Archive task
- Delete task (confirmation required)

**Interactions:**

- Task name: Click to edit inline, auto-save on blur
- Status dropdown: Click to open, select new status, API call with optimistic update
- Quick metadata: Click to navigate or edit

**API Integration:**

```typescript
// Update task name
PATCH /tasks/:taskId { name: string }

// Update task status
PATCH /tasks/:taskId/status { status: TaskStatus }
```

---

### 3.2 Effort Tracking Widget

**Purpose:** Visual representation of planned vs actual effort with slippage indicator

**Visual Layout:**

```
┌────────────────────────────────────┐
│  Effort Tracking                   │
│                                    │
│  Planned Hours        20 PH        │
│  ████████████░░░░░░░░░ 60%         │
│                                    │
│  Estimated Hours      24 PH        │
│  ████████████████░░░░░ 80%         │
│                                    │
│  Actual Hours         28 PH        │
│  ████████████████████░ 93%         │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ ⚠️ Slippage: +8 PH (+40%)    │  │
│  └──────────────────────────────┘  │
│                                    │
│  [ Edit Effort ]                   │
└────────────────────────────────────┘
```

**Data Model:**

```typescript
interface EffortData {
  plannedEffortPh: number;      // Set at task creation
  estimatedEffortPh: number;    // Updated during execution
  actualEffortPh: number;       // Tracked time spent
  slippagePh: number;           // Calculated: actual - planned
  slippagePercentage: number;   // (slippage / planned) * 100
}
```

**Visual States:**

| Condition | Color | Indicator |
|-----------|-------|-----------|
| No slippage (actual ≤ planned) | Green | ✓ On Track |
| Minor slippage (1-20%) | Yellow | ⚠️ Slight Delay |
| Major slippage (>20%) | Red | 🚨 Over Budget |

**Progress Bars:**

- **Planned:** Gray background, brand-500 fill
- **Estimated:** Gray background, brand-600 fill
- **Actual:** Gray background, color based on slippage (green/yellow/red)

**Edit Effort Modal:**

```
┌─────────────────────────────────────┐
│  Update Effort                 [×]  │
├─────────────────────────────────────┤
│                                     │
│  Planned Hours (PH)                 │
│  [ 20 ]  (Set at creation, locked)  │
│                                     │
│  Estimated Hours (PH)               │
│  [ 24 ]  (Adjustable during work)   │
│                                     │
│  Actual Hours (PH)                  │
│  [ 28 ]  (Time tracking)            │
│                                     │
│         [ Cancel ]  [ Save ]        │
└─────────────────────────────────────┘
```

**API Integration:**

```typescript
PATCH /tasks/:taskId/effort
{
  estimatedEffortPh?: number;
  actualEffortPh?: number;
}
```



---

### 3.3 Task Steps Component

**Purpose:** Checklist to break down tasks into executable steps

**Visual Layout:**

```
┌──────────────────────────────────────────────────┐
│  Steps                        ▼                  │
│  Progress: 3 of 5 completed (60%)                │
│  ████████████░░░░░░░░                            │
│                                                  │
│  ☑ Design API endpoints                          │
│  ☑ Create DTOs and validation                    │
│  ☑ Implement service layer                       │
│  ☐ Write integration tests                       │
│  ☐ Update API documentation                      │
│                                                  │
│  [ + Add Step ]                                  │
└──────────────────────────────────────────────────┘
```

**Step Item Structure:**

```
[ Checkbox ]  Step Title  [ Drag Handle ]  [ × Delete ]
```

**Features:**

1. **Progress Indicator:**
   - Visual progress bar
   - Text: "X of Y completed (Z%)"
   
2. **Step Item:**
   - Checkbox (check/uncheck with optimistic update)
   - Editable title (inline edit on click)
   - Drag handle (reorder with drag-and-drop)
   - Delete button (hover to reveal)
   - Checked state: strikethrough text, lighter color
   - Checked by user + timestamp (on hover tooltip)

3. **Add Step:**
   - Input field appears on click
   - Press Enter to save
   - Esc to cancel

4. **Reordering:**
   - Drag-and-drop using react-beautiful-dnd or dnd-kit
   - Visual feedback during drag
   - Auto-save order on drop

**Interactions:**

- Click checkbox → Check/uncheck → API call → Audit log
- Click step title → Inline edit → Auto-save on blur
- Drag step → Reorder → API call on drop
- Click delete → Confirm → API call

**API Integration:**

```typescript
// List steps
GET /tasks/:taskId/steps → TaskStep[]

// Create step
POST /tasks/:taskId/steps { title: string, order?: number }

// Check step
PATCH /tasks/:taskId/steps/:stepId/check

// Uncheck step
PATCH /tasks/:taskId/steps/:stepId/uncheck


// Reorder steps
PATCH /tasks/:taskId/steps/reorder { stepIds: string[] }

// Delete step
DELETE /tasks/:taskId/steps/:stepId
```

**Empty State:**

```
┌──────────────────────────────────────────────────┐
│  Steps                        ▼                  │
│                                                  │
│      📋                                           │
│      No steps yet                                │
│      Break down this task into smaller steps    │
│                                                  │
│  [ + Add First Step ]                            │
└──────────────────────────────────────────────────┘
```

---

### 3.4 Attachments Component

**Purpose:** File storage for task-related documents, images, and assets

**Visual Layout (Grid View):**

```
┌────────────────────────────────────────────────────────┐
│  Attachments                   [ ↑ Upload ]            │
│                                                        │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐            │
│  │ 📄        │ │ 🖼️        │ │ 📊        │            │
│  │           │ │           │ │           │            │
│  │ design.   │ │ mockup.   │ │ report.   │            │
│  │   pdf     │ │   png     │ │   xlsx    │            │
│  │           │ │           │ │           │            │
│  │ 2.4 MB    │ │ 1.8 MB    │ │ 456 KB    │            │
│  │ John Doe  │ │ Jane S.   │ │ Admin     │            │
│  │ 2h ago    │ │ 1d ago    │ │ 3d ago    │            │
│  └───────────┘ └───────────┘ └───────────┘            │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**File Card Structure:**

```
┌────────────────┐
│  [ Icon ]      │ ← File type icon or image thumbnail
│                │
│  filename.ext  │ ← Truncated filename (hover for full)
│  1.2 MB        │ ← File size
│  User Name     │ ← Uploader
│  2h ago        │ ← Upload time
│                │
│  [ ↓ ] [ 👁 ] │ ← Download, Preview (on hover)
└────────────────┘
```

**File Type Icons:**

| Extension | Icon | Preview Support |
|-----------|------|-----------------|
| .pdf | 📄 | Yes (embedded viewer) |
| .png, .jpg, .jpeg, .gif | 🖼️ | Yes (lightbox) |
| .docx, .doc | 📝 | No (download only) |
| .xlsx, .xls, .csv | 📊 | No (download only) |
| .zip, .rar | 🗜️ | No (download only) |
| .mp4, .mov | 🎬 | Yes (video player) |
| Other | 📎 | No (download only) |

**Upload Flow:**

1. Click "Upload" button → File picker dialog
2. Select one or multiple files
3. Show upload progress indicator
4. On success: Add to grid with animation
5. On error: Show error toast

**Preview Modal (Images):**

```
┌─────────────────────────────────────────────────────┐
│  mockup.png                                    [×]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│              [ Full Image Display ]                 │
│                                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Uploaded by Jane Smith • June 27, 2026            │
│  [ ← Prev ]  [ Download ]  [ Next → ]              │
└─────────────────────────────────────────────────────┘
```

**API Integration:**

```typescript
// List attachments
GET /tasks/:taskId/attachments → AttachmentItem[]

// Upload attachment
POST /tasks/:taskId/attachments (multipart/form-data)

// Download attachment
GET /tasks/:taskId/attachments/:attachmentId/download

// Delete attachment
DELETE /tasks/:taskId/attachments/:attachmentId
```

**Empty State:**

```
┌────────────────────────────────────────────────────┐
│  Attachments                                       │
│                                                    │
│         📎                                          │
│         No attachments yet                         │
│         Upload files to share with your team       │
│                                                    │
│  [ ↑ Upload Files ]                                │
└────────────────────────────────────────────────────┘
```

---

### 3.5 Notes Component

**Purpose:** Rich markdown workspace for task documentation and knowledge

**Visual Layout:**

```
┌──────────────────────────────────────────────────────┐
│  Notes                  [ + New Note ]               │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ Implementation Notes               [Edit] [×]  │ │
│  ├────────────────────────────────────────────────┤ │
│  │                                                │ │
│  │  ## Database Schema                              │ │
│  │  - Use PostgreSQL with Prisma                  │ │
│  │  - Create migration for auth tables            │ │
│  │                                                │ │
│  │  ## API Design                                 │ │
│  │  - RESTful endpoints                           │ │
│  │  - JWT authentication                          │ │
│  │                                                │ │
│  ├────────────────────────────────────────────────┤ │
│  │ John Doe • v3 • Updated 2h ago                 │ │
│  │ [ 📜 Version History ]                         │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ Testing Checklist                 [Edit] [×]   │ │
│  ├────────────────────────────────────────────────┤ │
│  │                                                │ │
│  │  - [ ] Unit tests                              │ │
│  │  - [ ] Integration tests                       │ │
│  │  - [x] E2E tests                               │ │
│  │                                                │ │
│  ├────────────────────────────────────────────────┤ │
│  │ Jane Smith • v1 • Updated 1d ago               │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

**Note Card Structure:**


1. **Header:** Title + Edit/Delete actions
2. **Body:** Rendered markdown (read mode) or editor (edit mode)
3. **Footer:** Author, version number, last updated time, version history link

**Markdown Editor:**

Use a library like:
- **react-markdown** + **remark-gfm** for rendering
- **@uiw/react-md-editor** or **react-simplemde-editor** for editing

**Features:**

- Live preview (split or toggle view)
- Syntax highlighting for code blocks
- Tables, lists, checkboxes support
- Image embedding support
- Auto-save every 3 seconds while editing
- Version history with diff view

**Version History Modal:**

```
┌──────────────────────────────────────────────────┐
│  Version History - Implementation Notes     [×]  │
├──────────────────────────────────────────────────┤
│                                                  │
│  ● v3 - Current                                  │
│    John Doe • June 27, 2026 2:00 PM             │
│    [ View ]  [ Restore ]                         │
│                                                  │
│  ● v2                                            │
│    John Doe • June 27, 2026 10:00 AM            │
│    [ View ]  [ Restore ]                         │
│                                                  │
│  ● v1 - Initial                                  │
│    Jane Smith • June 26, 2026 4:00 PM           │
│    [ View ]  [ Restore ]                         │
│                                                  │
└──────────────────────────────────────────────────┘
```

**API Integration:**

```typescript
// List notes
GET /tasks/:taskId/notes?page=1&limit=10 → PaginatedResponse<Note>

// Create note
POST /tasks/:taskId/notes { title?: string, content: string }

// Update note (creates new version)
PATCH /tasks/:taskId/notes/:noteId { title?: string, content?: string }

// Delete note
DELETE /tasks/:taskId/notes/:noteId

// Get version history (if backend supports)
GET /tasks/:taskId/notes/:noteId/versions → NoteVersion[]
```

**Empty State:**

```
┌──────────────────────────────────────────────────┐
│  Notes                                           │
│                                                  │
│         📝                                        │
│         No notes yet                             │
│         Document your work and ideas             │
│                                                  │
│  [ + Create Note ]                               │
└──────────────────────────────────────────────────┘
```



---

### 3.6 Comments Component

**Purpose:** Threaded discussions with replies, mentions, and reactions

**Visual Layout:**

```
┌───────────────────────────────────────────────────────┐
│  Comments (24)                                        │
│                                                       │
│  [ Write a comment... ]                    [ Post ]  │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │ [JD] John Doe • 2h ago                   [⋮]    │ │
│  │                                                 │ │
│  │ We should implement the API endpoints first.   │ │
│  │ @JaneSmith can you review the spec?             │ │
│  │                                                 │ │
│  │ 👍 3  ❤️ 1  [ 💬 Reply ]                        │ │
│  │                                                 │ │
│  │   ├─ [JS] Jane Smith • 1h ago                  │ │
│  │   │   Sure, I'll review it by EOD.             │ │
│  │   │   👍 1  [ 💬 Reply ]                        │ │
│  │                                                 │ │
│  │   └─ [JD] John Doe • 30m ago                   │ │
│  │       Thanks! Let me know if you need context. │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │ [AS] Admin • 1d ago                      [⋮]    │ │
│  │                                                 │ │
│  │ Priority changed to High. Please prioritize.   │ │
│  │                                                 │ │
│  │ 👍 5  [ 💬 Reply ]                              │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  [ Load More Comments ]                               │
└───────────────────────────────────────────────────────┘
```

**Comment Item Structure:**

1. **Header:**
   - Avatar
   - Author name
   - Timestamp (relative, e.g., "2h ago")
   - Actions menu (⋮): Edit, Delete

2. **Body:**
   - Comment text (markdown support)
   - Mentions highlighted (e.g., @JaneSmith in blue)
   - Links auto-detected and clickable

3. **Footer:**
   - Reaction pills (emoji + count)
   - Reply button

4. **Replies:**
   - Nested with left border/indentation
   - Same structure as parent comment
   - Max 1 level of nesting (replies to replies go to top level)

**Comment Input:**

```
┌─────────────────────────────────────────────────┐
│ [Avatar]  Write a comment...                   │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Type your comment here...                   │ │
│ │                                                 │ │
│ │ (Auto-expanding textarea)                      │ │
│ └─────────────────────────────────────────────────┘ │
│                                                 │
│ [ 😊 Emoji ] [ @Mention ]      [ Cancel ] [Post]│
└─────────────────────────────────────────────────┘
```

**Features:**

1. **Mentions:**
   - Type `@` to trigger user picker dropdown
   - Autocomplete with fuzzy search
   - Highlighted in final comment
   - Mentioned users get notifications

2. **Reactions:**
   - Click reaction pill to add/remove your reaction
   - Hover to see who reacted
   - Common reactions: 👍 ❤️ 🎉 👀 🚀

3. **Threading:**
   - Click "Reply" to open reply input below comment
   - Visual connection with left border
   - Auto-collapse after 3 replies with "Show more" toggle

4. **Real-time Updates:**
   - New comments appear without refresh
   - Use polling or WebSocket if available

**Mention Picker Dropdown:**

```
┌────────────────────────┐
│ @jan                   │
├────────────────────────┤
│ → Jane Smith           │
│   jane@company.com     │
│                        │
│   Janet Doe            │
│   janet@company.com    │
└────────────────────────┘
```

**API Integration:**


```typescript
// List comments
GET /tasks/:taskId/comments?page=1&limit=20 → PaginatedResponse<CommentItem>

// Create comment
POST /tasks/:taskId/comments {
  content: string;
  mentionedUserIds?: string[];
}

// Update comment
PATCH /tasks/:taskId/comments/:commentId {
  content: string;
  mentionedUserIds?: string[];
}

// Delete comment
DELETE /tasks/:taskId/comments/:commentId

// Create reply
POST /tasks/:taskId/comments/:commentId/replies {
  content: string;
}

// Delete reply
DELETE /tasks/:taskId/comments/:commentId/replies/:replyId

// Add reaction
POST /tasks/:taskId/comments/:commentId/reactions {
  emoji: string;
}
```

**Empty State:**

```
┌───────────────────────────────────────────────┐
│  Comments                                     │
│                                               │
│  💬                                            │
│  No comments yet                              │
│  Start the conversation                       │
│                                               │
│  [ Write a comment... ]                       │
└───────────────────────────────────────────────┘
```



---

### 3.7 Audit Timeline Component

**Purpose:** Complete activity log for task changes and actions

**Visual Layout:**

```
┌─────────────────────────────────────────────────┐
│  Activity                         ▼             │
│                                                 │
│  ● John Doe checked a step                     │
│    "Implement service layer"                   │
│    2 minutes ago                               │
│                                                 │
│  ● Jane Smith added a comment                  │
│    "We should implement the API..."            │
│    1 hour ago                                  │
│                                                 │
│  ● Admin changed priority                      │
│    Medium → High                               │
│    3 hours ago                                 │
│                                                 │
│  ● John Doe uploaded an attachment             │
│    design_spec.pdf (2.4 MB)                    │
│    5 hours ago                                 │
│                                                 │
│  ● System updated effort                       │
│    Actual: 24 PH → 28 PH (+4 PH)               │
│    1 day ago                                   │
│                                                 │
│  ● Jane Smith assigned task to John Doe        │
│    2 days ago                                  │
│                                                 │
│  ● Admin created task                          │
│    June 25, 2026                               │
└─────────────────────────────────────────────────┘
```



**Activity Item Structure:**

```
● [Actor] [Action Description]
  [Details/Context]
  [Timestamp]
```

**Activity Types:**

| Action | Icon Color | Example |
|--------|-----------|---------|
| Task Created | Blue | Admin created task |
| Status Changed | Purple | todo → in_progress |
| Priority Changed | Orange | Medium → High |
| User Assigned | Green | Jane assigned John |
| User Unassigned | Red | John unassigned |
| Step Checked | Green | John checked "Write tests" |
| Step Unchecked | Gray | Jane unchecked "Deploy" |
| Attachment Added | Blue | John uploaded design.pdf |
| Attachment Deleted | Red | Jane deleted old_doc.pdf |
| Comment Added | Blue | John commented "..." |
| Note Created | Purple | Jane created "API Notes" |
| Note Updated | Purple | Jane updated "API Notes" |
| Effort Updated | Orange | Actual: 20→24 PH |
| Due Date Changed | Orange | June 30 → July 2 |
| Task Completed | Green | Status changed to Done |

**Features:**

1. **Collapsible:** Start collapsed with "Show Activity" toggle
2. **Filtering:** Filter by action type (all, status changes, assignments, etc.)
3. **Pagination:** Load more on scroll or "Load More" button
4. **Relative Time:** "2 minutes ago", "1 hour ago", "2 days ago"
5. **Before/After Values:** Show what changed (e.g., "Medium → High")

**API Integration:**

```typescript
// Backend already has audit trails in database
// Query audit trails filtered by task entity

GET /tasks/:taskId/activity → AuditTrail[]

// Or use existing audit endpoint
GET /audit?entityType=task&entityId=:taskId&page=1&limit=50
```

**Empty State:**

```
┌─────────────────────────────────────────────────┐
│  Activity                                       │
│                                                 │
│  📊                                              │
│  No activity yet                                │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### 3.8 Assignment History Component

**Purpose:** Track who was assigned to the task and when

**Visual Layout:**

```
┌─────────────────────────────────────────────────┐
│  Assignment History               ▼             │
│                                                 │
│  [JD] John Doe                                  │
│       ↓ Assigned by Admin                      │
│       June 27, 2026 (Current)                  │
│                                                 │
│  [JS] Jane Smith                                │
│       ↓ Assigned by Admin                      │
│       June 26, 2026 - June 27, 2026 (1 day)     │
│                                                 │
│  [AD] Alex Developer                            │
│       ↓ Assigned by Jane Smith                 │
│       June 25, 2026 - June 26, 2026 (1 day)    │
└─────────────────────────────────────────────────┘
```

**Features:**

1. **Timeline Flow:** Most recent at top
2. **Duration:** Show how long each person was assigned
3. **Current Indicator:** Highlight current assignee
4. **Assigner:** Show who made the assignment

**API Integration:**

```typescript
GET /tasks/:taskId/assignees → TaskAssignee[]
// Returns all assignments including unassigned ones
```

---

## 4. Additional Views

### 4.1 My Tasks Page

**Route:** `/tasks` or `/dashboard/my-tasks`

**Purpose:** Personal task dashboard for staff members

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│  My Tasks                        [ 🔍 Search ] [ Filter ]│
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Tabs: [ All ] [ To Do ] [ In Progress ] [ Review ]     │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [ High ] Implement user authentication          │ │
│  │ Sprint 1 • Due June 30 • 4/5 steps             │ │
│  │ [ In Progress ]  [→]                           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [ Critical ] Fix production bug                    │ │
│  │ Sprint 1 • Overdue by 2 days • 1/3 steps          │ │
│  │ [ To Do ]  [→]                                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [ Medium ] Update API documentation                │ │
│  │ Sprint 2 • Due July 5 • 0/2 steps                 │ │
│  │ [ Review ]  [→]                                    │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Task Card Structure:**

```
┌───────────────────────────────────────────────┐
│ [ Priority Badge ] Task Name                  │
│ Sprint Name • Due Date • Step Progress        │
│ [ Status Badge ]  [ → View ]                  │
└───────────────────────────────────────────────┘
```

**Features:**

1. **Filters:**
   - By status (tabs)
   - By priority (dropdown)
   - By sprint (dropdown)
   - By due date (overdue, today, this week, later)

2. **Sorting:**
   - Priority (critical first)
   - Due date (earliest first)
   - Recently updated
   - Alphabetical

3. **Search:** Real-time search by task name or description

4. **Quick Actions:**
   - Click card to open task detail
   - Update status without opening (dropdown on hover)

**API Integration:**

```typescript
// Get tasks assigned to current user
GET /tasks/me?status=in_progress&page=1&limit=20

// Or use existing sprint tasks endpoint with assignee filter
GET /sprints/:sprintId/tasks?assigneeId=:userId
```

---

### 4.2 Task Board (Kanban)

**Route:** `/projects/:projectId/sprints/:sprintId/board`

**Purpose:** Visual kanban board for sprint task management

**Layout:**

```
┌───────────────────────────────────────────────────────────────────┐
│  Sprint 1 Board             [ Search ]  [ Filter ]  [ + New Task ]│
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────┐  ┌─────────────┐  ┌────────┐  ┌──────┐              │
│  │ TO DO  │  │ IN PROGRESS │  │ REVIEW │  │ DONE │              │
│  │  (5)   │  │     (3)     │  │  (2)   │  │ (12) │              │
│  ├────────┤  ├─────────────┤  ├────────┤  ├──────┤              │
│  │        │  │             │  │        │  │      │              │
│  │ ┌────┐ │  │ ┌─────────┐ │  │ ┌────┐ │  │ ┌──┐ │              │
│  │ │Task│ │  │ │  Task   │ │  │ │Task│ │  │ │T │ │              │
│  │ │ #1 │ │  │ │   #6    │ │  │ │#15 │ │  │ │#2│ │              │
│  │ └────┘ │  │ │         │ │  │ └────┘ │  │ └──┘ │              │
│  │        │  │ │ [High]  │ │  │        │  │      │              │
│  │ ┌────┐ │  │ │ 👤👤    │ │  │ ┌────┐ │  │ ┌──┐ │              │
│  │ │Task│ │  │ └─────────┘ │  │ │Task│ │  │ │T │ │              │
│  │ │ #3 │ │  │             │  │ │#18 │ │  │ │#4│ │              │
│  │ └────┘ │  │ ┌─────────┐ │  │ └────┘ │  │ └──┘ │              │
│  │        │  │ │  Task   │ │  │        │  │      │              │
│  │ ┌────┐ │  │ │   #9    │ │  │        │  │      │              │
│  │ │Task│ │  │ └─────────┘ │  │        │  │      │              │
│  │ │ #5 │ │  │             │  │        │  │      │              │
│  │ └────┘ │  │             │  │        │  │      │              │
│  │        │  │             │  │        │  │      │              │
│  └────────┘  └─────────────┘  └────────┘  └──────┘              │
└───────────────────────────────────────────────────────────────────┘
```



**Task Card (Kanban):**

```
┌─────────────────────────────┐
│ [ High ] Task Name          │
│                             │
│ Short description preview   │
│                             │
│ 🎯 3/5 steps                 │
│ 📎 2 attachments            │
│                             │
│ [👤] [👤] +2                 │
└─────────────────────────────┘
```

**Features:**

1. **Drag and Drop:**
   - Drag cards between columns
   - Updates task status automatically
   - Smooth animations
   - Drop zones highlighted on drag

2. **Column Headers:**
   - Status name
   - Task count
   - Collapse/expand column

3. **Quick Actions (hover):**
   - View task details (click card)
   - Edit task inline (quick edit icon)
   - Assign users (avatar click)

4. **Filters:**
   - By assignee
   - By priority
   - By due date
   - By tags (if implemented)

5. **Search:** Filter tasks in real-time

**Drag-and-Drop Library:**

Use **@dnd-kit/core** for modern drag-and-drop with:
- Keyboard accessibility
- Touch support
- Smooth animations

**API Integration:**


```typescript
// Get all tasks in sprint grouped by status
GET /sprints/:sprintId/tasks → Task[]
// Group on frontend by status

// Update task status (when card is dropped)
PATCH /tasks/:taskId/status { status: TaskStatus }
```

---

### 4.3 Command Palette

**Trigger:** `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)

**Purpose:** Global search and quick actions

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│  🔍  Search tasks, projects, or actions...          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  TASKS                                              │
│  → Implement user authentication                    │
│    Sprint 1 • In Progress • Due June 30            │
│                                                     │
│  → Fix production bug                               │
│    Sprint 1 • To Do • Overdue                      │
│                                                     │
│  PROJECTS                                           │
│  → Backend API                                      │
│    5 active sprints • 24 tasks                     │
│                                                     │
│  QUICK ACTIONS                                      │
│  + Create new task                                  │
│  + Create new project                               │
│  ⚙️ Go to settings                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```



**Features:**

1. **Search Modes:**
   - Empty state: Show recent items and quick actions
   - With query: Show filtered results across all entities

2. **Result Categories:**
   - Tasks
   - Projects
   - Sprints
   - Staff members
   - Quick actions

3. **Navigation:**
   - Arrow keys to navigate results
   - Enter to select
   - Esc to close

4. **Result Preview:**
   - Hover shows preview panel on right
   - Task preview: status, assignees, description
   - Project preview: sprint count, task count

5. **Keyboard Shortcuts:**
   - `Cmd+K`: Open palette
   - `↑↓`: Navigate
   - `Enter`: Select
   - `Esc`: Close
   - `Cmd+P`: Jump to project
   - `Cmd+T`: Jump to task

**Implementation:**

Use **cmdk** library by Paco (same as Linear uses):
- Fuzzy search
- Keyboard navigation
- Accessible
- Minimal styling

**API Integration:**

```typescript
// Global search endpoint
GET /search?q=authentication&type=task,project,sprint

// Returns unified results with type discrimination
{
  tasks: Task[];
  projects: Project[];
  sprints: Sprint[];
}
```



---

### 4.4 Notification Center

**Trigger:** Bell icon in global header

**Purpose:** Real-time notifications for task activity

**Layout:**

```
┌─────────────────────────────────────────────────┐
│  Notifications                  [ Mark All Read ]│
├─────────────────────────────────────────────────┤
│                                                 │
│  ● John Doe assigned you to "Auth System"      │
│    Sprint 1 • 5 minutes ago                    │
│                                                 │
│  ● Jane Smith mentioned you in a comment       │
│    "Can you review the API spec?"              │
│    Task: Implement API • 1 hour ago            │
│                                                 │
│  ○ Task "Fix bug" is overdue                   │
│    Due June 25 • 2 days ago                    │
│                                                 │
│  ○ Sprint 1 deadline approaching                │
│    Ends June 30 • Tomorrow                     │
│                                                 │
│  [ Load More ]                                  │
└─────────────────────────────────────────────────┘
```

**Notification Types:**

| Type | Priority | Icon |
|------|----------|------|
| Assigned to task | High | 👤 |
| Mentioned in comment | High | @ |
| Task overdue | High | ⏰ |
| Comment reply | Medium | 💬 |
| Status changed | Medium | 🔄 |
| Sprint deadline | Medium | 📅 |
| Attachment added | Low | 📎 |



**Features:**

1. **Unread Indicator:**
   - Badge count on bell icon
   - Bold text for unread notifications
   - Blue dot indicator

2. **Click to Navigate:**
   - Clicking notification navigates to related task/entity
   - Marks notification as read

3. **Mark All Read:**
   - Button to mark all as read
   - Individual mark as read on hover

4. **Polling/Real-time:**
   - Poll every 30 seconds for new notifications
   - Or use WebSocket for real-time updates

**API Integration:**

```typescript
// Get notifications for current user
GET /notifications?page=1&limit=20 → Notification[]

// Mark as read
PATCH /notifications/:id/read

// Mark all as read
PATCH /notifications/read-all
```

**Note:** Notification system not in current backend, would need to be implemented.

---

## 5. Design System

### 5.1 Typography

**Font Family:**

```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

**Type Scale:**

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| Heading 1 | 2rem (32px) | 700 | 1.2 | Page titles |
| Heading 2 | 1.5rem (24px) | 600 | 1.3 | Section headings |
| Heading 3 | 1.25rem (20px) | 600 | 1.4 | Component titles |
| Body Large | 1rem (16px) | 400 | 1.5 | Task descriptions |
| Body | 0.875rem (14px) | 400 | 1.5 | Default text |
| Body Small | 0.8125rem (13px) | 400 | 1.5 | Captions, labels |
| Caption | 0.75rem (12px) | 400 | 1.4 | Timestamps, metadata |
| Code | 0.875rem (14px) | 400 | 1.6 | Code blocks |

---

### 5.2 Color Palette

**Brand Colors (from existing theme):**

```typescript
brand: {
  50:  '#f0f4ff',  // Lightest
  100: '#e0eaff',
  200: '#c7d7fd',
  300: '#a4bafc',
  400: '#7b92f8',
  500: '#5a6bf2',  // Primary
  600: '#4248e7',  // Primary Dark
  700: '#3835cc',
  800: '#2f2da4',
  900: '#2b2b82',
  950: '#1a1a50',  // Darkest
}
```

**Semantic Colors:**

```typescript
// Success (Green)
success: {
  bg: '#f0fdf4',
  text: '#15803d',
  border: '#86efac',
}

// Warning (Yellow/Orange)
warning: {
  bg: '#fffbeb',
  text: '#b45309',
  border: '#fcd34d',
}

// Danger (Red)
danger: {
  bg: '#fef2f2',
  text: '#dc2626',
  border: '#fca5a5',
}

// Info (Blue)
info: {
  bg: '#eff6ff',
  text: '#2563eb',
  border: '#93c5fd',
}

// Gray Scale
gray: {
  50:  '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
}
```

**Status Colors:**

```typescript
taskStatus: {
  todo: { bg: 'gray-100', text: 'gray-700', dot: 'gray-400' },
  in_progress: { bg: 'blue-100', text: 'blue-700', dot: 'blue-500' },
  review: { bg: 'purple-100', text: 'purple-700', dot: 'purple-500' },
  done: { bg: 'green-100', text: 'green-700', dot: 'green-500' },
}

taskPriority: {
  low: { bg: 'gray-100', text: 'gray-600' },
  medium: { bg: 'blue-100', text: 'blue-700' },
  high: { bg: 'orange-100', text: 'orange-700' },
  critical: { bg: 'red-100', text: 'red-700' },
}
```

---

### 5.3 Spacing System


**Scale (Tailwind defaults):**

| Token | Value | Usage |
|-------|-------|-------|
| 1 | 0.25rem (4px) | Micro spacing |
| 2 | 0.5rem (8px) | Tight spacing |
| 3 | 0.75rem (12px) | Compact spacing |
| 4 | 1rem (16px) | Base spacing |
| 5 | 1.25rem (20px) | Comfortable spacing |
| 6 | 1.5rem (24px) | Relaxed spacing |
| 8 | 2rem (32px) | Section spacing |
| 10 | 2.5rem (40px) | Large section spacing |
| 12 | 3rem (48px) | Page section spacing |

**Usage Guidelines:**

- Component internal padding: `4` (16px)
- Card padding: `5` (20px)
- Section gaps: `6` (24px)
- Page padding: `6` (24px)
- Gap between related items: `2` (8px)
- Gap between sections: `8` (32px)

---

### 5.4 Border Radius

```typescript
borderRadius: {
  none: '0',
  sm: '0.25rem',   // 4px - small elements
  md: '0.375rem',  // 6px - inputs, buttons
  lg: '0.5rem',    // 8px - cards (DEFAULT)
  xl: '0.75rem',   // 12px - large cards
  '2xl': '1rem',   // 16px - modals
  full: '9999px',  // circles, pills
}
```

**Usage:**

- Buttons: `rounded-lg` (8px)
- Cards: `rounded-xl` (12px)
- Inputs: `rounded-lg` (8px)
- Badges: `rounded-full` (pill shape)
- Avatars: `rounded-full` (circle)
- Modals: `rounded-2xl` (16px)

---

### 5.5 Shadows

```typescript
shadows: {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',           // Subtle elevation
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',         // Card default
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',       // Dropdown, popover
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',       // Modal
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',  // Input focus
}
```

**Usage:**

- Cards: `shadow-sm` or `shadow-md`
- Dropdowns: `shadow-lg`
- Modals: `shadow-xl`
- Focused inputs: `shadow-inner` with ring

---

### 5.6 Animations & Transitions

**Transition Durations:**

```typescript
duration: {
  fast: '150ms',      // Hover states, clicks
  normal: '200ms',    // Default transitions
  slow: '300ms',      // Complex animations
  slower: '500ms',    // Page transitions
}
```

**Easing:**

```typescript
easing: {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',  // ease-in-out
  in: 'cubic-bezier(0.4, 0, 1, 1)',         // ease-in
  out: 'cubic-bezier(0, 0, 0.2, 1)',           // ease-out
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // bounce
}
```

**Common Animations:**

1. **Fade In:**
   ```css
   @keyframes fadeIn {
     from { opacity: 0; }
     to { opacity: 1; }
   }
   ```

2. **Slide In (from bottom):**
   ```css
   @keyframes slideIn {
     from { transform: translateY(10px); opacity: 0; }
     to { transform: translateY(0); opacity: 1; }
   }
   ```

3. **Scale In:**
   ```css
   @keyframes scaleIn {
     from { transform: scale(0.95); opacity: 0; }
     to { transform: scale(1); opacity: 1; }
   }
   ```

**Usage:**

- Hover states: `transition-colors duration-150`
- Modal open: `slideIn 200ms ease-out`
- Dropdown open: `scaleIn 150ms ease-out`
- Drag and drop: `transform 200ms ease-out`

---

### 5.7 Component Patterns

**Card Component:**

```tsx
interface CardProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
  hover?: boolean;
}

<Card padding="md" shadow hover>
  {children}
</Card>
```



**Empty State Component:**

```tsx
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

<EmptyState
  icon={<FileIcon />}
  title="No attachments yet"
  description="Upload files to share with your team"
  action={{ label: "Upload Files", onClick: handleUpload }}
/>
```

**Skeleton Loader Pattern:**

```tsx
// Replace spinners with skeleton loaders
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
  <div className="h-4 bg-gray-200 rounded w-1/2" />
</div>
```

**Loading States:**

- Use skeleton loaders for content areas
- Use inline spinners only for actions (button loading states)
- Show progressive loading for large lists (load more on scroll)

---

### 5.8 Iconography

**Icon Library:** Lucide React (already in use)

**Common Icons:**

| Use Case | Icon | Component |
|----------|------|-----------|
| Task | CheckSquare | `<CheckSquare />` |
| Project | FolderKanban | `<FolderKanban />` |
| Sprint | Zap | `<Zap />` |
| User | User | `<User />` |
| Attachment | Paperclip | `<Paperclip />` |
| Note | FileText | `<FileText />` |
| Comment | MessageSquare | `<MessageSquare />` |
| Priority High | AlertCircle | `<AlertCircle />` |
| Priority Critical | AlertTriangle | `<AlertTriangle />` |
| Calendar | Calendar | `<Calendar />` |
| Clock | Clock | `<Clock />` |
| Edit | Pencil | `<Pencil />` |
| Delete | Trash2 | `<Trash2 />` |
| Download | Download | `<Download />` |
| Upload | Upload | `<Upload />` |
| Search | Search | `<Search />` |
| Filter | Filter | `<Filter />` |
| More Actions | MoreVertical | `<MoreVertical />` |
| Close | X | `<X />` |
| Check | Check | `<Check />` |
| Arrow Right | ArrowRight | `<ArrowRight />` |
| Chevron Down | ChevronDown | `<ChevronDown />` |

**Icon Sizes:**

- Small: `h-4 w-4` (16px) — Inline with text
- Medium: `h-5 w-5` (20px) — Buttons, badges
- Large: `h-6 w-6` (24px) — Page headers
- XLarge: `h-8 w-8` (32px) — Empty states

---

### 5.9 Accessibility

**WCAG 2.1 Level AA Compliance:**

1. **Color Contrast:**
   - Text on white: minimum 4.5:1 ratio
   - Large text (18px+): minimum 3:1 ratio
   - Interactive elements: visible focus indicators

2. **Keyboard Navigation:**
   - All interactive elements focusable
   - Tab order follows visual order
   - Keyboard shortcuts documented
   - Skip to main content link

3. **Screen Readers:**
   - Semantic HTML (`<nav>`, `<main>`, `<article>`)
   - ARIA labels for icon-only buttons
   - ARIA live regions for dynamic content
   - Alt text for images

4. **Focus Management:**
   - Visible focus rings (brand-500 with offset)
   - Focus trap in modals
   - Return focus on modal close

5. **Forms:**
   - Associated labels with inputs
   - Error messages linked to inputs
   - Required fields indicated

**Focus Ring Style:**

```css
.focus-visible:focus {
  outline: 2px solid theme('colors.brand.500');
  outline-offset: 2px;
}
```

---

### 5.10 Responsive Breakpoints

**Breakpoints:**

```typescript
breakpoints: {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet portrait
  lg: '1024px',  // Tablet landscape
  xl: '1280px',  // Desktop
  '2xl': '1536px', // Large desktop
}
```

**Layout Behavior:**

| Screen | Layout | Navigation |
|--------|--------|------------|
| Mobile (<768px) | Single column, stacked | Bottom tabs or hamburger menu |
| Tablet (768-1279px) | Two-column, collapsible sidebar | Collapsed sidebar by default |
| Desktop (≥1280px) | Two-column, persistent sidebar | Expanded sidebar |



**Mobile-Specific Patterns:**

1. **Task Detail Page:**
   - Single column layout
   - Tabs for switching between Content and Metadata
   - Bottom sheet for quick actions
   - Swipe gestures for navigation

2. **Task Board:**
   - Horizontal scroll for columns
   - Snap to column on scroll stop
   - Card grid view instead of list

3. **Command Palette:**
   - Full-screen overlay on mobile
   - Larger touch targets
   - Bottom-anchored on iOS

---

## 6. Implementation Roadmap

### Phase 1: Core Task Experience (Priority P0)

**Goal:** Build the complete Task Detail page — the heart of the product.

**Tasks:**

1. **Task Dashboard Page** (`/tasks/[taskId]`)
   - File: `src/app/(dashboard)/tasks/[taskId]/page.tsx`
   - Layout: Two-column responsive layout
   - Routing: Dynamic route with task ID
   - Data fetching: `useQuery` for task detail
   - Duration: 2 days

2. **Task Header Component**
   - File: `src/components/tasks/TaskHeader.tsx`
   - Features: Breadcrumbs, task name, status dropdown, quick actions
   - Inline editing for task name
   - Duration: 1 day

3. **Effort Tracking Widget**
   - File: `src/components/tasks/EffortWidget.tsx`
   - Visual progress bars with color coding
   - Edit effort modal
   - Slippage calculation and display
   - Duration: 1 day

4. **Task Steps Component**
   - File: `src/components/tasks/TaskSteps.tsx`
   - Checklist with progress indicator
   - Check/uncheck with optimistic updates
   - Drag-and-drop reordering (use @dnd-kit/core)
   - Add/delete steps
   - Duration: 2 days

5. **Attachments Component**
   - File: `src/components/tasks/Attachments.tsx`
   - File upload with progress indicator
   - Grid view with file type icons
   - Preview modal for images/PDFs
   - Download functionality
   - Duration: 2 days

6. **Notes Component**
   - File: `src/components/tasks/Notes.tsx`
   - Markdown editor (use @uiw/react-md-editor)
   - Note cards with edit/delete
   - Version history (if time permits, else defer to Phase 2)
   - Duration: 2 days

7. **Comments Component**
   - File: `src/components/tasks/Comments.tsx`
   - Comment input with mentions (use @tiptap/react or simple textarea)
   - Threaded replies (1 level deep)
   - Emoji reactions
   - Duration: 3 days

8. **Audit Timeline Component**
   - File: `src/components/tasks/AuditTimeline.tsx`
   - Activity log with icons and formatting
   - Collapsible by default
   - Pagination for long histories
   - Duration: 1 day

9. **Assignment History Component**
   - File: `src/components/tasks/AssignmentHistory.tsx`
   - Timeline of assignee changes
   - Duration calculation
   - Duration: 1 day


**Total Duration:** ~15 days (3 weeks)

**Deliverables:**
- Fully functional Task Detail page
- All 8 sub-components working
- API integration complete
- Responsive design for desktop and tablet
- Empty states for all sections

---

### Phase 2: Task Management Views (Priority P1)

**Goal:** Build task-centric views for discovery and organization.

**Tasks:**

1. **My Tasks Page** (`/tasks` or `/dashboard/my-tasks`)
   - File: `src/app/(dashboard)/tasks/page.tsx`
   - Task list with filters and search
   - Status tabs
   - Quick actions on hover
   - Duration: 2 days

2. **Task Board (Kanban)** (`/projects/:projectId/sprints/:sprintId/board`)
   - File: `src/app/(dashboard)/projects/[projectId]/sprints/[sprintId]/board/page.tsx`
   - Drag-and-drop columns (use @dnd-kit/core)
   - Task cards with metadata
   - Filters by assignee, priority, etc.
   - Duration: 3 days

3. **Command Palette**
   - File: `src/components/command-palette/CommandPalette.tsx`
   - Global search using cmdk library
   - Keyboard shortcuts
   - Quick actions
   - Duration: 2 days

4. **Mobile Responsiveness**
   - Audit all components for mobile
   - Single-column layouts
   - Touch-friendly interactions
   - Bottom sheets for actions
   - Duration: 3 days

5. **Error Pages**
   - Files: `src/app/not-found.tsx`, `src/app/error.tsx`
   - 404, 403, 500 error pages
   - Friendly messages and navigation
   - Duration: 1 day


6. **Empty States Everywhere**
   - Create reusable EmptyState component
   - Add to all list views and components
   - Custom icons and messages
   - Duration: 1 day

7. **Skeleton Loaders**
   - Replace all spinners with skeleton loaders
   - Create skeleton components for cards, lists, etc.
   - Duration: 1 day

**Total Duration:** ~13 days (2.5 weeks)

**Deliverables:**
- My Tasks page
- Kanban board
- Command palette
- Mobile-responsive layouts
- Error pages
- Empty states and loading states

---

### Phase 3: Analytics & Enhancements (Priority P2)

**Goal:** Add analytics, user profiles, and polish.

**Tasks:**

1. **Project Analytics Dashboard**
   - File: `src/app/(dashboard)/projects/[projectId]/analytics/page.tsx`
   - Task completion charts
   - Sprint velocity
   - Team performance metrics
   - Duration: 3 days

2. **Sprint Analytics Dashboard**
   - File: `src/app/(dashboard)/projects/[projectId]/sprints/[sprintId]/analytics/page.tsx`
   - Burndown chart
   - Task breakdown
   - Effort tracking
   - Duration: 2 days

3. **User Profile Pages**
   - File: `src/app/(dashboard)/users/[userId]/page.tsx`
   - User info and activity
   - Assigned tasks
   - Contribution history
   - Duration: 2 days

4. **Notification Center** (if backend supports)
   - File: `src/components/notifications/NotificationCenter.tsx`
   - Bell icon dropdown
   - Notification list with read/unread
   - Mark as read functionality
   - Duration: 2 days (requires backend API)

5. **Advanced Filters**
   - Multi-select filters for tasks
   - Saved filter presets
   - URL state persistence
   - Duration: 2 days

6. **Keyboard Shortcuts Panel**
   - File: `src/components/shortcuts/ShortcutsPanel.tsx`
   - Help modal showing all shortcuts
   - Trigger: `?` key
   - Duration: 1 day

7. **Dark Mode** (Optional)
   - Theme toggle in settings
   - Dark color palette
   - Persist preference
   - Duration: 2 days

**Total Duration:** ~14 days (3 weeks)

**Deliverables:**
- Analytics dashboards
- User profiles
- Notification center
- Advanced filters
- Keyboard shortcuts panel
- Optional dark mode

---

### Total Implementation Estimate

| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 1: Core Task Experience | 3 weeks | P0 — CRITICAL |
| Phase 2: Task Management Views | 2.5 weeks | P1 — HIGH |
| Phase 3: Analytics & Enhancements | 3 weeks | P2 — MEDIUM |
| **Total** | **8.5 weeks** | — |

**Note:** This is a single developer estimate. With 2 developers working in parallel, reduce timeline by ~40%.

---

## 7. Technical Implementation Notes



### 7.1 Required Dependencies

**Install these packages:**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install @uiw/react-md-editor
npm install react-markdown remark-gfm
npm install cmdk
npm install date-fns
npm install react-dropzone
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-mention
```

**Dependency Purpose:**

| Package | Purpose |
|---------|---------|
| @dnd-kit/* | Drag-and-drop for steps and kanban board |
| @uiw/react-md-editor | Markdown editor for notes |
| react-markdown | Markdown rendering for notes and comments |
| cmdk | Command palette (Linear-style) |
| date-fns | Date formatting and manipulation |
| react-dropzone | File upload with drag-and-drop |
| @tiptap/* | Rich text editor for comments with mentions |

---

### 7.2 State Management

**Use TanStack Query (React Query) for:**
- Server state (tasks, comments, attachments, etc.)
- Caching and invalidation
- Optimistic updates

**Use Zustand for:**
- UI state (sidebar open/closed, command palette open)
- User preferences (view mode, filters)

**Example Query Hook:**

```typescript
// src/lib/hooks/use-task.ts
export function useTask(taskId: string) {
  return useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => tasksApi.getById(taskId).then(r => r.data.data),
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      tasksApi.updateStatus(taskId, status).then(r => r.data.data),
    onSuccess: (data, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
    },
  });
}
```

---

### 7.3 Optimistic Updates Pattern

**For instant UI feedback:**

```typescript
export function useCheckStep() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, stepId }: { taskId: string; stepId: string }) =>
      stepsApi.check(taskId, stepId).then(r => r.data.data),
    
    // Optimistic update
    onMutate: async ({ taskId, stepId }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', taskId] });
      
      const previous = queryClient.getQueryData(['tasks', taskId]);
      
      queryClient.setQueryData(['tasks', taskId], (old: TaskDetail) => ({
        ...old,
        steps: old.steps.map(step =>
          step.id === stepId ? { ...step, isChecked: true } : step
        ),
      }));
      
      return { previous };
    },
    
    // Rollback on error
    onError: (err, { taskId }, context) => {
      queryClient.setQueryData(['tasks', taskId], context.previous);
    },
    
    // Always refetch
    onSettled: (data, error, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
    },
  });
}
```

---

### 7.4 File Upload Pattern


**Use react-dropzone for file uploads:**

```typescript
import { useDropzone } from 'react-dropzone';

export function AttachmentUpload({ taskId }: { taskId: string }) {
  const [uploading, setUploading] = useState(false);
  const uploadMutation = useUploadAttachment(taskId);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (files) => {
      setUploading(true);
      for (const file of files) {
        await uploadMutation.mutateAsync(file);
      }
      setUploading(false);
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer",
        isDragActive ? "border-brand-500 bg-brand-50" : "border-gray-300"
      )}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <p>Uploading...</p>
      ) : isDragActive ? (
        <p>Drop files here...</p>
      ) : (
        <p>Drag files here or click to browse</p>
      )}
    </div>
  );
}
```

---

### 7.5 Markdown Rendering

**For notes and comment content:**

```typescript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="prose prose-sm max-w-none"
      components={{
        // Custom rendering for links
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-600">
            {children}
          </a>
        ),
        // Custom rendering for code blocks
        code: ({ className, children }) => {
          const isInline = !className;
          return isInline ? (
            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">{children}</code>
          ) : (
            <code className={className}>{children}</code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

---

### 7.6 Keyboard Shortcuts

**Global shortcuts handler:**

```typescript
// src/hooks/use-keyboard-shortcuts.ts
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Cmd+K: Command palette
      if (isCmdOrCtrl && e.key === 'k') {
        e.preventDefault();
        // Open command palette
      }

      // Cmd+P: Jump to project
      if (isCmdOrCtrl && e.key === 'p') {
        e.preventDefault();
        // Open project picker
      }

      // Cmd+T: Jump to task
      if (isCmdOrCtrl && e.key === 't') {
        e.preventDefault();
        // Open task picker
      }

      // ?: Show shortcuts help
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        // Open shortcuts panel
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);
}
```

---

### 7.7 Error Handling

**Global error boundary:**

```typescript
// src/app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Something went wrong
      </h1>
      <p className="text-gray-600 mb-6">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
      >
        Try again
      </button>
    </div>
  );
}
```

---

### 7.8 Performance Optimization

**Best Practices:**

1. **Code Splitting:**
   - Use dynamic imports for heavy components
   ```typescript
   const MarkdownEditor = dynamic(() => import('@uiw/react-md-editor'), {
     ssr: false,
     loading: () => <Skeleton />,
   });
   ```

2. **Image Optimization:**
   - Use Next.js Image component
   ```typescript
   import Image from 'next/image';
   <Image src={url} alt={alt} width={200} height={200} />
   ```

3. **Virtualization:**
   - For long lists (comments, audit logs), use react-virtual
   ```bash
   npm install @tanstack/react-virtual
   ```

4. **Debounce Search:**
   ```typescript
   import { useDebouncedValue } from '@/hooks/use-debounced-value';
   
   const [search, setSearch] = useState('');
   const debouncedSearch = useDebouncedValue(search, 300);
   ```

5. **Memoization:**
   ```typescript
   const filteredTasks = useMemo(() => {
     return tasks.filter(task => task.status === selectedStatus);
   }, [tasks, selectedStatus]);
   ```

---

## 8. Design Handoff Checklist

Before implementation begins, ensure:

- [ ] All component specifications are reviewed and approved
- [ ] API contracts verified with backend team
- [ ] Design tokens (colors, spacing, typography) documented
- [ ] Accessibility requirements understood
- [ ] Responsive breakpoints agreed upon
- [ ] Empty states designed for all components
- [ ] Loading states defined (skeleton loaders)
- [ ] Error states designed
- [ ] Keyboard shortcuts documented
- [ ] Icon library selected and documented
- [ ] Animation/transition guidelines defined
- [ ] Mobile-specific patterns documented

---

## 9. Open Questions

**For Discussion:**

1. **Notifications:**
   - Does the backend support a notifications system?
   - If not, should we implement one or defer to Phase 3?

2. **Real-time Updates:**
   - Should we implement WebSocket for live comments/updates?
   - Or is polling sufficient for MVP?

3. **File Storage:**
   - Where are attachments stored? (S3, local filesystem?)
   - What's the max file size limit?
   - Are there file type restrictions?

4. **Mentions:**
   - Should mentions trigger email notifications?
   - In-app notifications only?

5. **Search:**
   - Is there a global search endpoint?
   - Should search be implemented on frontend (client-side filtering)?
   - Or does backend need to add a search API?

6. **Version History (Notes):**
   - Backend has `NoteVersion` model — is there an API endpoint?
   - If not, should we add it or skip version history for MVP?

7. **Dark Mode:**
   - Is dark mode a requirement for Phase 1?
   - Or can it be deferred to Phase 3?

---

## 10. Success Metrics

**How to measure success of the Task Experience:**

1. **User Engagement:**
   - Average time spent on Task Detail page
   - Number of tasks viewed per session
   - Task updates per user per day

2. **Feature Adoption:**
   - % of tasks with steps added
   - % of tasks with attachments
   - % of tasks with comments
   - % of tasks with notes

3. **Efficiency Metrics:**
   - Time to complete a task (creation to done)
   - Number of clicks to update task status
   - Search success rate (command palette)

4. **User Satisfaction:**
   - User feedback surveys
   - Support ticket volume (should decrease)
   - Feature requests for task improvements

---

## 11. Conclusion

This design specification provides a complete blueprint for building an enterprise-grade Task Experience in BRMH Teams.

**Key Principles:**

1. **Task-Centric:** Everything revolves around tasks
2. **Enterprise Quality:** Match Linear, Notion, Vercel visual standards
3. **Accessible:** WCAG 2.1 AA compliant
4. **Responsive:** Works on desktop, tablet, mobile
5. **Performant:** Fast interactions, optimistic updates

**Next Steps:**

1. ✅ Design specification complete (this document)
2. ⏭️ Review and approval from stakeholders
3. ⏭️ Backend API verification and adjustments
4. ⏭️ Begin Phase 1 implementation

**DO NOT START IMPLEMENTATION until this design is reviewed and approved.**

---

**Document Version:** 1.0  
**Last Updated:** June 27, 2026  
**Status:** Ready for Review

