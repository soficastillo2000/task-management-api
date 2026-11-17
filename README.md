# Task Management API

A RESTful task management API built with NestJS, TypeScript, PostgreSQL, and TypeORM.

This project demonstrates backend development, relational database integration, input validation, API documentation, and automated unit testing.

## Tech Stack

- Node.js
- TypeScript
- NestJS
- PostgreSQL
- TypeORM
- Swagger / OpenAPI
- Vitest

## Features

- Create tasks
- List all tasks
- Retrieve a task by ID
- Update task titles and completion status
- Delete tasks
- Persist data in PostgreSQL
- Validate incoming requests
- Document endpoints with Swagger
- Test business logic with Vitest

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /tasks | List all tasks |
| GET | /tasks/:id | Get a task |
| POST | /tasks | Create a task |
| PATCH | /tasks/:id | Update a task |
| DELETE | /tasks/:id | Delete a task |

### Example: Create a Task

Request:

```http
POST /tasks
Content-Type: application/json

{
  "title": "Build a REST API"
}
```

Example response:

```json
{
  "id": 1,
  "title": "Build a REST API",
  "completed": false
}
```

## Getting Started

### Prerequisites

- Node.js
- npm
- PostgreSQL

### Installation

```bash
cd backend
npm install
cp .env.example .env
```

Create a PostgreSQL database named `task_management`.

Edit `.env` with your PostgreSQL credentials.

### Run the Application

```bash
npm run start:dev
```

API: http://localhost:3000/tasks

Swagger documentation: http://localhost:3000/api

### Run Tests

```bash
npx vitest run src/tasks/tasks.service.spec.ts
```

### Build

```bash
npm run build
```

## Project Structure

```text
backend/
  src/
    tasks/
      dto/
      task.entity.ts
      tasks.controller.ts
      tasks.service.ts
      tasks.service.spec.ts
      tasks.module.ts
    app.module.ts
    main.ts
```

## Development Notes

- Database configuration is managed through environment variables.
- The `.env` file should not be committed.
- The current database schema uses TypeORM automatic synchronization for local development. Production deployments should use database migrations.
- This project is intended as a backend portfolio demonstration.

## Author

Sofía Castillo
