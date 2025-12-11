import Link from 'next/link';

export default function MissingProfileCard({ title, description, href, icon }) {
  return (
    <div className="dash-card missing-card">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        {href && (
          <Link href={href} className="btn-text">Edit</Link>
        )}
      </div>
      <div className="card-content missing-card-content">
        <div className="missing-card-icon">
          {icon || (
            <svg width="36" height="36" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </div>
        <p className="missing-card-desc">{description}</p>
      </div>
      <div className="card-footer">
        {href && (
          <Link href={href} className="btn-primary">Add Now</Link>
        )}
      </div>
      <style jsx>{`
        .missing-card-desc { font-size: 0.875rem; color: #4b5563; line-height: 1.4; }
        .missing-card-icon { display:flex; align-items:center; justify-content:center; width:48px; height:48px; border-radius:12px; background:linear-gradient(135deg,#eef2ff,#e0e7ff); color:#4f46e5; margin-bottom:0.5rem; }
        .missing-card-content { display:flex; flex-direction:column; }
      `}</style>
    </div>
  );
}
