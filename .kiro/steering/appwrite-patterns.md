---
inclusion: fileMatch
fileMatchPattern: "**/appwrite*.{ts,tsx}"
---

# Appwrite Integration Patterns

## Client Setup
```typescript
import { Client, Account, Databases } from 'appwrite'

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

export const account = new Account(client)
export const databases = new Databases(client)
```

## Query Patterns
```typescript
import { Query } from 'appwrite'

// Common queries
Query.equal('field', 'value')
Query.notEqual('field', 'value')
Query.greaterThan('field', value)
Query.lessThan('field', value)
Query.search('field', 'keyword')
Query.orderAsc('field')
Query.orderDesc('field')
Query.limit(25)
Query.offset(0)
```

## Error Handling
```typescript
import { AppwriteException } from 'appwrite'

try {
  await databases.createDocument(...)
} catch (error) {
  if (error instanceof AppwriteException) {
    console.error(error.message, error.code)
  }
}
```

## MCP Available
- `appwrite-api` - Direct API operations
- `appwrite-docs` - Documentation lookup
