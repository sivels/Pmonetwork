import Link from 'next/link';

export default function SidebarNav() {
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
