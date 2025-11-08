import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // APPWRITE_KEY: z.string().min(1),
    GEMINI_API_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_APPWRITE_ENDPOINT: z.url(),
    NEXT_PUBLIC_APPWRITE_DEV_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_APPWRITE_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_APPWRITE_DATABASE_ID: z.string().min(1),
  },
  runtimeEnv: {
    // APPWRITE_KEY: process.env.APPWRITE_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    NEXT_PUBLIC_APPWRITE_DEV_KEY: process.env.NEXT_PUBLIC_APPWRITE_DEV_KEY,
    NEXT_PUBLIC_APPWRITE_ENDPOINT: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    NEXT_PUBLIC_APPWRITE_PROJECT_ID: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    NEXT_PUBLIC_APPWRITE_DATABASE_ID: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
  },
});
