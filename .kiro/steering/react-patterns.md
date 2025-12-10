---
inclusion: fileMatch
fileMatchPattern: "**/*.tsx"
---

# React Development Patterns

## Component Structure
```tsx
// Prefer named exports
export function ComponentName({ prop }: Props) {
  // Hooks at top
  const [state, setState] = useState()
  
  // Derived state with useMemo
  const computed = useMemo(() => ..., [deps])
  
  // Event handlers with useCallback for child props
  const handleClick = useCallback(() => ..., [deps])
  
  // Early returns for loading/error states
  if (loading) return <Skeleton />
  
  return <div>...</div>
}
```

## State Management
- Local state: `useState` for simple, `useReducer` for complex
- Shared state: React Context with custom hooks
- Server state: Consider React Query patterns
- Form state: React Hook Form + Zod

## Performance
- Use `React.memo` for expensive pure components
- Wrap callbacks in `useCallback` when passed to memoized children
- Use `useMemo` for expensive computations
- Lazy load routes and heavy components

## Accessibility
- Use Radix UI primitives (Dialog, Dropdown, etc.)
- Include proper ARIA labels
- Ensure keyboard navigation
- Test with screen readers

## Error Handling
- Wrap routes in Error Boundaries
- Use Suspense for async components
- Provide meaningful error messages
