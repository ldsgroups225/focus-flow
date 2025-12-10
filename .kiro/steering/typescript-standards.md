---
inclusion: fileMatch
fileMatchPattern: "**/*.{ts,tsx}"
---

# TypeScript Standards

## Type Definitions
```typescript
// Prefer interfaces for objects
interface User {
  id: string
  name: string
  email: string
}

// Use type for unions, intersections, utilities
type Status = 'idle' | 'loading' | 'success' | 'error'
type UserWithRole = User & { role: Role }

// Props interfaces
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
}
```

## Best Practices
- No `any` - use `unknown` and narrow with type guards
- Prefer `const` assertions for literal types
- Use discriminated unions for state machines
- Export types alongside components

## Zod Integration
```typescript
import { z } from 'zod'

const TaskSchema = z.object({
  title: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.date().optional(),
})

type Task = z.infer<typeof TaskSchema>
```

## Utility Types
- `Partial<T>` - all properties optional
- `Required<T>` - all properties required
- `Pick<T, K>` - subset of properties
- `Omit<T, K>` - exclude properties
- `Record<K, V>` - object with key type K and value type V
