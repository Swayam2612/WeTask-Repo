# WeTask – Full Stack Team Task Manager

## Overview

WeTask is a full-stack collaborative team and project management web application built using Node.js, Express, Vanilla JavaScript, and SQLite (via sql.js). The application allows teams to manage projects, tasks, members, dashboards, and authentication through a clean browser-based interface.

The system includes:

* JWT-based authentication
* Role-based access control
* Team management
* Project management
* Task tracking and assignment
* Dashboard analytics
* Activity tracking
* Notifications and status handling
* Responsive frontend UI

This project is designed as a lightweight alternative to platforms like Trello, Asana, or ClickUp while remaining simple to run locally without requiring a separate database installation.

---

# Tech Stack

## Backend

* Node.js
* Express.js
* SQL.js (SQLite running inside Node)
* JWT Authentication
* bcryptjs for password hashing
* UUID for unique IDs
* Helmet for security headers
* CORS support
* Compression middleware
* Express Rate Limiter

## Frontend

* HTML5
* CSS3
* Vanilla JavaScript

## Database

* SQLite database using sql.js
* Auto-initialized locally

---

# Core Features

## 1. Authentication System

The platform includes a secure JWT-based authentication system.

### Features

* User registration
* User login
* Password hashing using bcrypt
* Protected API routes
* Token-based session handling
* Role-based permissions
* Persistent login using localStorage

### Default Role Logic

* The very first registered user automatically becomes an `admin`
* All later users are assigned the `member` role

### Authentication Routes

| Method | Route                | Description         |
| ------ | -------------------- | ------------------- |
| POST   | `/api/auth/register` | Register new user   |
| POST   | `/api/auth/login`    | Login existing user |
| GET    | `/api/auth/me`       | Get logged-in user  |
| PUT    | `/api/auth/profile`  | Update user profile |

---

# 2. Team Management

Users can create and manage teams.

## Features

* Create teams
* Edit teams
* Delete teams
* Add members to teams
* Team member roles
* Team color customization
* Team statistics

## Team Data Includes

* Team name
* Description
* Color theme
* Members
* Creator
* Project count

## Team Routes

| Method | Route            |
| ------ | ---------------- |
| GET    | `/api/teams`     |
| POST   | `/api/teams`     |
| GET    | `/api/teams/:id` |
| PUT    | `/api/teams/:id` |
| DELETE | `/api/teams/:id` |

---

# 3. Project Management

Projects are linked to teams and can contain multiple tasks.

## Features

* Create projects
* Assign projects to teams
* Add project members
* Track progress percentage
* Set project priorities
* Add due dates
* Add custom project colors
* View project analytics

## Project Status Types

* active
* completed
* archived

## Priority Levels

* low
* medium
* high

## Project Routes

| Method | Route               |
| ------ | ------------------- |
| GET    | `/api/projects`     |
| POST   | `/api/projects`     |
| GET    | `/api/projects/:id` |
| PUT    | `/api/projects/:id` |
| DELETE | `/api/projects/:id` |

---

# 4. Task Management

Tasks are the main operational component of the platform.

## Features

* Create tasks
* Assign tasks to users
* Task priorities
* Task statuses
* Due dates
* Estimated hours
* Tags support
* Task ordering
* Task comments
* Task filtering
* Search tasks

## Task Status Workflow

* todo
* in_progress
* in_review
* completed
* cancelled

## Task Filtering

The API supports:

* Status filtering
* Priority filtering
* Project filtering
* Assigned user filtering
* Search by title

## Task Routes

| Method | Route            |
| ------ | ---------------- |
| GET    | `/api/tasks`     |
| POST   | `/api/tasks`     |
| GET    | `/api/tasks/:id` |
| PUT    | `/api/tasks/:id` |
| DELETE | `/api/tasks/:id` |

---

# 5. Dashboard Analytics

The dashboard provides real-time analytics.

## Dashboard Metrics

* Total projects
* Total teams
* Total users
* Task statistics
* Completed tasks
* In-progress tasks
* Overdue tasks
* Priority breakdown
* Upcoming tasks
* Recent activity logs

## Dashboard Route

| Method | Route                  |
| ------ | ---------------------- |
| GET    | `/api/dashboard/stats` |

---

# Database Architecture

The application automatically initializes the SQLite database on startup.

## Main Tables

### Users

Stores:

* User profile data
* Login credentials
* Roles
* Avatar colors
* Bio
* Last login

### Teams

Stores:

* Team details
* Team colors
* Creator information

### Team Members

Stores:

* Team membership
* Member roles
* Join timestamps

### Projects

Stores:

* Project metadata
* Priority
* Status
* Team relation
* Due dates

### Project Members

Stores:

* Project access control
* Member roles

### Tasks

Stores:

* Task details
* Assignments
* Due dates
* Tags
* Progress states

### Comments

Stores:

* Task comments
* Comment authors

### Activity Logs

Stores:

* User activity history
* Dashboard activity feed

---

# Security Features

## Implemented Security

* Password hashing using bcryptjs
* JWT authentication
* Protected routes middleware
* Helmet security headers
* CORS handling
* Request rate limiting
* Input validation

## Middleware Used

| Middleware   | Purpose               |
| ------------ | --------------------- |
| Helmet       | Security headers      |
| Compression  | Response compression  |
| CORS         | Cross-origin requests |
| Rate Limiter | API abuse prevention  |
| JWT Auth     | Protected endpoints   |

---

# Frontend Architecture

## Frontend Structure

### Main Files

| File                   | Purpose                    |
| ---------------------- | -------------------------- |
| `public/index.html`    | Main application UI        |
| `public/css/style.css` | Application styling        |
| `public/js/app.js`     | API handling and utilities |
| `public/js/pages.js`   | Page rendering logic       |

## UI Components

* Sidebar navigation
* Dashboard cards
* Task boards
* Modal system
* Toast notifications
* Team panels
* Project cards
* Task cards
* Analytics widgets

## Utility Systems

The frontend includes:

* Toast notification engine
* Modal management system
* API wrapper helper
* Local state manager
* Date formatting utilities
* Avatar generation utilities

---

# API Architecture

## API Base URL

```bash
/api
```

## Route Groups

| Route Group      | Description         |
| ---------------- | ------------------- |
| `/api/auth`      | Authentication      |
| `/api/users`     | User management     |
| `/api/teams`     | Team management     |
| `/api/projects`  | Project management  |
| `/api/tasks`     | Task management     |
| `/api/dashboard` | Analytics and stats |

---

# Installation Guide

## 1. Clone Repository

```bash
git clone https://github.com/your-username/WeTask-Repo.git
```

## 2. Enter Project Directory

```bash
cd WeTask-Repo
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Start Application

```bash
npm start
```

Server will run on:

```bash
http://localhost:3000
```

---

# Development Setup

## Run in Development Mode

```bash
npm run dev
```

---

# Environment Variables

Optional `.env` configuration:

```env
PORT=3000
JWT_SECRET=your_secret_key
```

If no JWT secret is provided, the app uses a default fallback secret.

---

# Folder Structure

```bash
team-task-manager/
│
├── middleware/
│   └── auth.js
│
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── app.js
│   │   └── pages.js
│   └── index.html
│
├── routes/
│   ├── auth.js
│   ├── dashboard.js
│   ├── projects.js
│   ├── tasks.js
│   ├── teams.js
│   └── users.js
│
├── database.js
├── server.js
├── package.json
└── package-lock.json
```

---

# Role-Based Access Control

## Admin Permissions

Admins can:

* View all projects
* View all teams
* View all users
* Access global dashboard stats
* Manage all resources

## Member Permissions

Members can:

* Access assigned projects
* Access joined teams
* Manage assigned tasks
* View personal dashboard data

---

# Dashboard Logic

The dashboard dynamically changes depending on the logged-in user role.

## Admin Dashboard

Shows:

* System-wide statistics
* Total users
* Global activity logs
* All projects and tasks

## Member Dashboard

Shows:

* Personal tasks
* Assigned projects
* Upcoming deadlines
* Individual statistics

---

# Performance Optimizations

The project includes:

* Response compression
* Lightweight SQLite database
* Modular route structure
* Efficient SQL queries
* Reusable frontend utilities
* Minimal frontend framework overhead

---

# Future Improvements

Possible future upgrades:

* Real-time notifications using Socket.io
* File uploads
* Drag-and-drop Kanban board
* Email notifications
* Dark mode
* Calendar integration
* Mobile app version
* Activity audit exports
* Team chat system
* Task attachments
* OAuth login support

---

# Example Use Case Workflow

## Example Scenario

1. Admin registers first account
2. Admin creates a team
3. Admin creates a project inside the team
4. Admin adds members
5. Tasks are assigned to members
6. Members update task statuses
7. Dashboard analytics update automatically

---

# Deployment

This application can be deployed easily on:

* Railway
* Render
* Vercel (frontend only)
* Cyclic
* Heroku
* VPS servers

## Recommended Production Setup

* Use PostgreSQL or MySQL instead of local SQLite
* Store JWT secret securely
* Enable HTTPS
* Add reverse proxy like Nginx
* Configure production logging

---

# Troubleshooting

## Common Issues

### Port Already in Use

```bash
Error: EADDRINUSE
```

Solution:

```bash
Change PORT value or stop existing process
```

### JWT Errors

```bash
Invalid token
```

Solution:

```bash
Clear localStorage and login again
```

### Database Initialization Issues

```bash
Database failed to initialize
```

Solution:

```bash
Delete corrupted database file and restart server
```

---

# Author

Developed as a full-stack collaborative task management platform using Node.js and Vanilla JavaScript.

---

# License

This project is open-source and available for educational and personal development use.
