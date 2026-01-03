# User Roles & Permissions

This document defines the roles and permissions for WorkNest projects.

## Roles Overview

### 1. Admin
Project creator and managers.
- **Can**: 
  - Manage project settings (title, description).
  - Invite/Remove members.
  - Change member roles.
  - Create/Edit/Delete tasks and columns.
  - Delete comments.
  - Delete the project.
- **Unique**: The project creator is automatically an Admin.

### 2. Member
Standard contributors.
- **Can**:
  - View project.
  - Create/Edit tasks (`To Do` -> `In Progress`).
  - Add comments/attachments to tasks.
  - Invite other members (recently enabled).
- **Cannot**:
  - Delete tasks (unless they created them - *optional config*).
  - Manage project settings.
  - Manage members (change roles/remove).

### 4. Viewer
Read-only access.
- **Can**:
  - View project board, tasks, and details.
  - View comments and attachments.
- **Cannot**:
  - **Create** tasks.
  - **Edit** tasks (move columns, change assignee).
  - **Delete** tasks.
  - Add comments (optional, usually Viewers can comment in some apps, but strictly "Viewer" implies Read-Only).
  - Invite members.
  - Change settings.

## Permission Implementation Checklist

### Backend
- [ ] **Invitation**: Ensure `role` passed in invite is correctly saved to `Project.members` on acceptance.
- [ ] **Middleware**: `checkPermission` middleware should enforce:
  - `POST /api/tasks`: Member+
  - `PUT /api/tasks/:id`: Member+
  - `DELETE /api/tasks/:id`: Admin+ (or task creator)
  - `PUT /api/projects/:id`: Admin+

### Frontend
- [ ] **UI Hiding**:
  - Hide "Create Task" button for Viewers.
  - Disable Drag & Drop for Viewers.
  - Hide "Edit/Delete" buttons on Task Card/Modal for Viewers.
  - Display correct role label in Member list.
