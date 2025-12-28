import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to login page (or dashboard if authenticated - handled in middleware)
  redirect('/login');
}
