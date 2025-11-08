import { Client, Account, TablesDB, } from 'appwrite';
import { env } from '@/env';

const client = new Client()
  .setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setDevKey(env.NEXT_PUBLIC_APPWRITE_DEV_KEY ?? '')

if (env.NEXT_PUBLIC_APPWRITE_DEV_KEY) {
  client.setDevKey(env.NEXT_PUBLIC_APPWRITE_DEV_KEY)
}

const account = new Account(client);
const databases = new TablesDB(client);

const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const TASKS_TABLE_ID = 'tasks';

export { client, account, databases, DATABASE_ID, TASKS_TABLE_ID };
