import Link from 'next/link';

function DashboardIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function JobsIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function ApplicationsIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V9m-6-4l4 4m0 0l-4 4m4-4H10" />
    </svg>
  );
}

function InterviewsIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function MessagesIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function CompanyIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function OffersIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-3.314 0-6 1.79-6 4s2.686 4 6 4 6-1.79 6-4-2.686-4-6-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m7-9h2M3 12h2" />
    </svg>
  );
}

function getItems(role) {
  if (role === 'employer') {
    return [
      { type: 'link', href: '/dashboard/employer', label: 'Dashboard', icon: DashboardIcon },
      { type: 'link', href: '/employer/jobs', label: 'Jobs', icon: JobsIcon },
      { type: 'link', href: '/employer/post-job', label: 'Post Job', icon: PlusIcon },
      { type: 'link', href: '/employer/search-candidates', label: 'Search Candidates', icon: SearchIcon },
      { type: 'link', href: '/employer/interviews', label: 'Interviews', icon: InterviewsIcon },
      { type: 'link', href: '/employer/messages', label: 'Messages', icon: MessagesIcon, badge: 'messages' },
      { type: 'link', href: '/employer/offers', label: 'Offers', icon: OffersIcon },
      { type: 'link', href: '/help', label: 'Help', icon: HelpIcon },
      { type: 'divider' },
      { type: 'link', href: '/employer/profile', label: 'Company Profile', icon: CompanyIcon },
      { type: 'link', href: '/employer/settings', label: 'Settings', icon: SettingsIcon },
      { type: 'button', label: 'Sign Out', icon: SignOutIcon, variant: 'sign-out' },
    ];
  }

  return [
    { type: 'link', href: '/dashboard/candidate', label: 'Dashboard', icon: DashboardIcon },
    { type: 'link', href: '/jobs', label: 'Jobs', icon: JobsIcon },
    { type: 'link', href: '/dashboard/applications', label: 'Applications', icon: ApplicationsIcon },
    { type: 'link', href: '/dashboard/interviews', label: 'Interviews', icon: InterviewsIcon },
    { type: 'link', href: '/dashboard/messages', label: 'Messages', icon: MessagesIcon, badge: 'messages' },
    { type: 'divider' },
    { type: 'link', href: '/dashboard/profile', label: 'My Profile', icon: ProfileIcon },
    { type: 'link', href: '/dashboard/settings', label: 'Account Settings', icon: SettingsIcon },
    { type: 'link', href: '/help', label: 'Help', icon: HelpIcon },
    { type: 'button', label: 'Sign Out', icon: SignOutIcon, variant: 'sign-out' },
  ];
}

export default function SidebarNav({ role, isActive, unreadMessages = 0, onSignOut }) {
  if (!role) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <nav className="space-y-2">
          <Link href="/candidate/dashboard" className="block px-3 py-2 rounded hover:bg-gray-50">Overview</Link>
          <Link href="/candidate/profile" className="block px-3 py-2 rounded hover:bg-gray-50">Profile</Link>
          <Link href="/candidate/documents" className="block px-3 py-2 rounded hover:bg-gray-50">Documents</Link>
          <Link href="/candidate/applications" className="block px-3 py-2 rounded hover:bg-gray-50">Applications</Link>
          <Link href="/candidate/settings" className="block px-3 py-2 rounded hover:bg-gray-50">Settings</Link>
        </nav>
      </div>
    );
  }

  const items = getItems(role);

  return (
    <nav className="sidebar-nav">
      {items.map((item, index) => {
        if (item.type === 'divider') {
          return <div key={`divider-${index}`} className="sidebar-divider"></div>;
        }

        const Icon = item.icon;
        const active = item.type === 'link' && typeof isActive === 'function' ? isActive(item.href) : false;
        const className = `sidebar-item ${active ? 'active' : ''} ${item.variant || ''}`.trim();

        if (item.type === 'button') {
          return (
            <button key={item.label} type="button" className={className} onClick={onSignOut}>
              <Icon />
              <span>{item.label}</span>
            </button>
          );
        }

        return (
          <Link key={item.href} href={item.href} className={className}>
            <Icon />
            <span>{item.label}</span>
            {item.badge === 'messages' && unreadMessages > 0 && <span className="sidebar-badge">{unreadMessages}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
