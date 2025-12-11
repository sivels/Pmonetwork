import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';

export default function EmployerLayout({ children }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const path = router.pathname;
  const isActive = (p) => path.startsWith(p);
  
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
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
            <Link href="/employer/messages" className={`icon-btn ${isActive('/employer/messages') ? 'active' : ''}`} aria-label="Messages" title="Messages">
              <span className="icon-wrap">
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="icon-dot" aria-hidden="true"></span>
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
                  src={session?.user?.companyLogoUrl || '/images/company-placeholder.svg'} 
                  alt={session?.user?.companyName || 'Company'} 
                  className="profile-avatar"
                />
                <span className="profile-name">{session?.user?.companyName || 'Company'}</span>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className={`dropdown-arrow ${profileDropdownOpen ? 'open' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileDropdownOpen && (
                <div className="profile-dropdown">
                  {/* Account Summary Section */}
                  <div className="dropdown-header">
                    <img 
                      src={session?.user?.companyLogoUrl || '/images/company-placeholder.svg'} 
                      alt={session?.user?.companyName || 'Company'} 
                      className="dropdown-avatar"
                    />
                    <div className="dropdown-user-info">
                      <div className="dropdown-company-name">{session?.user?.companyName || 'Company'}</div>
                      <div className="dropdown-role">Hiring Company</div>
                      <div className="dropdown-email">{session?.user?.email}</div>
                    </div>
                  </div>

                  {/* Stats Section */}
                  <div className="dropdown-stats">
                    <Link href="/employer/jobs" className="stat-item">
                      <div className="stat-value">12</div>
                      <div className="stat-label">Active Jobs</div>
                    </Link>
                    <Link href="/employer/applicants" className="stat-item">
                      <div className="stat-value">48</div>
                      <div className="stat-label">Applicants</div>
                    </Link>
                    <Link href="/employer/messages" className="stat-item">
                      <div className="stat-value">5</div>
                      <div className="stat-label">Unread</div>
                    </Link>
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

      <main className="employer-content">{children}</main>

      <style jsx>{`
        .employer-layout{min-height:100vh;background:#f8f9fc}
        .employer-header{position:sticky;top:0;z-index:1000;background:#fff;border-bottom:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,.05)}
        .employer-header-container{max-width:1440px;margin:0 auto;padding:0 1.5rem;height:64px;display:flex;align-items:center;justify-content:space-between;gap:2rem}
        .employer-left,.employer-right{display:flex;align-items:center;gap:.25rem}
        .icon-btn{position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:10px;color:#6b7280;text-decoration:none;transition:all .15s}
        .icon-btn:hover{background:#f3f4f6;color:#374151}
        .icon-btn.active{background:#eef2ff;color:#4f46e5}
        .icon-wrap{position:relative;display:inline-flex}
        .icon-dot{position:absolute;top:4px;right:4px;width:8px;height:8px;background:#ef4444;border-radius:50%;box-shadow:0 0 0 2px #fff}
        
        .employer-profile-section{position:relative}
        .profile-dropdown-trigger{display:flex;align-items:center;gap:.75rem;padding:.5rem .75rem;border:1px solid #e5e7eb;border-radius:12px;background:#fff;cursor:pointer;transition:all .2s;color:#374151}
        .profile-dropdown-trigger:hover{background:#f8fafc;border-color:#cbd5e1}
        .profile-avatar{width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid #e5e7eb}
        .profile-name{font-size:.875rem;font-weight:600;color:#111827;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .dropdown-arrow{transition:transform .2s}
        .dropdown-arrow.open{transform:rotate(180deg)}
        
        .profile-dropdown{position:absolute;top:calc(100% + .5rem);right:0;width:280px;background:white;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.15),0 0 0 1px rgba(0,0,0,.05);z-index:1000;animation:slideDown .2s ease}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        
        .dropdown-header{padding:1rem 1.25rem;display:flex;align-items:center;gap:.75rem;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:16px 16px 0 0}
        .dropdown-avatar{width:48px;height:48px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,.3)}
        .dropdown-user-info{flex:1;min-width:0}
        .dropdown-company-name{font-size:.9375rem;font-weight:700;color:white;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .dropdown-role{font-size:.75rem;color:rgba(255,255,255,.8);margin-top:.125rem}
        .dropdown-email{font-size:.6875rem;color:rgba(255,255,255,.7);margin-top:.25rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        
        .dropdown-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.5rem;padding:1rem;background:#fafbfc}
        .stat-item{text-align:center;padding:.25rem;text-decoration:none;border-radius:8px;transition:all .2s;cursor:pointer}
        .stat-item:hover{background:#fff;transform:translateY(-2px)}
        .stat-value{font-size:1.25rem;font-weight:700;color:#111827;line-height:1;margin-bottom:.25rem}
        .stat-label{font-size:.625rem;color:#6b7280;font-weight:500}
        
        .dropdown-divider{height:1px;background:#e5e7eb;margin:.5rem 0}
        
        .dropdown-section{padding:.5rem}
        .dropdown-item{display:flex;align-items:center;gap:.75rem;width:100%;padding:.75rem 1rem;border-radius:10px;font-size:.875rem;font-weight:500;color:#374151;text-decoration:none;transition:all .15s;background:transparent;border:none;cursor:pointer;text-align:left;white-space:nowrap}
        .dropdown-item:hover{background:#f3f4f6;color:#111827}
        .dropdown-item.sign-out{color:#ef4444}
        .dropdown-item.sign-out:hover{background:#fee2e2;color:#dc2626}
        .dropdown-item svg{flex-shrink:0}
        
        .employer-content{min-height:calc(100vh - 64px)}
        
        @media (max-width:768px){
          .profile-name{display:none}
          .profile-dropdown{right:auto;left:50%;transform:translateX(-50%);width:calc(100vw - 2rem);max-width:320px}
        }
      `}</style>
    </div>
  );
}
