import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';

export default function CandidateLayout({ children, session }) {
  // --- EMPLOYER HEADER CLONE FOR CANDIDATE ---
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [candidateProfileId, setCandidateProfileId] = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const path = router.pathname;
  const isActive = (p) => path.startsWith(p);
  
  const user = session?.user;
  const profileName = candidateProfile?.fullName || user?.fullName || user?.name || 'Candidate';
  const profileEmail = candidateProfile?.email || user?.email || '';
  const profileAvatar = candidateProfile?.profilePhotoUrl || user?.profilePhotoUrl || '/images/avatar-placeholder.svg';

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

  // Fetch candidate profile details
  useEffect(() => {
    const fetchProfileId = async () => {
      try {
        const res = await fetch('/api/user/profile');
        const data = await res.json();
        if (data.candidateProfile?.id) {
          setCandidateProfileId(data.candidateProfile.id);
        }
        if (data.candidateProfile) {
          setCandidateProfile(data.candidateProfile);
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

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="candidate-layout">
      <header className="candidate-header">
        <div className="candidate-header-container">
          {/* Left icons: icon-only navigation */}
          <nav className="candidate-left">
            <Link 
              href="/dashboard/candidate" 
              className={`icon-btn ${isActive('/dashboard/candidate') ? 'active' : ''}`} 
              aria-label="Dashboard" 
              title="Dashboard"
              onClick={(e) => {
                if (path === '/dashboard/candidate') {
                  e.preventDefault();
                }
              }}
            >
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
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
          </nav>
          {/* Right icons: Help and Profile Dropdown */}
          <div className="candidate-right">
            <Link href="/help" className={`icon-btn ${isActive('/help') ? 'active' : ''}`} aria-label="Help" title="Help">
              <span className="icon-wrap">
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </Link>
            <div className="candidate-profile-section" ref={dropdownRef}>
              <button 
                className="profile-dropdown-trigger"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-expanded={profileDropdownOpen}
                aria-label="Open candidate menu"
              >
                <img 
                  src={profileAvatar}
                  alt={profileName}
                  className="profile-avatar"
                />
                <span className="profile-name">{profileName}</span>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className={`dropdown-arrow ${profileDropdownOpen ? 'open' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {profileDropdownOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <img 
                      src={profileAvatar}
                      alt={profileName}
                      className="dropdown-avatar"
                    />
                    <div className="dropdown-user-info">
                      <div className="dropdown-company-name">{profileName}</div>
                      <div className="dropdown-role">Candidate</div>
                      <div className="dropdown-email">{profileEmail}</div>
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
        </div>
      </header>
      {children}
      <style jsx>{`
        .candidate-layout{min-height:100vh;background:#f8f9fc}
        .candidate-header{position:sticky;top:0;z-index:1000;background:#fff;border-bottom:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,.05)}
        .candidate-header-container{max-width:1440px;margin:0 auto;padding:0 1.5rem;height:64px;display:flex;align-items:center;justify-content:space-between;gap:2rem}
        .candidate-left,.candidate-right{display:flex;align-items:center;gap:.25rem}
        .icon-btn{position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:10px;color:#6b7280;text-decoration:none;transition:all .15s}
        .icon-btn:hover{background:#f3f4f6;color:#374151}
        .icon-btn.active{background:#eef2ff;color:#4f46e5}
        .icon-wrap{position:relative;display:inline-flex}
        .icon-dot{position:absolute;top:4px;right:4px;width:8px;height:8px;background:#ef4444;border-radius:50%;box-shadow:0 0 0 2px #fff}

        .candidate-profile-section{position:relative}
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

        .candidate-content{min-height:calc(100vh - 64px)}

        @media (max-width:768px){
          .profile-name{display:none}
          .profile-dropdown{right:auto;left:50%;transform:translateX(-50%);width:calc(100vw - 2rem);max-width:320px}
        }
      `}</style>
    </div>
  );
}
