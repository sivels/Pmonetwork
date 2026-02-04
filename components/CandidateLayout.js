import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';
import NotificationPanel from './NotificationPanel';
import MessagePreviewPanel from './MessagePreviewPanel';

export default function CandidateLayout({ children, user }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [candidateProfileId, setCandidateProfileId] = useState(null);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const currentPath = router.pathname;

  const isActive = (path) => currentPath.startsWith(path);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Fetch candidate profile ID
  useEffect(() => {
    const fetchProfileId = async () => {
      try {
        const res = await fetch('/api/user/profile');
        const data = await res.json();
        if (data.candidateProfile?.id) {
          setCandidateProfileId(data.candidateProfile.id);
        }
      } catch (err) {
        console.error('Failed to fetch profile ID:', err);
      }
    };
    fetchProfileId();
  }, []);

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
        const finalVal = Number.isFinite(val) ? val : 0;
        setUnreadMessages(finalVal);
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

  // Poll for unread messages (for all pages except messages page itself)
  useEffect(() => {
    if (router.pathname === '/dashboard/messages') return; // Messages page handles its own polling
    
    if (!candidateProfileId) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch(`/api/conversations?candidateId=${candidateProfileId}`);
        const data = await res.json();
        const conversations = data.items || [];
        
        // Count unread from non-archived conversations
        const unread = conversations
          .filter(c => !c.archivedByCandidate)
          .reduce((sum, c) => sum + (c.unread || 0), 0);
        
        // Update localStorage and dispatch event
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('unreadMessagesCount', String(unread));
          window.dispatchEvent(new CustomEvent('unreadMessages', { detail: unread }));
        }
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };

    // Initial fetch
    fetchUnreadCount();
    
    // Poll every 15 seconds
    const interval = setInterval(fetchUnreadCount, 15000);
    
    return () => clearInterval(interval);
  }, [router.pathname, candidateProfileId]);

  return (
    <div className="candidate-layout">
      <header className="candidate-header">
        <div className="candidate-header-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexDirection: 'row' }}>
          <nav className="candidate-nav-horizontal" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link href="/dashboard/candidate" className={`icon-btn ${isActive('/dashboard/candidate') ? 'active' : ''}`} aria-label="Dashboard" title="Dashboard">
              <span className="icon-wrap">
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </span>
            </Link>
            <Link href="/jobs" className={`icon-btn ${isActive('/jobs') ? 'active' : ''}`} aria-label="Jobs" title="Jobs">
              <span className="icon-wrap">
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
            </Link>
            <Link href="/dashboard/applications" className={`icon-btn ${isActive('/dashboard/applications') ? 'active' : ''}`} aria-label="Applications" title="Applications">
              <span className="icon-wrap">
                <svg width="22" height="22" fill="none" stroke="#6366F1" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" fill="#E0E7FF" stroke="#6366F1" strokeWidth="1.5" />
                  <path d="M8 10h8M8 14h5" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </Link>
            <Link href="/dashboard/interviews" className={`icon-btn ${isActive('/dashboard/interviews') ? 'active' : ''}`} aria-label="Interviews" title="Interviews">
              <span className="icon-wrap">
                <svg width="22" height="22" fill="none" stroke="#6366F1" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" fill="#E0E7FF" stroke="#6366F1" strokeWidth="1.5" />
                  <path d="M8 10h8M8 14h5" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </Link>
            <Link href="/dashboard/messages" className={`icon-btn ${isActive('/dashboard/messages') ? 'active' : ''}`} aria-label="Messages" title="Messages">
              <span className="icon-wrap">
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {unreadMessages > 0 && <span className="icon-dot" aria-hidden="true"></span>}
              </span>
            </Link>
            <Link href="/help" className={`icon-btn ${isActive('/help') ? 'active' : ''}`} aria-label="Help" title="Help">
              <span className="icon-wrap">
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </Link>
          </nav>
          <div className="candidate-profile-section" ref={dropdownRef} style={{ marginLeft: 'auto' }}>
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
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className={`dropdown-arrow ${profileDropdownOpen ? 'open' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {profileDropdownOpen && (
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <img 
                    src={user?.profilePhotoUrl || '/images/avatar-placeholder.svg'} 
                    alt={user?.fullName || 'Profile'} 
                    className="dropdown-avatar"
                  />
                  <div className="dropdown-user-info">
                    <div className="dropdown-company-name">{user?.fullName || 'Candidate'}</div>
                    <div className="dropdown-role">Candidate</div>
                    <div className="dropdown-email">{user?.email}</div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-section">
                  <Link href="/dashboard/candidate" className="dropdown-item">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                  </Link>
                  <Link href="/dashboard/profile" className="dropdown-item">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Profile
                  </Link>
                  <Link href="/dashboard/settings" className="dropdown-item">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Account Settings
                  </Link>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-section">
                  <button onClick={handleSignOut} className="dropdown-item sign-out">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="candidate-main-content">{children}</main>
      <NotificationPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} onUnreadChange={(total) => setUnreadNotifications(total)} />
      <MessagePreviewPanel isOpen={messagesOpen} onClose={() => setMessagesOpen(false)} />
      {/* Add employer-style CSS here or import a shared style */}
    </div>
  );
}
