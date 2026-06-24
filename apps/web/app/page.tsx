import { redirect } from 'next/navigation';

// Root "/" redirects to /overview (dashboard home).
// Middleware intercepts unauthenticated requests before this runs.
export default function RootPage() {
  redirect('/overview');
}
