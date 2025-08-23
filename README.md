# Fullstack TypeScript Monorepo

A monorepo structure for fullstack development with TypeScript, featuring:

- **Backend**: Express.js with InversifyJS for dependency injection
- **Frontend**: React with Vite for fast development

## Project Structure

```
├── packages/
│   ├── backend/          # Express.js + InversifyJS API
│   │   ├── src/
│   │   │   ├── controllers/    # Request handlers
│   │   │   ├── services/       # Business logic
│   │   │   ├── types.ts        # DI container types
│   │   │   └── index.ts        # Server entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/         # React + Vite application
│       ├── src/
│       │   ├── components/     # React components
│       │   ├── pages/          # Page components
│       │   ├── test/           # Test files
│       │   ├── App.tsx         # Main app component
│       │   └── main.tsx        # App entry point
│       ├── package.json
│       └── vite.config.ts
├── package.json          # Root package.json with workspace configuration
├── tsconfig.json         # Shared TypeScript configuration
├── .eslintrc.json       # Shared ESLint configuration
└── shortcut.code-workspace # VS Code workspace configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

1. **Clone and setup:**

```bash
git clone <your-repo-url>
cd shortcut
```

2. **Install dependencies:**

```bash
npm install --legacy-peer-deps
```

3. **Set up environment variables:**

```bash
# Backend
cp packages/backend/.env.example packages/backend/.env

# Frontend
cp packages/frontend/.env.example packages/frontend/.env
```

4. **Start development servers:**

```bash
npm run dev
```

This will start both the backend server and frontend development server concurrently.

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173`
- API Health Check: `http://localhost:3001/health`

## Available Scripts

### Root Level

- `npm run dev` - Start both backend and frontend in development mode
- `npm run dev:backend` - Start only the backend server
- `npm run dev:frontend` - Start only the frontend server
- `npm run build` - Build both applications
- `npm run lint` - Lint all packages
- `npm run test` - Run tests for all packages
- `npm run clean` - Clean all node_modules and build outputs

### Backend Scripts

```bash
cd packages/backend
npm run dev        # Start development server with nodemon
npm run build      # Compile TypeScript
npm run start      # Start production server
npm run lint       # ESLint check
npm run test       # Run Jest tests
```

### Frontend Scripts

```bash
cd packages/frontend
npm run dev        # Start Vite development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # ESLint check
npm run test       # Run Vitest tests
```

## Architecture Overview

### Backend (Express.js + InversifyJS)

- **Dependency Injection**: Uses InversifyJS for clean dependency management
- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic
- **Type Safety**: Full TypeScript integration
- **API Structure**: RESTful API design

Key files:

- `src/index.ts` - Server setup and DI container configuration
- `src/types.ts` - DI container type definitions
- `src/controllers/` - Request handlers
- `src/services/` - Business logic services

### Frontend (React + Vite)

- **Modern React**: React 18 with functional components and hooks
- **Fast Development**: Vite for instant hot reload
- **Type Safety**: Full TypeScript integration
- **Routing**: React Router for client-side navigation
- **API Integration**: Axios for HTTP requests with proxy setup

Key files:

- `src/main.tsx` - React app entry point
- `src/App.tsx` - Main application component with routing
- `src/pages/` - Page components
- `src/components/` - Reusable UI components

### Development Features

- **Hot Reload**: Both backend (nodemon) and frontend (Vite) support hot reload
- **API Proxy**: Frontend proxies `/api` requests to backend during development
- **Shared Configuration**: Common TypeScript and ESLint configuration
- **Testing Setup**: Jest for backend, Vitest for frontend
- **Type Safety**: End-to-end TypeScript coverage

## API Endpoints

### Health Check

- `GET /health` - Server health status

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
  - Body: `{ name: string, email: string }`

## Development Workflow

1. **Start development servers**: `npm run dev`
2. **Make changes** to backend or frontend code
3. **Changes auto-reload** thanks to nodemon and Vite
4. **Test your changes** using the browser and API endpoints
5. **Run tests**: `npm run test`
6. **Lint code**: `npm run lint`

## Deployment

### Backend

```bash
cd packages/backend
npm run build
npm start
```

### Frontend

```bash
cd packages/frontend
npm run build
# Deploy the dist/ folder to your hosting service
```

## VS Code Setup

This project includes a VS Code workspace configuration (`shortcut.code-workspace`). Open the workspace file in VS Code for the best development experience with:

- Proper folder structure
- Recommended extensions
- Configured settings for TypeScript and ESLint

## Interview Preparation Tips

This monorepo demonstrates knowledge of:

- **TypeScript**: Full-stack type safety
- **Modern React**: Hooks, functional components, routing
- **Express.js**: RESTful API design
- **Dependency Injection**: InversifyJS pattern
- **Build Tools**: Vite for frontend, TypeScript compiler for backend
- **Testing**: Jest and Vitest setup
- **Monorepo Architecture**: Workspace management
- **Development Workflow**: Hot reload, proxying, concurrent development

Good luck with your fullstack interview! 🚀
