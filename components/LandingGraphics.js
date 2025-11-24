export default function LandingGraphics({ className = '' }) {
  return (
    <div className={`relative w-full h-56 lg:h-64 ${className}`} aria-hidden>
      {/* decorative dashboard */}
      <svg className="absolute right-4 top-0 w-40 h-28 animate-fade-up animate-float" viewBox="0 0 160 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="160" height="96" rx="8" fill="#eef2ff" />
        <rect x="8" y="10" width="60" height="10" rx="3" fill="#dbeafe" />
        <rect x="8" y="28" width="120" height="8" rx="3" fill="#f1f5f9" />
        <rect x="8" y="40" width="40" height="8" rx="3" fill="#f1f5f9" />
        <rect x="56" y="40" width="88" height="8" rx="3" fill="#e6eefb" />
        <circle cx="26" cy="70" r="10" fill="#c7d2fe" />
        <rect x="44" y="62" width="100" height="14" rx="6" fill="#fff" stroke="#eef2ff" />
      </svg>

      {/* small workflow */}
      <svg className="absolute left-4 bottom-0 w-44 h-32 animate-fade-up" viewBox="0 0 176 128" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="176" height="128" rx="12" fill="#ffffff" stroke="#eef2ff" />
        <rect x="12" y="14" width="60" height="18" rx="6" fill="#eef2ff" />
        <rect x="12" y="44" width="60" height="12" rx="4" fill="#f8fafc" />
        <rect x="104" y="14" width="60" height="18" rx="6" fill="#fff4dd" />
        <rect x="104" y="44" width="60" height="12" rx="4" fill="#fffaf0" />
        <path d="M72 23 L104 23" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
        <circle cx="88" cy="23" r="3" fill="#94a3b8" />
      </svg>

      {/* small avatars stack */}
      <div className="absolute left-1/2 -translate-x-1/2 top-6 flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-indigo-600 border-2 border-white shadow-md hover-raise" />
        <div className="w-10 h-10 rounded-full bg-slate-400 border-2 border-white shadow-md hover-raise" />
        <div className="w-10 h-10 rounded-full bg-emerald-400 border-2 border-white shadow-md hover-raise" />
      </div>
    </div>
  );
}
