# Implementation Plan: Kanban-based Project Management System

This plan outlines the steps to build the Kanban-based project management system as described.

## Phase 1: Database Schema Design & Setup

**Goal**: Define the data models required for the application.

- [ ] **Update Prisma Schema**:
    - Add `Role` enum to `User` (DEVELOPER, USER).
    - Create `Project` model (id, name, description, ownerId, createdAt, updatedAt).
    - Create `Task` model (id, title, description, status, projectId, authorId, createdAt, updatedAt, index).
    - Create `Label` model (id, name, color, projectId).
    - Create `Comment` model (id, content, taskId, authorId, createdAt).
    - Create `Vote` model (taskId, userId, createdAt).
    - Create `Reaction` model (taskId, userId, emoji, createdAt).
    - Create `Event` model (optional, for the mock system if persistence is needed, or just keep it in-memory/log).
    - Define relationships between models.
- [ ] **Run Migration**: Apply changes to the database.

## Phase 2: Backend Architecture & Core Logic

**Goal**: Implement the business logic and event system.

- [ ] **Mock Event Publisher**:
    - Create an `EventPublisher` class/module.
    - Define event types: `TaskCreated`, `TaskStatusChanged`, `TaskVoted`, `CommentAdded`, `ReactionAdded`.
    - Implement a `publish(event)` method that logs to console (mock implementation).
- [ ] **Server Actions / API Routes**:
    - **Projects**: Create, Read, Update, Delete.
    - **Tasks**:
        - Create (default status: Pending Suggestion).
        - Update Status (drag & drop handler).
        - Update Details.
        - List (with pagination/infinite scroll support).
    - **Labels**: Create, Assign to Task.
    - **Votes**: Toggle vote (idempotent per cycle, but description says "accumulate over time" and "vote again after status change").
        - *Logic check*: "Users can vote on a task once per vote cycle... allowed to vote again after a status change." -> We need to track votes per status or reset "hasVoted" flag on status change?
        - *Refinement*: The Vote model might need to track `statusAtTimeOfVote` or we just allow multiple votes per user per task if the status differs.
    - **Comments**: Create linear comments.
    - **Reactions**: Toggle emoji reactions.

## Phase 3: Frontend - Kanban Board & Task Management

**Goal**: Build the interactive board.

- [ ] **Install Dependencies**:
    - `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (for drag and drop).
    - `react-intersection-observer` (for infinite scrolling).
- [ ] **Kanban Board Component**:
    - Create a board layout with columns: `Pending Suggestion`, `Accepted`, `Rejected`, `In Progress`, `Completed`.
    - Implement Drag & Drop context and sensors.
- [ ] **Infinite Loading Columns**:
    - Implement `useInfiniteQuery` for each column to load tasks in chunks.
    - Add intersection observer trigger at the bottom of each column.
- [ ] **Task Card Component**:
    - Display title, vote count, author, labels.
    - Optimistic UI updates for dragging.

## Phase 4: Frontend - Interactions & Details

**Goal**: Enable user engagement (voting, commenting, reacting).

- [ ] **Task Detail View**:
    - Modal or separate page for full task details.
- [ ] **Voting System UI**:
    - Vote button with count.
    - Handle "vote once per status" logic visually.
- [ ] **Comments Section**:
    - List comments chronologically.
    - Simple input form.
- [ ] **Emoji Reactions**:
    - Emoji picker (or simple text input for emojis).
    - Display aggregated reaction counts.
- [ ] **Label Management**:
    - UI for developers to create labels.
    - UI for assigning labels to tasks.

## Phase 5: Authentication & Authorization

**Goal**: Secure the app and enforce roles.

- [ ] **Role Management**:
    - Middleware/Checks to ensure only `DEVELOPER` can move tasks, manage labels, create projects.
    - `USER` can create tasks (pending), vote, comment, react.
- [ ] **User Profile**:
    - Simple profile to see user details (leveraging existing NextAuth).

## Phase 6: Polish & Refinement

- [ ] **Sorting**: Implement sorting controls (Votes vs Date) for columns.
- [ ] **UI/UX**: Polish with Tailwind CSS.
- [ ] **Error Handling**: Toast notifications for errors.
