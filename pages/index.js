import Head from 'next/head';
import Link from 'next/link';
import LandingGraphics from '../components/LandingGraphics';

export default function Home() {
  return (
    <>
      <Head>
        <title>The PMO Network – The Leading Platform for PMO Jobs, Contractors & Project Delivery Talent</title>
        <meta name="description" content="PMO Network connects PMO professionals, contractors and employers hiring project delivery talent. Find PMO jobs, create a PMO-specific profile, or hire verified PMO professionals with skill-scored profiles." />
        <meta name="keywords" content="PMO jobs, PMO careers, PMO contractors, project management roles, portfolio & programme management, hire PMO professionals, PMO recruitment, PMO talent network" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://www.pmonetwork.example/" />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#1976d2" />
        <meta property="og:title" content="The PMO Network – The Leading Platform for PMO Jobs, Contractors & Project Delivery Talent" />
        <meta property="og:description" content="PMO Network connects PMO professionals, contractors and employers hiring project delivery talent. Find PMO jobs, create a PMO-specific profile, or hire verified PMO professionals with skill-scored profiles." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.pmonetwork.example/" />
        <meta property="og:image" content="https://www.pmonetwork.example/og-image.png" />
        <meta property="og:site_name" content="PMO Network" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@pmonetwork" />
        <meta name="twitter:title" content="The PMO Network – The Leading Platform for PMO Jobs, Contractors & Project Delivery Talent" />
        <meta name="twitter:description" content="PMO Network connects PMO professionals, contractors and employers hiring project delivery talent. Find PMO jobs, create a PMO-specific profile, or hire verified PMO professionals with skill-scored profiles." />
        <meta name="twitter:image" content="https://www.pmonetwork.example/og-image.png" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "PMO Network",
          "url": "https://www.pmonetwork.example/",
          "logo": "/logo.svg",
          "description": "A trusted professional network for PMO and project delivery specialists — find jobs, join as a contractor, or hire verified PMO talent."
        }) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "PMO Network",
          "url": "https://www.pmonetwork.example/",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://www.pmonetwork.example/jobs?query={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://www.pmonetwork.example/"
            }
          ]
        }) }} />
      </Head>

      <main className="min-h-screen bg-white text-slate-800">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50">
          <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">The PMO Network – The Leading Platform for PMO Jobs, Contractors & Project Delivery Talent.</h1>
                <p className="mt-6 text-lg text-slate-600 max-w-2xl">Join a professional network focused on project management roles and portfolio delivery. Build an expert PMO profile, get matched to the right roles, and connect with employers who understand PMO.</p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/jobs" className="inline-flex items-center justify-center px-5 py-3 rounded-md bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700">Find PMO Jobs</Link>
                  <Link href="/auth/register" className="inline-flex items-center justify-center px-5 py-3 rounded-md border border-indigo-600 text-indigo-600 font-medium hover:bg-indigo-50">Join as a PMO Professional</Link>
                  <Link href="/employers/post-job" className="inline-flex items-center justify-center px-5 py-3 rounded-md bg-slate-100 text-slate-800 font-medium hover:bg-slate-200">Hire PMO Talent</Link>
                </div>

                <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
                  <li>Expert PMO profiles and verified skills</li>
                  <li>AI-powered skills assessment & profile score</li>
                  <li>Streamlined hiring and compliance tools</li>
                  <li>Private document vault for CVs & certificates</li>
                </ul>
              </div>

              <div className="order-first lg:order-last relative">
                <LandingGraphics className="hidden lg:block" />
                <div className="shadow-lg rounded-xl overflow-hidden border border-slate-100 relative z-10">
                  <div className="bg-white p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-slate-500">Profile Score</p>
                        <h3 className="mt-1 text-xl font-semibold">Jane R. — PMO Manager</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Score</div>
                        <div className="text-2xl font-bold text-indigo-600">87</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-indigo-600 rounded-full" style={{ width: '87%' }} />
                      </div>
                      <div className="mt-3 text-sm text-slate-600">AI-powered PMO skills assessment and profile health insights help employers find the right talent faster.</div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 p-4 bg-slate-50">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-slate-400"><rect width="24" height="24" rx="6" fill="#EEF2FF"></rect></svg>
                        <div>
                          <div className="font-semibold">Project Delivery Portfolio</div>
                          <div className="text-slate-500">3 projects • 12 deliverables</div>
                        </div>
                      </div>
                      <div className="text-indigo-600 font-medium">View profile</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEO Intro Section */}
        <section className="border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6 py-12">
            <h2 className="text-2xl font-bold">PMO Careers, Contractors & Project Delivery Talent</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">PMO Network is built for PMO professionals, contractors and hiring teams focused on project and portfolio delivery. Whether you're a PMO Analyst seeking your next contract, a Programme Manager looking for a senior role, or an employer needing verified PMO talent, our platform connects you to relevant opportunities, sector-specific insights, and compliant onboarding tools that reduce time-to-hire.</p>
          </div>
        </section>

        {/* Key USP Section */}
        <section className="bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold">For Candidates</h3>
              <ul className="mt-4 space-y-3 text-slate-600">
                <li>Build a PMO-specific profile with CV, certifications and portfolio</li>
                <li>AI-powered PMO skills assessment and profile health score</li>
                <li>Track roles applied for and manage applications in one place</li>
                <li>Secure document repository for CVs, certificates and contracts</li>
                <li>See who viewed your profile and get targeted career insights</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold">For Employers</h3>
              <ul className="mt-4 space-y-3 text-slate-600">
                <li>Access top PMO specialists and shortlists curated by skill</li>
                <li>Faster talent acquisition with automated job-matching</li>
                <li>Verified, skill-scored profiles and compliance-ready onboarding</li>
                <li>Search by frameworks: Agile, Waterfall, SAFe, Lean</li>
                <li>Integrated messaging, interview scheduling and offer flows</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold">PMO Network Features</h2>
          <p className="mt-3 text-slate-600">Tools and insights designed for PMO and project delivery professionals.</p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <article className="p-6 border rounded-lg bg-white">
              <h4 className="font-semibold">Candidate Dashboard</h4>
              <p className="mt-2 text-sm text-slate-600">A central view of your profile score, active applications, and recent profile views.</p>
            </article>

            <article className="p-6 border rounded-lg bg-white">
              <h4 className="font-semibold">Profile Score</h4>
              <p className="mt-2 text-sm text-slate-600">AI-driven insights show employers how your PMO experience maps to roles they need to fill.</p>
            </article>

            <article className="p-6 border rounded-lg bg-white">
              <h4 className="font-semibold">PMO Skills Matrix</h4>
              <p className="mt-2 text-sm text-slate-600">Visual skills mapping across frameworks, tools and delivery capabilities.</p>
            </article>

            <article className="p-6 border rounded-lg bg-white">
              <h4 className="font-semibold">Project Delivery Portfolio</h4>
              <p className="mt-2 text-sm text-slate-600">Showcase projects, outcomes, and delivery metrics employers care about.</p>
            </article>

            <article className="p-6 border rounded-lg bg-white">
              <h4 className="font-semibold">Personality & Working Style</h4>
              <p className="mt-2 text-sm text-slate-600">Optional insights into collaboration preferences and leadership style.</p>
            </article>

            <article className="p-6 border rounded-lg bg-white">
              <h4 className="font-semibold">Automated Job Matching</h4>
              <p className="mt-2 text-sm text-slate-600">Receive personalised job matches based on your skills, availability and preferences.</p>
            </article>

            <article className="p-6 border rounded-lg bg-white">
              <h4 className="font-semibold">Document Vault</h4>
              <p className="mt-2 text-sm text-slate-600">Securely store CVs, certificates and contracts with role-based access controls.</p>
            </article>
          </div>
        </section>

        {/* Job Categories Grid */}
        <section className="bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h2 className="text-2xl font-bold">PMO Job Categories</h2>
            <p className="mt-2 text-slate-600">Explore roles across PMO and project delivery.</p>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[
                'PMO Analyst jobs',
                'PMO Manager jobs',
                'Portfolio Manager jobs',
                'Project Manager jobs',
                'Programme Manager jobs',
                'PSO roles',
                'Change & transformation jobs',
                'Business Analyst roles'
              ].map((c) => (
                <Link key={c} href={`/jobs?category=${encodeURIComponent(c)}`} className="block p-4 bg-white border rounded-lg hover:shadow-sm">
                  <div className="font-medium">{c}</div>
                  <div className="text-sm text-slate-500 mt-1">Browse {c.split(' ')[0]} opportunities</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold">Before & After: Solving PMO Hiring Problems</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 border rounded-lg bg-white">
              <h3 className="font-semibold">Candidates: Before</h3>
              <ul className="mt-3 text-slate-600 space-y-2">
                <li>Struggling to stand out on generic job boards</li>
                <li>Difficulty proving PMO-specific skills</li>
                <li>No central place for CVs, certificates, and portfolio</li>
              </ul>
              <h3 className="mt-6 font-semibold">After</h3>
              <ul className="mt-3 text-slate-600 space-y-2">
                <li>Dedicated PMO profile with skill score and portfolio</li>
                <li>Automated job matches and clear career insights</li>
                <li>Secure document vault and application tracking</li>
              </ul>
            </div>

            <div className="p-6 border rounded-lg bg-white">
              <h3 className="font-semibold">Employers: Before</h3>
              <ul className="mt-3 text-slate-600 space-y-2">
                <li>Long time-to-hire and poor match quality</li>
                <li>Lack of verified skills and delivery evidence</li>
                <li>High volume of irrelevant applicants from generic boards</li>
              </ul>
              <h3 className="mt-6 font-semibold">After</h3>
              <ul className="mt-3 text-slate-600 space-y-2">
                <li>Shortlisted, skill-scored candidates delivered faster</li>
                <li>Search by frameworks and verified delivery experience</li>
                <li>Integrated compliance and onboarding workflows</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h2 className="text-2xl font-bold">Trusted by Project Teams Across the UK & EU</h2>
            <div className="mt-6 flex flex-wrap items-center gap-6">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="w-24 h-12 bg-white border rounded flex items-center justify-center text-slate-400">Logo</div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <blockquote className="p-6 bg-white border rounded">
                <p className="text-slate-700">"PMO Network helped me move from analyst to PMO Manager — the profile score surfaced opportunities I would've missed."</p>
                <footer className="mt-4 text-sm text-slate-500">— Alex P., PMO Manager</footer>
              </blockquote>

              <blockquote className="p-6 bg-white border rounded">
                <p className="text-slate-700">"We hired two senior Programme Managers in under three weeks using targeted matches and verified profiles."</p>
                <footer className="mt-4 text-sm text-slate-500">— Sarah K., Head of Delivery</footer>
              </blockquote>

              <blockquote className="p-6 bg-white border rounded">
                <p className="text-slate-700">"The document vault and compliance tools saved our onboarding team days of paperwork."</p>
                <footer className="mt-4 text-sm text-slate-500">— Liam R., HR & Talent</footer>
              </blockquote>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="rounded-lg bg-indigo-600 text-white p-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Ready to advance your PMO career or hire experienced PMO talent?</h2>
              <p className="mt-2 text-indigo-100">Create your profile or post a job and get matched with skilled PMO professionals today.</p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <Link href="/auth/register" className="inline-flex items-center justify-center px-5 py-3 rounded-md bg-white text-indigo-600 font-semibold">Create Your PMO Profile</Link>
              <Link href="/employers/post-job" className="inline-flex items-center justify-center px-5 py-3 rounded-md border border-white text-white font-medium">Post a PMO Job</Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
