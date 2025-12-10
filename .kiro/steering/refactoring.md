---
inclusion: manual
---

# Refactoring Guidelines

## Before Refactoring
1. Ensure tests exist or add characterization tests
2. Run `bun typecheck` and `bun lint` - fix issues first
3. Commit current state

## Code Smells to Address
- Long functions (>30 lines) → Extract functions
- Duplicate code → DRY with shared utilities
- Deep nesting → Early returns, guard clauses
- Large components → Split into smaller components
- Prop drilling → Context or composition

## Safe Refactoring Steps
1. Make one small change
2. Run typecheck: `bun typecheck`
3. Run lint: `bun lint`
4. Test the change
5. Commit

## Component Refactoring
```tsx
// Before: Large component
function Dashboard() {
  // 200 lines of mixed concerns
}

// After: Composed components
function Dashboard() {
  return (
    <DashboardLayout>
      <TaskList />
      <FocusTimer />
      <Statistics />
    </DashboardLayout>
  )
}
```

## Hook Extraction
```tsx
// Before: Logic in component
function Timer() {
  const [time, setTime] = useState(0)
  useEffect(() => { /* timer logic */ }, [])
  // ...
}

// After: Custom hook
function useTimer(duration: number) {
  const [time, setTime] = useState(duration)
  // timer logic
  return { time, start, pause, reset }
}
```
