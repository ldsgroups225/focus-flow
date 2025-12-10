---
inclusion: fileMatch
fileMatchPattern: "src/app/**/*.{ts,tsx}"
---

# Next.js App Router Patterns

## File Conventions
- `page.tsx` - Route UI
- `layout.tsx` - Shared layout (wraps children)
- `loading.tsx` - Loading UI (Suspense boundary)
- `error.tsx` - Error UI (Error boundary) - must be 'use client'
- `not-found.tsx` - 404 UI
- `route.ts` - API endpoint

## Server vs Client Components

**Server Components (default)**:
- Can use async/await directly
- Can access backend resources
- Cannot use hooks, event handlers, browser APIs

**Client Components** (`'use client'`):
- Can use hooks (useState, useEffect, etc.)
- Can handle events
- Can access browser APIs

## Data Patterns
```tsx
// Server Component - direct fetch
async function Page() {
  const data = await fetch('/api/data')
  return <div>{data}</div>
}

// Server Action
'use server'
export async function submitForm(formData: FormData) {
  // Runs on server
  revalidatePath('/path')
}
```

## MCP Available
The `next-devtools-mcp` server provides:
- Error detection from dev server
- Project metadata
- Route information
