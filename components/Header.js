import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Header() {
  const router = useRouter();
  const path = router?.pathname || '/';
  const isHome = path === '/';
  const showNav = ['/', '/about', '/services', '/faq', '/contact'].includes(path);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(o => !o);

  return (
    <header className="site-header container" role="banner">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="site-brand">
        <Link href="/" aria-label="PMO Network home">
          <img src="/logo.svg" alt="PMO Network" width={40} height={40} style={{ objectFit: 'contain', marginRight: 8 }} />
        </Link>
        {isHome ? <h1 className="site-title">PMO Network</h1> : <p className="site-title" aria-label="PMO Network">PMO Network</p>}
      </div>

      {showNav && (
        <>
          <button
            className="mobile-nav-toggle"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="primary-nav"
            onClick={toggleMenu}
          >
            <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
          </button>
          <nav id="primary-nav" aria-label="Primary" className={`primary-nav ${menuOpen ? 'open' : ''}`}>
            <ul className="nav-list">
              <li><Link href="/" aria-current={isHome ? 'page' : undefined}>Home</Link></li>
              <li><Link href="/about" aria-current={path === '/about' ? 'page' : undefined}>About</Link></li>
              <li><Link href="/services" aria-current={path === '/services' ? 'page' : undefined}>Services</Link></li>
              <li><Link href="/faq" aria-current={path === '/faq' ? 'page' : undefined}>FAQ</Link></li>
              <li><Link href="/contact" aria-current={path === '/contact' ? 'page' : undefined}>Contact</Link></li>
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}
