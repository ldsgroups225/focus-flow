---
inclusion: manual
---

# QA & Testing Guide

## Testing Strategy
- Unit tests for utilities and hooks
- Component tests for UI behavior
- Integration tests for user flows

## Test Structure
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {})
  it('should handle user interaction', () => {})
  it('should display error state', () => {})
})
```

## What to Test
- User interactions (clicks, inputs)
- Conditional rendering
- Error states
- Loading states
- Edge cases (empty data, long text)

## Accessibility Testing
- Keyboard navigation works
- Screen reader announces correctly
- Focus management is proper
- Color contrast is sufficient

## Manual QA Checklist
- [ ] Feature works as expected
- [ ] No console errors
- [ ] Responsive on mobile/tablet/desktop
- [ ] Works in dark/light mode
- [ ] Accessible via keyboard
- [ ] Error states handled gracefully
- [ ] Loading states shown appropriately

## Performance Checks
- [ ] No unnecessary re-renders
- [ ] Images optimized
- [ ] Bundle size reasonable
- [ ] No memory leaks
