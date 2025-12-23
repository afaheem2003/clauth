import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import AuthForm from '../../components/auth/AuthForm';

export default async function SignupPage() {
  const session = await getServerSession(authOptions);
  
  // If user is already authenticated, redirect to home page
  // The home page (app/page.js) will handle further redirects based on waitlist status
  if (session) {
    redirect('/');
  }

  return <AuthForm mode="signup" />;
}
