import { account } from './config';
import { OAuthProvider, ID } from 'appwrite';

export interface AppwriteUser {
  $id: string;
  email: string;
  name?: string;
  prefs: {
    avatar?: string;
    [key: string]: unknown;
  };
}

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  metadata: Record<string, unknown>;
  providerData: unknown[];
  refreshToken: string;
  tenantId: string | null;
  phoneNumber: string | null;
  providerId: string;
  delete: () => Promise<void>;
  getIdToken: () => Promise<string>;
  getIdTokenResult: () => Promise<unknown>;
  reload: () => Promise<void>;
  toJSON: () => Record<string, unknown>;
}

export const signInWithGoogle = async () => {
  try {
    // Get the current origin for redirect URLs
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    account.createOAuth2Session({
      provider: OAuthProvider.Google,
      success: `${origin}/auth/callback`,
      failure: `${origin}/?error=auth_failed`,
    });
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const session = await account.createEmailPasswordSession({
      email,
      password,
    });
    return session;
  } catch (error) {
    console.error('Email sign in error:', error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string, name?: string) => {
  try {
    const user = await account.create({
      userId: ID.unique(),
      email,
      password,
      name,
    });

    if (user) {
      await account.createEmailPasswordSession({
        email,
        password,
      });
    }

    return user;
  } catch (error) {
    console.error('Email sign up error:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await account.deleteSession('current');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Email OTP (passwordless) helpers
export interface EmailTokenResponse {
  userId: string;
  expire: string;
  phrase?: string;
}

export const requestEmailOtp = async (
  email: string,
  options?: { phrase?: boolean }
): Promise<EmailTokenResponse> => {
  try {
    const token = await account.createEmailToken({
      userId: ID.unique(),
      email,
      phrase: options?.phrase ?? false,
    });
    const withPhrase = token as unknown as { phrase?: string };
    return {
      userId: token.userId,
      expire: token.expire,
      ...(typeof withPhrase.phrase !== 'undefined' ? { phrase: withPhrase.phrase } : {}),
    };
  } catch (error) {
    console.error('Email OTP request error:', error);
    throw error;
  }
};

export const verifyEmailOtp = async (userId: string, secret: string) => {
  try {
    const session = await account.createSession({ userId, secret });
    return session;
  } catch (error) {
    console.error('Email OTP verify error:', error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<AppwriteUser | null> => {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    // Silently return null for unauthenticated/guest errors
    const err = error as unknown as { message?: string; code?: number; response?: { status?: number } };
    const status = err?.code ?? err?.response?.status;
    const message = err?.message ?? '';

    // Don't log 401 errors - these are expected for guest users
    if (status === 401 || message.includes('role: guests') || message.includes('missing scopes')) {
      return null;
    }

    // Only log unexpected errors
    console.error('Get current user error:', error);
    return null;
  }
};

export const convertAppwriteUserToFirebaseUser = (appwriteUser: AppwriteUser | null): User | null => {
  if (!appwriteUser) return null;

  return {
    uid: appwriteUser.$id,
    email: appwriteUser.email,
    displayName: appwriteUser.name || null,
    photoURL: appwriteUser.prefs?.avatar || null,
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    phoneNumber: null,
    providerId: 'appwrite',
    delete: async () => { throw new Error('Not implemented'); },
    getIdToken: async () => { throw new Error('Not implemented'); },
    getIdTokenResult: async () => { throw new Error('Not implemented'); },
    reload: async () => { throw new Error('Not implemented'); },
    toJSON: () => ({ uid: appwriteUser.$id, email: appwriteUser.email }),
  };
};
