import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/appwrite/auth-services';

export default async function Home() {
  // Check if user is authenticated
  const user = await getCurrentUser();

  if (!user) {
    // Redirect to login if not authenticated
    redirect('/login');
  }

  // Redirect to dashboard if authenticated
  redirect('/dashboard');
}
