import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';

const SUPPORT_ROLES = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_MANAGER', 'SUPPORT_AGENT'];

function getDashboardHref(role) {
  const normalizedRole = (role || '').toUpperCase();

  if (SUPPORT_ROLES.includes(normalizedRole)) {
    return '/dashboard/admin';
  }

  if (normalizedRole === 'EMPLOYER') {
    return '/dashboard/employer';
  }

  return '/dashboard/candidate';
}

export default function Header() {
  const router = useRouter();
  const path = router?.pathname || '/';
  const isHome = path === '/';
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);

  const toggleMenu = () => setMenuOpen(o => !o);

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [router.pathname]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && navRef.current && !navRef.current.contains(event.target) && !event.target.closest('.mobile-nav-toggle')) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <header className="site-header container" role="banner">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="site-brand">
        <Link href="/" aria-label="PMO Network home">
          <img src="/logo.svg" alt="PMO Network" width={40} height={40} style={{ objectFit: 'contain', marginRight: 8 }} />
        </Link>
        {isHome ? <h1 className="site-title">PMO Network</h1> : <p className="site-title" aria-label="PMO Network">PMO Network</p>}
      </div>

      <div className="header-actions">
        {isHome ? (
          status === 'authenticated' ? (
            <Link href={getDashboardHref(session.user.role)} className="header-sign-in-btn">Dashboard</Link>
          ) : (
            <Link href="/auth/login" className="header-sign-in-btn">Sign In</Link>
          )
        ) : (
          status === 'authenticated' ? (
            <button
              className="mobile-nav-toggle"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              aria-controls="primary-nav"
              onClick={toggleMenu}
            >
              <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
            </button>
          ) : (
            <>
              <Link href="/auth/login" className="header-sign-in-btn">Sign In</Link>
              <button
                className="mobile-nav-toggle"
                aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={menuOpen}
                aria-controls="primary-nav"
                onClick={toggleMenu}
              >
                <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
              </button>
            </>
          )
        )}
      </div>
      <nav id="primary-nav" ref={navRef} aria-label="Primary" className={`primary-nav ${menuOpen ? 'open' : ''}`}>
        <ul className="nav-list">
          {!isHome && <li><Link href="/" aria-current={isHome ? 'page' : undefined}>Home</Link></li>}
          <li><Link href="/jobs" aria-current={path === '/jobs' ? 'page' : undefined}>Jobs</Link></li>
          <li><Link href="/about" aria-current={path === '/about' ? 'page' : undefined}>About</Link></li>
          <li><Link href="/services" aria-current={path === '/services' ? 'page' : undefined}>Services</Link></li>
          <li><Link href="/faq" aria-current={path === '/faq' ? 'page' : undefined}>FAQ</Link></li>
          <li><Link href="/contact" aria-current={path === '/contact' ? 'page' : undefined}>Contact</Link></li>
        </ul>
        {status === 'authenticated' && (
          <ul className="nav-list auth-list">
            <li>
              <Link href={getDashboardHref(session.user.role)}>Dashboard</Link>
            </li>
            <li>
              <button type="button" onClick={()=>signOut({ callbackUrl: '/' })} className="logout-btn">Logout</button>
            </li>
          </ul>
        )}
        <div className="mobile-nav-footer">
          <button 
            className="mobile-nav-close" 
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
      </nav>
    </header>
  );
}
