import Header from './Header';
import { useSession } from 'next-auth/react';
import CandidateLayout from './CandidateLayout';
import EmployerLayout from './EmployerLayout';

export default function Layout({ children }) {
  const { data: session } = useSession();
  const userRole = session?.user?.role?.toLowerCase();
  const isCandidate = userRole === 'candidate';
  const isEmployer = userRole === 'employer';
  
  // Build user object with profile data if available
  const user = isCandidate ? {
    fullName: session?.user?.name || session?.user?.email?.split('@')[0],
    email: session?.user?.email,
    profilePhotoUrl: session?.user?.image || null,
    ...session?.user
  } : session?.user;

  // Use candidate layout for authenticated candidates
  if (isCandidate) {
    return <CandidateLayout user={user}>{children}</CandidateLayout>;
  }

  // Use employer layout for authenticated employers
  if (isEmployer) {
    return <EmployerLayout>{children}</EmployerLayout>;
  }

  // Use public layout for guests
  return (
    <div>
      <Header />
      <main id="main-content" tabIndex="-1" className="container" style={{ marginTop: 12 }} role="main">
        {children}
      </main>
      <footer style={{ marginTop: 48, padding: 24, textAlign: 'center', color: '#666' }} role="contentinfo">
        <nav aria-label="Footer" style={{ marginBottom: 12 }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <li><a href="/services">Services</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/faq">FAQ</a></li>
            <li><a href="/contact">Contact</a></li>
            <li><a href="/terms">Terms</a></li>
            <li><a href="/privacy">Privacy</a></li>
            <li><a href="/auth/register">Register</a></li>
          </ul>
        </nav>
        <div>© {new Date().getFullYear()} PMO Network — Built for demo</div>
      </footer>
    </div>
  );
}
