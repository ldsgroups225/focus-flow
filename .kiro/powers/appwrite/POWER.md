# Appwrite Power

Backend-as-a-Service integration for FocusFlow with auth, database, and realtime capabilities.

## MCP Servers

This power uses two MCP servers already configured in `.mcp.json`:

### appwrite-api
Direct API access to your Appwrite project for:
- User management (create, list, delete users)
- Database operations (CRUD on collections/documents)
- Storage management
- Function execution

### appwrite-docs
Documentation lookup for:
- SDK references
- API endpoints
- Best practices
- Code examples

## Common Operations

### Authentication
```typescript
// Client-side auth with Appwrite SDK
import { Client, Account } from 'appwrite'

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('690e581300093ebd7b6a')

const account = new Account(client)

// Login
await account.createEmailPasswordSession(email, password)

// Get current user
const user = await account.get()

// Logout
await account.deleteSession('current')
```

### Database Queries
```typescript
import { Databases, Query } from 'appwrite'

const databases = new Databases(client)

// List documents with filters
const tasks = await databases.listDocuments(
  'DATABASE_ID',
  'COLLECTION_ID',
  [
    Query.equal('status', 'active'),
    Query.orderDesc('$createdAt'),
    Query.limit(25)
  ]
)

// Create document
await databases.createDocument(
  'DATABASE_ID',
  'COLLECTION_ID',
  ID.unique(),
  { title: 'New Task', priority: 'high' }
)
```

### Realtime Subscriptions
```typescript
import { Client } from 'appwrite'

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('690e581300093ebd7b6a')

// Subscribe to document changes
const unsubscribe = client.subscribe(
  'databases.DATABASE_ID.collections.COLLECTION_ID.documents',
  (response) => {
    console.log('Document changed:', response.payload)
  }
)
```

## Environment Variables
```env
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=690e581300093ebd7b6a
APPWRITE_API_KEY=your_api_key
```

## Resources
- [Appwrite Docs](https://appwrite.io/docs)
- [Web SDK Reference](https://appwrite.io/docs/sdks#client)
- [Server SDK Reference](https://appwrite.io/docs/sdks#server)
