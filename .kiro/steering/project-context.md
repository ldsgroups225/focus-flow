# FocusFlow Project Context

## Overview
FocusFlow is a task management app with focus mode, built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4.

## Tech Stack
- **Framework**: Next.js 16 with App Router
- **UI**: React 19, Radix UI primitives, Tailwind CSS 4, Framer Motion
- **State**: React Hook Form, Zod validation
- **AI**: Genkit with Google GenAI
- **Backend**: Appwrite
- **Package Manager**: Bun

## Project Structure
- `src/app/` - Next.js app router pages and layouts
- `src/components/` - Reusable UI components
- `src/hooks/` - Custom React hooks
- `src/contexts/` - React context providers
- `src/lib/` - Utility functions
- `src/ai/` - Genkit AI flows
- `src/env/` - Environment configuration

## Commands
- `bun dev` - Start dev server on port 9002
- `bun build` - Production build
- `bun lint` - ESLint
- `bun typecheck` - TypeScript check

## Code Standards
- TypeScript strict mode
- Functional components with hooks
- Radix UI for accessible primitives
- Tailwind for styling (no CSS modules)
- Zod for runtime validation

## Task Management
All work is tracked in `kanban.md` following the format in `AI_WORKFLOW.md`.
