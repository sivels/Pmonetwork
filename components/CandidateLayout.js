import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';
import NotificationPanel from './NotificationPanel';

export default function CandidateLayout({ children, user }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(5);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const currentPath = router.pathname;

  const isActive = (path) => currentPath.startsWith(path);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileDropdownOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
  }, [currentPath]);

  // Close notifications on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setNotificationsOpen(false);
    }
    if (notificationsOpen) {
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
  }, [notificationsOpen]);

  // Sync unread message count from messages page via localStorage/custom event
  useEffect(() => {
    function readUnreadFromStorage() {
      try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem('unreadMessagesCount') : '0';
        const val = parseInt(raw || '0', 10);
        setUnreadMessages(Number.isFinite(val) ? val : 0);
      } catch {
        setUnreadMessages(0);
      }
    }
    const onCustom = (e) => {
      if (typeof e?.detail === 'number') setUnreadMessages(e.detail);
    };
    const onStorage = (e) => {
      if (e.key === 'unreadMessagesCount') readUnreadFromStorage();
    };
    readUnreadFromStorage();
    window.addEventListener('unreadMessages', onCustom);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('unreadMessages', onCustom);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return (
    <div className="candidate-layout">
      {/* Candidate-Only Navigation Header */}
      <header className="candidate-header">
        <div className="candidate-header-container">
          {/* Logo / Brand */}
          <div className="candidate-brand">
            <Link href="/dashboard/candidate">
              <img src="/logo.svg" alt="PMO Network" width={32} height={32} />
              <span className="brand-text">PMO Network</span>
            </Link>
          </div>

          {/* Desktop Navigation (icons only) */}
          <nav className="candidate-nav-desktop">
            <Link 
              href="/dashboard/candidate" 
              className={`nav-item icon-only ${isActive('/dashboard/candidate') ? 'active' : ''}`}
              aria-label="Dashboard"
              title="Dashboard"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <Link 
              href="/jobs" 
              className={`nav-item icon-only ${isActive('/jobs') ? 'active' : ''}`}
              aria-label="Jobs"
              title="Jobs"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </Link>
          </nav>

          {/* Right-side quick actions: Messages + Notifications (left of profile), Help (right of profile) */}
          <div className="candidate-quick-actions">
            <Link
              href="/dashboard/messages"
              className={`icon-btn messages-btn ${isActive('/dashboard/messages') ? 'active' : ''}`}
              aria-label="Messages"
              title="Messages"
            >
              <span className="icon-wrap">
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {unreadMessages > 0 && <span className="icon-dot" aria-hidden="true"></span>}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setNotificationsOpen(v => !v)}
              className={`icon-btn ${notificationsOpen ? 'active' : ''}`}
              aria-label="Notifications"
              title="Notifications"
            >
              <span className="icon-wrap">
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadNotifications > 0 && <span className="icon-dot" aria-hidden="true"></span>}
              </span>
            </button>
          </div>

          {/* Profile Dropdown */}
            <div className="candidate-profile-section" ref={dropdownRef}>
            <button 
              className="profile-dropdown-trigger"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              aria-expanded={profileDropdownOpen}
            >
              <img 
                src={user?.profilePhotoUrl || '/images/avatar-placeholder.svg'} 
                alt={user?.fullName || 'Profile'} 
                className="profile-avatar"
              />
              <span className="profile-name">{user?.fullName || 'Candidate'}</span>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {profileDropdownOpen && (
              <div className="profile-dropdown">
                <Link href="/dashboard/profile" className="dropdown-item">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Profile
                </Link>
                <Link href="/dashboard/settings" className="dropdown-item">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Account Settings
                </Link>
                <div className="dropdown-divider"></div>
                <button onClick={handleSignOut} className="dropdown-item sign-out">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Help icon on far right */}
          <Link 
            href="/help" 
            className={`icon-btn help-only ${isActive('/help') ? 'active' : ''}`}
            aria-label="Help"
            title="Help"
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Link>

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="candidate-mobile-menu">
            <div className="mobile-profile">
              <img 
                src={user?.profilePhotoUrl || '/images/avatar-placeholder.svg'} 
                alt={user?.fullName || 'Profile'} 
                className="mobile-avatar"
              />
              <div className="mobile-profile-info">
                <span className="mobile-name">{user?.fullName || 'Candidate'}</span>
                <span className="mobile-email">{user?.email || ''}</span>
              </div>
            </div>
            <nav className="mobile-nav">
              <Link href="/dashboard/candidate" className={`mobile-nav-item ${isActive('/dashboard/candidate') ? 'active' : ''}`}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
              <Link href="/jobs" className={`mobile-nav-item ${isActive('/jobs') ? 'active' : ''}`}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Jobs
              </Link>
              <Link href="/dashboard/messages" className={`mobile-nav-item ${isActive('/dashboard/messages') ? 'active' : ''}`}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Messages
                {unreadMessages > 0 && <span className="mobile-dot" aria-hidden="true"></span>}
              </Link>
              <Link href="/dashboard/profile" className={`mobile-nav-item ${isActive('/dashboard/profile') ? 'active' : ''}`}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                My Profile
              </Link>
              <Link href="/help" className={`mobile-nav-item ${isActive('/help') ? 'active' : ''}`}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Help & Support
              </Link>
              <Link href="/dashboard/settings" className={`mobile-nav-item ${isActive('/dashboard/settings') ? 'active' : ''}`}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Account Settings
              </Link>
              <button onClick={handleSignOut} className="mobile-nav-item sign-out-mobile">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="candidate-main-content">
        {children}
      </main>

      <style jsx>{`
        .candidate-layout { min-height:100vh; background:#f8f9fc; }

        /* Header */
        .candidate-header { position:sticky; top:0; z-index:1000; background:#ffffff; border-bottom:1px solid #e5e7eb; box-shadow:0 1px 3px rgba(0,0,0,0.05); }
        .candidate-header-container { max-width:1440px; margin:0 auto; padding:0 1.5rem; height:64px; display:flex; align-items:center; justify-content:space-between; gap:2rem; }

        /* Brand */
        .candidate-brand a { display:flex; align-items:center; gap:0.75rem; text-decoration:none; }
        .candidate-brand img { border-radius:6px; }
        .brand-text { font-size:1.1rem; font-weight:700; color:#1f2937; }

        /* Desktop Navigation */
        .candidate-nav-desktop { display:none; flex:1; gap:0.5rem; }
        .nav-item { display:flex; align-items:center; gap:0.5rem; padding:0.6rem 1rem; border-radius:10px; font-size:0.9rem; font-weight:500; color:#6b7280; text-decoration:none; transition:all 0.15s; position:relative; }
        .nav-item.icon-only { width:40px; height:40px; padding:0; align-items:center; justify-content:center; border-radius:10px; }
        .nav-item:hover { background:#f3f4f6; color:#374151; }
        .nav-item.active { background:#eef2ff; color:#4f46e5; font-weight:600; }
        .nav-item svg { flex-shrink:0; }
        .nav-badge { display:inline-flex; align-items:center; justify-content:center; min-width:20px; height:20px; padding:0 6px; background:#ef4444; color:#ffffff; border-radius:10px; font-size:0.7rem; font-weight:600; }

        /* Quick action icons (messages, notifications, help) */
        .candidate-quick-actions { display:none; align-items:center; gap:0.25rem; margin-right:0.25rem; }
        .icon-btn { position:relative; display:flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius:10px; color:#6b7280; text-decoration:none; transition:all 0.15s; }
        .icon-btn:hover { background:#f3f4f6; color:#374151; }
        .icon-btn.active { background:#eef2ff; color:#4f46e5; }
        .icon-wrap { position:relative; display:inline-flex; }
        .icon-badge { position:absolute; top:4px; right:4px; min-width:18px; height:18px; padding:0 5px; background:#ef4444; color:#fff; border-radius:9999px; font-size:0.7rem; font-weight:700; line-height:18px; display:inline-flex; align-items:center; justify-content:center; }
        .messages-btn .icon-badge { top:6px; right:6px; min-width:16px; height:16px; line-height:16px; font-size:0.65rem; transform: translate(15%, -15%); }
        .icon-dot { position:absolute; top:4px; right:4px; width:8px; height:8px; background:#ef4444; border-radius:50%; box-shadow:0 0 0 2px #fff; }
        .help-only { margin-left:0.25rem; }

        /* Profile Section */
        .candidate-profile-section { position:relative; display:none; }
        .profile-dropdown-trigger { display:flex; align-items:center; gap:0.75rem; padding:0.5rem 0.75rem; border:1px solid #e5e7eb; border-radius:12px; background:#ffffff; cursor:pointer; transition:all 0.15s; }
        .profile-dropdown-trigger:hover { background:#f9fafb; border-color:#d1d5db; }
        .profile-avatar { width:32px; height:32px; border-radius:50%; object-fit:cover; }
        .profile-name { font-size:0.85rem; font-weight:500; color:#374151; max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .profile-dropdown { position:absolute; top:calc(100% + 8px); right:0; width:220px; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1); padding:0.5rem; z-index:100; }
        .dropdown-item { display:flex; align-items:center; gap:0.75rem; padding:0.75rem; border-radius:8px; font-size:0.85rem; font-weight:500; color:#374151; text-decoration:none; transition:all 0.15s; background:transparent; border:none; width:100%; text-align:left; cursor:pointer; }
        .dropdown-item:hover { background:#f3f4f6; }
        .dropdown-item.sign-out { color:#ef4444; }
        .dropdown-item.sign-out:hover { background:#fef2f2; }
        .dropdown-divider { height:1px; background:#e5e7eb; margin:0.5rem 0; }

        /* Mobile Menu Toggle */
        .mobile-menu-toggle { display:flex; align-items:center; justify-content:center; width:40px; height:40px; border:none; background:transparent; color:#6b7280; cursor:pointer; border-radius:8px; transition:all 0.15s; }
        .mobile-menu-toggle:hover { background:#f3f4f6; }

        /* Mobile Menu */
        .candidate-mobile-menu { position:absolute; top:100%; left:0; right:0; background:#ffffff; border-bottom:1px solid #e5e7eb; box-shadow:0 4px 12px rgba(0,0,0,0.1); padding:1rem; animation:slideDown 0.2s ease-out; }
        @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
        .mobile-profile { display:flex; align-items:center; gap:1rem; padding:1rem; background:#f9fafb; border-radius:12px; margin-bottom:1rem; }
        .mobile-avatar { width:48px; height:48px; border-radius:50%; object-fit:cover; }
        .mobile-profile-info { display:flex; flex-direction:column; }
        .mobile-name { font-size:0.95rem; font-weight:600; color:#1f2937; }
        .mobile-email { font-size:0.8rem; color:#6b7280; }
        .mobile-nav { display:flex; flex-direction:column; gap:0.25rem; }
        .mobile-nav-item { display:flex; align-items:center; gap:0.75rem; padding:0.85rem 1rem; border-radius:10px; font-size:0.9rem; font-weight:500; color:#374151; text-decoration:none; transition:all 0.15s; background:transparent; border:none; width:100%; text-align:left; cursor:pointer; }
        .mobile-nav-item:hover { background:#f3f4f6; }
        .mobile-nav-item.active { background:#eef2ff; color:#4f46e5; font-weight:600; }
        .mobile-nav-item svg { flex-shrink:0; }
        .mobile-dot { margin-left:auto; width:10px; height:10px; background:#ef4444; border-radius:50%; box-shadow:0 0 0 2px #fff; }
        .sign-out-mobile { color:#ef4444; margin-top:0.5rem; border-top:1px solid #e5e7eb; padding-top:1rem; }
        .sign-out-mobile:hover { background:#fef2f2; }

        /* Main Content */
        .candidate-main-content { min-height:calc(100vh - 64px); }

        /* Desktop Breakpoint */
        @media (min-width:768px) {
          .candidate-nav-desktop { display:flex; }
          .candidate-quick-actions { display:flex; }
          .candidate-profile-section { display:block; }
          .mobile-menu-toggle { display:none; }
        }

        /* Hide mobile menu on desktop */
        @media (min-width:768px) {
          .candidate-mobile-menu { display:none; }
        }
      `}</style>

      {/* Notifications Panel */}
      <NotificationPanel 
        isOpen={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)}
        onUnreadChange={(total) => setUnreadNotifications(total)}
      />
    </div>
  );
}
