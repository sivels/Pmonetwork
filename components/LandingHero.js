import Link from 'next/link';

export default function LandingHero() {
  return (
    <section className="landing-hero">
      <div className="hero-content">
        <img src="/logo.svg" alt="PMO Network Logo" className="hero-logo" />
        <h1>PMO Network</h1>
        <h2>Connect. Discover. Get Hired.</h2>
        <p className="hero-desc">
          The professional network for project managers, employers, and top candidates. Showcase your skills, build your profile, and find your next opportunity.
        </p>
        <div className="hero-actions">
          <Link href="/auth/register" className="btn btn-primary">Join Now</Link>
          <Link href="/auth/login" className="btn btn-secondary">Sign In</Link>
        </div>
      </div>
      <div className="hero-features">
        <div>
          <h3>For Candidates</h3>
          <ul>
            <li>Build a rich profile with CV, video, and certifications</li>
            <li>Get discovered by top employers</li>
            <li>Track applications and documents</li>
          </ul>
        </div>
        <div>
          <h3>For Employers</h3>
          <ul>
            <li>Search and shortlist top PM talent</li>
            <li>Share contracts and request e-signatures</li>
            <li>Contact candidates directly</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
