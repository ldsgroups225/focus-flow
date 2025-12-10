# Next.js Power

Next.js 16 development assistance with App Router patterns, server components, and devtools integration.

## MCP Server

This power uses `next-devtools-mcp` configured in `.mcp.json`:

### Capabilities
- **Error Detection**: Get build errors, runtime errors, type errors from dev server
- **Live State**: Access real-time application state
- **Page Metadata**: Query routes, components, layouts
- **Project Info**: Get project structure and configuration

## App Router Patterns

### Server Components (Default)
```tsx
// app/tasks/page.tsx - Server Component
async function TasksPage() {
  const tasks = await fetchTasks() // Direct async/await
  
  return (
    <div>
      {tasks.map(task => <TaskCard key={task.id} task={task} />)}
    </div>
  )
}
```

### Client Components
```tsx
'use client'

// app/components/task-form.tsx
import { useState } from 'react'

export function TaskForm() {
  const [title, setTitle] = useState('')
  // Hooks, event handlers, browser APIs
}
```

### Server Actions
```tsx
// app/actions/tasks.ts
'use server'

import { revalidatePath } from 'next/cache'

export async function createTask(formData: FormData) {
  const title = formData.get('title')
  await db.tasks.create({ title })
  revalidatePath('/tasks')
}
```

### Layouts & Loading States
```tsx
// app/tasks/layout.tsx
export default function TasksLayout({ children }) {
  return (
    <div className="container">
      <Sidebar />
      <main>{children}</main>
    </div>
  )
}

// app/tasks/loading.tsx
export default function Loading() {
  return <TasksSkeleton />
}

// app/tasks/error.tsx
'use client'
export default function Error({ error, reset }) {
  return <ErrorDisplay error={error} onRetry={reset} />
}
```

### Data Fetching
```tsx
// Fetch with caching
const data = await fetch('https://api.example.com/data', {
  cache: 'force-cache', // Default - cached
  // cache: 'no-store', // Always fresh
  // next: { revalidate: 3600 }, // Revalidate every hour
})

// Parallel fetching
const [tasks, user] = await Promise.all([
  fetchTasks(),
  fetchUser()
])
```

### Route Handlers
```tsx
// app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const tasks = await db.tasks.findMany()
  return NextResponse.json(tasks)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const task = await db.tasks.create(body)
  return NextResponse.json(task, { status: 201 })
}
```

## Project Commands
```bash
bun dev          # Start dev server (port 9002)
bun build        # Production build
bun lint         # ESLint
bun typecheck    # TypeScript check
```

## Resources
- [Next.js Docs](https://nextjs.org/docs)
- [App Router](https://nextjs.org/docs/app)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
