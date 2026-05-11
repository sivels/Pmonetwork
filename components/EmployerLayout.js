import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import SidebarNav from './dashboard/SidebarNav';

export default function EmployerLayout({ children }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const path = router.pathname;
  const isActive = (p) => path.startsWith(p);
  
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [employerProfileId, setEmployerProfileId] = useState(null);
  const [employerProfile, setEmployerProfile] = useState(null);
  const dropdownRef = useRef(null);

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

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const originalOverflow = document.body.style.overflow;
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalOverflow;
    }
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.pathname]);

  // Fetch employer profile ID and data
  useEffect(() => {
    const fetchProfileId = async () => {
      try {
        const res = await fetch('/api/user/profile');
        const data = await res.json();
        if (data.employerProfile?.id) {
          setEmployerProfileId(data.employerProfile.id);
          setEmployerProfile(data.employerProfile);
        }
      } catch (err) {
        console.error('Failed to fetch profile ID:', err);
      }
    };
    fetchProfileId();
  }, []);

  // Sync unread message count from messages page via localStorage/custom event
  useEffect(() => {
    function readUnreadFromStorage() {
      try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem('employerUnreadMessagesCount') : '0';
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
      if (e.key === 'employerUnreadMessagesCount') readUnreadFromStorage();
    };
    readUnreadFromStorage();
    window.addEventListener('employerUnreadMessages', onCustom);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('employerUnreadMessages', onCustom);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Poll for unread messages (for all pages except messages page itself)
  useEffect(() => {
    if (router.pathname === '/employer/messages') return; // Messages page handles its own polling
    
    if (!employerProfileId) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch(`/api/conversations?employerId=${employerProfileId}`);
        const data = await res.json();
        const conversations = data.items || [];
        
        // Count unread from non-archived conversations
        const unread = conversations
          .filter(c => !c.archivedByEmployer)
          .reduce((sum, c) => sum + (c.unread || 0), 0);
        
        // Update localStorage and dispatch event
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('employerUnreadMessagesCount', String(unread));
          window.dispatchEvent(new CustomEvent('employerUnreadMessages', { detail: unread }));
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
  }, [router.pathname, employerProfileId]);

  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/employer-login' });
  };

  // Guard: only employers
  if (status === 'loading') return <div className="page-loader">Loading…</div>;
  if (status !== 'authenticated' || session?.user?.role?.toLowerCase() !== 'employer') {
    if (typeof window !== 'undefined') router.replace('/employer-login');
    return null;
  }

  return (
    <div className="employer-layout">
      <header className="employer-header">
        <div className="employer-header-container">
          <button
            type="button"
            className="mobile-menu-trigger"
            aria-label="Open sidebar menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(true)}
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* Left icons */}
          <nav className="employer-left">
            <Link href="/dashboard/employer" className={`icon-btn ${isActive('/dashboard/employer') ? 'active' : ''}`} aria-label="Dashboard" title="Dashboard">
              <span className="icon-wrap">
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </span>
            </Link>
            <Link href="/employer/jobs" className={`icon-btn ${isActive('/employer/jobs') ? 'active' : ''}`} aria-label="Jobs" title="Jobs">
              <span className="icon-wrap">
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
            </Link>
            <Link href="/employer/post-job" className={`icon-btn ${isActive('/employer/post-job') ? 'active' : ''}`} aria-label="Post Job" title="Post Job">
              <span className="icon-wrap">
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </span>
            </Link>
            <Link href="/employer/search-candidates" className={`icon-btn ${isActive('/employer/search-candidates') ? 'active' : ''}`} aria-label="Search Candidates" title="Search Candidates">
              <span className="icon-wrap">
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </Link>
            <Link href="/employer/interviews" className={`icon-btn ${isActive('/employer/interviews') ? 'active' : ''}`} aria-label="Interviews" title="Interviews">
              <span className="icon-wrap">
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
            </Link>
            <Link href="/employer/offers" className={`icon-btn ${isActive('/employer/offers') ? 'active' : ''}`} aria-label="Offers" title="Offers">
              <span className="icon-wrap">
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-3.314 0-6 1.79-6 4s2.686 4 6 4 6-1.79 6-4-2.686-4-6-4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m7-9h2M3 12h2m11.95-6.95l1.414 1.414M5.636 18.364l1.414-1.414m0-10.486L5.636 5.05m12.728 12.728-1.414-1.414" />
                </svg>
              </span>
            </Link>
          </nav>

          {/* Right icons */}
          <div className="employer-right">
            <Link href="/help" className={`icon-btn ${isActive('/help') ? 'active' : ''}`} aria-label="Help" title="Help">
              <span className="icon-wrap">
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </Link>
            
            {/* Profile Dropdown */}
            <div className="employer-profile-section" ref={dropdownRef}>
              <button 
                className="profile-dropdown-trigger"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-expanded={profileDropdownOpen}
              >
                <img 
                  src={employerProfile?.logoUrl || session?.user?.companyLogoUrl || '/images/avatar-placeholder.svg'} 
                  alt={employerProfile?.companyName || session?.user?.companyName || 'Company'} 
                  className="profile-avatar"
                />
                <span className="profile-name">{employerProfile?.companyName || session?.user?.companyName || 'Company'}</span>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className={`dropdown-arrow ${profileDropdownOpen ? 'open' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileDropdownOpen && (
                <div className="profile-dropdown">
                  {/* Account Summary Section */}
                  <div className="dropdown-header">
                    <img 
                      src={employerProfile?.logoUrl || session?.user?.companyLogoUrl || '/images/avatar-placeholder.svg'} 
                      alt={employerProfile?.companyName || session?.user?.companyName || 'Company'} 
                      className="dropdown-avatar"
                    />
                    <div className="dropdown-user-info">
                      <div className="dropdown-company-name">{employerProfile?.companyName || session?.user?.companyName || 'Company'}</div>
                      <div className="dropdown-role">Hiring Company</div>
                      <div className="dropdown-email">{session?.user?.email}</div>
                    </div>
                  </div>

                  <div className="dropdown-divider"></div>

                  {/* Quick Actions Section */}
                  <div className="dropdown-section">
                    <Link href="/dashboard/employer" className="dropdown-item">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Dashboard
                    </Link>
                    <Link href="/employer/search-candidates" className="dropdown-item">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search Candidates
                    </Link>
                    <Link href="/employer/profile" className="dropdown-item">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Company Profile
                    </Link>
                    <Link href="/employer/offers" className="dropdown-item">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-3.314 0-6 1.79-6 4s2.686 4 6 4 6-1.79 6-4-2.686-4-6-4z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m7-9h2M3 12h2" />
                      </svg>
                      Offers
                    </Link>
                    <Link href="/employer/settings" className="dropdown-item">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </Link>
                  </div>

                  <div className="dropdown-divider"></div>

                  {/* System Actions Section */}
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
        </div>
      </header>

      <div
        className={`sidebar-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />
      <aside className={`dashboard-sidebar ${mobileMenuOpen ? 'open' : 'closed'}`} aria-hidden={!mobileMenuOpen}>
        <div className="sidebar-header">
          <button
            type="button"
            className="sidebar-close-btn"
            aria-label="Close sidebar menu"
            onClick={() => setMobileMenuOpen(false)}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <SidebarNav
          role="employer"
          isActive={isActive}
          unreadMessages={unreadMessages}
          onSignOut={handleSignOut}
        />
      </aside>

      <main className="employer-content">{children}</main>

      <style jsx>{`
        .employer-layout{min-height:100vh;background:#f8f9fc}
        .employer-header{position:sticky;top:0;z-index:1000;background:#fff;border-bottom:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,.05)}
        .employer-header-container{max-width:1440px;margin:0 auto;padding:0 1.5rem;height:64px;display:flex;align-items:center;justify-content:space-between;gap:2rem}
        .mobile-menu-trigger{display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;color:#374151;cursor:pointer;transition:all .15s}
        .mobile-menu-trigger:hover{background:#f3f4f6}
        .employer-left{display:none}
        .employer-right{display:flex;align-items:center;gap:.25rem}
        .icon-btn{position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:10px;color:#6b7280;text-decoration:none;transition:all .15s}
        .icon-btn:hover{background:#f3f4f6;color:#374151}
        .icon-btn.active{background:#eef2ff;color:#4f46e5}
        .icon-wrap{position:relative;display:inline-flex}
        .icon-dot{position:absolute;top:4px;right:4px;width:8px;height:8px;background:#ef4444;border-radius:50%;box-shadow:0 0 0 2px #fff}

        .sidebar-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);opacity:0;pointer-events:none;transition:opacity .2s;z-index:1200}
        .sidebar-overlay.open{opacity:1;pointer-events:auto}
        .dashboard-sidebar{position:fixed;top:0;left:0;height:100vh;width:260px;max-width:90vw;background:#fff;border-right:1px solid #e5e7eb;display:flex;flex-direction:column;overflow-y:auto;transform:translateX(-100%);transition:transform .22s ease;z-index:1201}
        .dashboard-sidebar.open{transform:translateX(0)}
        .dashboard-sidebar.closed{transform:translateX(-100%)}
        .sidebar-header{display:flex;padding:1rem;border-bottom:1px solid #e5e7eb;justify-content:flex-end}
        .sidebar-close-btn{background:none;border:none;cursor:pointer;color:#6b7280;padding:.5rem;display:block}
        .sidebar-nav{padding:1.5rem 0;display:flex;flex-direction:column;gap:.25rem}
        .sidebar-item{display:flex;align-items:center;gap:.75rem;padding:.75rem 1.5rem;color:#6b7280;text-decoration:none;transition:all .15s;border:none;background:transparent;width:100%;text-align:left;cursor:pointer;position:relative;font-size:1rem}
        .sidebar-item:hover{background:#f3f4f6;color:#374151}
        .sidebar-item.active{background:#eef2ff;color:#4f46e5;font-weight:600}
        .sidebar-item svg{flex-shrink:0}
        .sidebar-badge{margin-left:auto;background:#7c3aed;color:#fff;font-size:.7rem;font-weight:600;padding:.125rem .5rem;border-radius:9999px;min-width:20px;text-align:center}
        .sidebar-divider{height:1px;background:#e5e7eb;margin:.5rem 1.5rem}
        .sidebar-item.sign-out{color:#dc2626}
        .sidebar-item.sign-out:hover{background:#fee2e2;color:#b91c1c}
        
        .employer-profile-section{position:relative}
        .profile-dropdown-trigger{display:flex;align-items:center;gap:.75rem;padding:.5rem .75rem;border:1px solid #e5e7eb;border-radius:12px;background:#fff;cursor:pointer;transition:all .2s;color:#374151}
        .profile-dropdown-trigger:hover{background:#f8fafc;border-color:#cbd5e1}
        .profile-avatar{display:block;width:32px;height:32px;min-width:32px;min-height:32px;border-radius:50%;object-fit:contain;object-position:center center;border:2px solid #e5e7eb;box-sizing:border-box;overflow:hidden;flex-shrink:0;background:#fff;padding:2px}
        .profile-name{font-size:.875rem;font-weight:600;color:#111827;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .dropdown-arrow{transition:transform .2s}
        .dropdown-arrow.open{transform:rotate(180deg)}
        
        .profile-dropdown{position:absolute;top:calc(100% + .5rem);right:0;width:320px;background:#fff;border-radius:18px;box-shadow:0 24px 60px rgba(15,23,42,.16),0 0 0 1px rgba(15,23,42,.08);z-index:1000;animation:slideDown .2s ease;overflow:hidden}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        
        .dropdown-header{padding:1.1rem 1.25rem;display:flex;align-items:center;gap:.75rem;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)}
        .dropdown-avatar{display:block;width:48px;height:48px;min-width:48px;min-height:48px;border-radius:50%;object-fit:contain;object-position:center center;border:3px solid rgba(255,255,255,.3);box-sizing:border-box;overflow:hidden;flex-shrink:0;background:#fff;padding:3px}
        .dropdown-user-info{flex:1;min-width:0}
        .dropdown-company-name{font-size:.9375rem;font-weight:700;color:white;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .dropdown-role{font-size:.75rem;color:rgba(255,255,255,.8);margin-top:.125rem}
        .dropdown-email{font-size:.6875rem;color:rgba(255,255,255,.7);margin-top:.25rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        
        .dropdown-divider{height:1px;background:#e5e7eb;margin:0}
        
        .dropdown-section{padding:.625rem}
        .dropdown-item{display:flex;align-items:center;gap:.75rem;width:100%;padding:.85rem 1rem;border-radius:10px;font-size:.95rem;font-weight:500;color:#374151;text-decoration:none;transition:all .15s;background:transparent;border:none;cursor:pointer;text-align:left;white-space:nowrap}
        .dropdown-item:hover{background:#f3f4f6;color:#111827}
        .dropdown-item.sign-out{color:#ef4444}
        .dropdown-item.sign-out:hover{background:#fee2e2;color:#dc2626}
        .dropdown-item svg{flex-shrink:0}
        
        .employer-content{min-height:calc(100vh - 64px)}
        
        @media (max-width:768px){
          .employer-left{display:none}
          .employer-header-container{padding:0 1rem;gap:.75rem}
          .profile-name{display:none}
          .profile-dropdown{right:auto;left:50%;transform:translateX(-50%);width:calc(100vw - 2rem);max-width:320px}
          .dashboard-sidebar{box-shadow:2px 0 8px rgba(0,0,0,.1)}
        }
      `}</style>
    </div>
  );
}
