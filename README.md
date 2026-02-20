# Application Description

This application is a Kanban-based project management system focused on feature suggestions and community-driven prioritization.

## Developer Role

Developers can:

- Create projects
- Create tasks
- Manage task statuses
- Drag and drop tasks across the Kanban board
- Create and manage labels
- Assign labels to tasks

### Task Status Workflow

Each task can move through the following statuses:

1. **Pending Suggestion** – A task suggested by a user and waiting for review.
2. **Accepted** – The project owner/developer has approved the suggestion.
3. **Rejected** – The suggestion has been declined.
4. **In Progress** – The developer is actively working on the task.
5. **Completed** – The task has been finished.

Status changes are handled via drag-and-drop on the Kanban board.

### Infinite Loading

Infinite loading is implemented **per column**, meaning each status column loads tasks independently as the user scrolls.

### Sorting

Tasks within each column can be sorted by:

- Number of votes (descending)
- Creation date

---

## User Role

Users can:

- Create tasks (which start in **Pending Suggestion**)
- Assign existing labels when creating a task
- Vote on tasks in the **Accepted** status
- Continue voting even if the task changes status (previous votes are preserved)
- Comment on tasks (linear comment system, no nested replies)
- React to tasks using emojis

### Voting System

- Users can vote on a task once per vote cycle.
- When a task changes status, **existing votes are preserved**.
- Users are allowed to vote again after a status change.
- Votes accumulate over time and are never deleted.

This allows tasks to gather long-term prioritization data.

---

## Labels

- Developers can create and manage labels.
- Developers can assign labels to tasks.
- Users can select from existing labels when creating a task.
- Labels help categorize tasks (e.g., Feature, Bug, UI, Backend, Improvement).

---

## Comments

- Comments are linear (non-threaded).
- All comments are displayed in chronological order.
- No nested replies.
- Designed to remain simple and scalable.

---

## Emoji Reactions

- Users can react to tasks with any emoji.
- Emoji usage is not restricted to predefined options.
- The system:
   - Displays reaction counts per emoji
   - Allows users to toggle reactions on/off
   - Aggregates identical emojis

---

## Architecture & Extensibility

Although the system does not currently support teams, it is architected in a way that allows future expansion to:

- Multi-user roles
- Team-based permissions
- Multi-tenant workspaces

The codebase is designed with extensibility in mind.

---

## Event Publishing System (Mock Implementation)

The system includes a mock event publishing mechanism to support future scalability and integrations.

Examples of potential events:

- TaskCreated
- TaskStatusChanged
- TaskVoted
- CommentAdded
- ReactionAdded

Currently:

- The event publisher does not trigger any external actions.
- It acts as a placeholder (mock implementation).
- It exists to enable future features such as:
   - Notifications
   - Analytics
   - Integrations
   - Real-time updates
   - External service hooks

This ensures the architecture is event-driven and ready for expansion without refactoring core logic later.

---

# System Philosophy

This is not just a task management tool.

It is designed as a:

- Community-driven prioritization platform
- Feature suggestion engine
- Transparent development roadmap system
- Extensible event-based architecture

The goal is to keep the system simple today while ensuring it is structurally ready for future growth. 🚀
