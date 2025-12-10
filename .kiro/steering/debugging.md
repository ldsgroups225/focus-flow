---
inclusion: manual
---

# Debugging Guide

## Systematic Approach
1. **Reproduce** - Get consistent reproduction steps
2. **Isolate** - Narrow down to smallest failing case
3. **Hypothesize** - Form theories about root cause
4. **Test** - Validate or eliminate hypotheses
5. **Fix** - Implement and verify solution

## Common Issues

### React
- Infinite re-renders: Check useEffect dependencies
- Stale closures: Missing deps in useCallback/useMemo
- Hydration mismatch: Server/client rendering differences

### Next.js
- Build errors: Check `bun typecheck` and `bun lint`
- API routes: Check request/response types
- Server components: Can't use hooks or browser APIs

### TypeScript
- Type errors: Use `getDiagnostics` tool
- Module resolution: Check tsconfig paths

## Debug Commands
```bash
# Type check
bun typecheck

# Lint with details
bun lint

# Check for unused exports
bunx knip
```

## Logging
```typescript
// Development only logging
if (process.env.NODE_ENV === 'development') {
  console.log('[Debug]', data)
}
```
