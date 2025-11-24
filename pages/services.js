import Head from 'next/head';
import Link from 'next/link';

export default function Services() {
  return (
    <>
      <Head>
        <title>PMO Network Services – Connecting PMO Talent with Leading Employers</title>
        <meta name="description" content="PMO Network services for PMO professionals and hiring companies. Free PMO profiles, portfolio evidence, job tracking, AI insights. Employers hire PMO talent with unlimited $1,000/month subscription. PMO jobs, PMO careers, hire PMO professionals, project management, portfolio & programme management." />
        <meta name="keywords" content="PMO jobs, PMO careers, PMO professionals, Hire PMO talent, PMO contractor network, Project management jobs, Portfolio & programme management" />
        <meta property="og:title" content="PMO Network Services – PMO Talent & Hiring Solutions" />
        <meta property="og:description" content="Free for PMO professionals. $1,000/month unlimited hiring subscription for employers. Build profiles, verify talent, manage applications." />
        <meta property="og:image" content="/og-image.png" />
        <link rel="canonical" href="https://www.pmonetwork.example/services" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              name: 'PMO Network Services',
              url: 'https://www.pmonetwork.example/services',
              description: 'Services for PMO professionals (free profiles) and employers ($1,000/month unlimited hires & postings).',
              about: {
                '@type': 'Organization',
                name: 'PMO Network'
              },
              mainEntity: {
                '@type': 'ItemList',
                itemListElement: [
                  { '@type': 'Service', name: 'Professional PMO Profile', description: 'Rich profile showcasing frameworks, tools, certifications.' },
                  { '@type': 'Service', name: 'Application Tracking', description: 'Manage and monitor PMO job applications.' },
                  { '@type': 'Service', name: 'Document Vault', description: 'Secure storage for CVs and supporting documents.' },
                  { '@type': 'Service', name: 'Profile Insights', description: 'Visibility into profile views & engagement.' },
                  { '@type': 'Service', name: 'Personalised Recommendations', description: 'Role matches aligned to skills & goals.' },
                  { '@type': 'Service', name: 'Unlimited Job Postings', description: 'Flat subscription for posting all PMO roles.' },
                  { '@type': 'Service', name: 'Curated Talent Pool', description: 'Verified PMO professionals across seniorities.' },
                  { '@type': 'Service', name: 'Advanced Search & Filters', description: 'Filter by frameworks, certifications, tooling.' },
                  { '@type': 'Service', name: 'Capability Scores & Evidence', description: 'Assess profiles using scoring & portfolio artefacts.' },
                  { '@type': 'Service', name: 'Hiring Pipeline & Analytics', description: 'Monitor velocity and funnel metrics.' }
                ]
              }
            })
          }}
        />
      </Head>

      <main id="main-content" className="bg-white text-slate-800" role="main">
        {/* Hero Section */}
        <section className="border-b border-slate-100 bg-gradient-to-b from-white to-slate-50">
          <div className="max-w-7xl mx-auto px-6 py-14 md:py-20">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">Our Services – Connecting PMO Talent with Leading Employers</h1>
              <p className="text-lg md:text-xl text-slate-600 font-medium">Free for PMO professionals. $1,000/month subscription for hiring companies with unlimited hires and job postings.</p>
            </div>
            <div className="mt-8 flex flex-col md:flex-row gap-6 md:items-center">
              <div className="flex-1 bg-white border rounded-xl shadow p-6 flex items-center justify-center min-h-[200px]" aria-hidden="true">
                <div className="text-center text-slate-400">
                  <div className="w-64 h-40 bg-slate-100 rounded-md mx-auto mb-4" />
                  <div className="font-semibold">Marketplace illustration placeholder</div>
                  <div className="text-sm">Abstract network linking PMO professionals & employers</div>
                </div>
              </div>
              <div className="flex-1 space-y-3 text-sm text-slate-600">
                <p><strong>PMO Network</strong> is the dedicated platform for PMO careers and hiring. Candidates build rich PMO profiles. Employers access verified talent and manage hiring pipelines efficiently.</p>
                <p>We focus on portfolio, programme, project controls and delivery excellence – enabling better matches, faster hiring and stronger outcomes.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Vertical Split Section */}
        <section className="relative">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Candidates Column */}
              <div className="rounded-xl border bg-slate-50/80 backdrop-blur-sm p-8 flex flex-col" aria-labelledby="candidates-heading">
                <h2 id="candidates-heading" className="text-2xl font-bold">For PMO Professionals</h2>
                <p className="mt-2 text-slate-600">Build visibility, credibility and opportunity in one professional PMO space.</p>
                <ul className="mt-6 space-y-4 text-slate-700 list-none">
                  <li className="flex gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-indigo-600" aria-hidden="true" />
                    <div>
                      <h3 className="font-semibold">Professional PMO Profile</h3>
                      <p className="text-sm text-slate-600">Showcase experience, PMO frameworks, tools (Jira, Power BI), certifications and achievements.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-indigo-600" aria-hidden="true" />
                    <div>
                      <h3 className="font-semibold">Application Tracking</h3>
                      <p className="text-sm text-slate-600">Track roles applied for and manage status updates centrally.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-indigo-600" aria-hidden />
                    <div>
                      <h3 className="font-semibold">Document Vault</h3>
                      <p className="text-sm text-slate-600">Store CVs, cover letters, portfolio evidence and project summaries securely.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-indigo-600" aria-hidden />
                    <div>
                      <h3 className="font-semibold">Profile Insights</h3>
                      <p className="text-sm text-slate-600">View who has visited your profile and understand engagement signals.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-indigo-600" aria-hidden />
                    <div>
                      <h3 className="font-semibold">Personalised Recommendations</h3>
                      <p className="text-sm text-slate-600">Receive job matches aligned to skills, frameworks and growth goals.</p>
                    </div>
                  </li>
                </ul>
                <div className="mt-8">
                  <Link href="/auth/register" className="inline-flex items-center px-6 py-3 rounded-md bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Create Your Free Profile</Link>
                </div>
                <div className="mt-8 bg-white border rounded-lg p-5 shadow" aria-hidden="true">
                  <div className="w-full h-48 bg-slate-100 rounded-md" />
                  <p className="mt-3 text-xs text-slate-500">Dashboard mockup placeholder – candidate profile & application tracker.</p>
                </div>
              </div>

              {/* Employers Column */}
              <div className="rounded-xl border bg-slate-100/80 backdrop-blur-sm p-8 flex flex-col" aria-labelledby="employers-heading">
                <h2 id="employers-heading" className="text-2xl font-bold">For Employers & Hiring Companies</h2>
                <p className="mt-2 text-slate-600">Accelerate hiring with verified PMO talent and structured insights.</p>
                <ul className="mt-6 space-y-4 text-slate-700 list-none">
                  <li className="flex gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-indigo-600" aria-hidden />
                    <div>
                      <h3 className="font-semibold">Unlimited Job Postings</h3>
                      <p className="text-sm text-slate-600">$1,000/month subscription – publish roles without cap or hidden fees.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-indigo-600" aria-hidden />
                    <div>
                      <h3 className="font-semibold">Curated PMO Talent Pool</h3>
                      <p className="text-sm text-slate-600">Access verified PMO Analysts, Managers, Leads, Portfolio & Programme specialists.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-indigo-600" aria-hidden />
                    <div>
                      <h3 className="font-semibold">Advanced Search & Filters</h3>
                      <p className="text-sm text-slate-600">Filter by frameworks, certifications, tooling, sector experience and capacity.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-indigo-600" aria-hidden />
                    <div>
                      <h3 className="font-semibold">Profile Scores & Evidence</h3>
                      <p className="text-sm text-slate-600">Review candidate capability scores, portfolio items and delivery artefacts.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-indigo-600" aria-hidden />
                    <div>
                      <h3 className="font-semibold">Efficient Shortlisting</h3>
                      <p className="text-sm text-slate-600">Manage applications, build shortlists, and track conversion metrics.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-indigo-600" aria-hidden />
                    <div>
                      <h3 className="font-semibold">Pipeline & Analytics</h3>
                      <p className="text-sm text-slate-600">Monitor hiring velocity, role performance and candidate funnels.</p>
                    </div>
                  </li>
                </ul>
                <div className="mt-8">
                  <Link href="/employers/subscribe" className="inline-flex items-center px-6 py-3 rounded-md bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Start Your Subscription</Link>
                </div>
                <div className="mt-8 bg-white border rounded-lg p-5 shadow" aria-hidden="true">
                  <div className="w-full h-48 bg-slate-100 rounded-md" />
                  <p className="mt-3 text-xs text-slate-500">Employer dashboard mockup placeholder – role postings & candidate search.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Optional Feature Highlights */}
        <section className="border-t border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-14">
            <h2 className="text-2xl font-bold mb-8">Key Platform Highlights</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-50 border rounded-lg p-5 shadow-sm">
                <h3 className="font-semibold">AI-Powered Profile Scoring</h3>
                <p className="mt-2 text-sm text-slate-600">Evaluate candidate readiness & depth across PMO capabilities.</p>
              </div>
              <div className="bg-slate-50 border rounded-lg p-5 shadow-sm">
                <h3 className="font-semibold">Skills & Competency Filters</h3>
                <p className="mt-2 text-sm text-slate-600">Employers refine searches by frameworks, tooling and domain expertise.</p>
              </div>
              <div className="bg-slate-50 border rounded-lg p-5 shadow-sm">
                <h3 className="font-semibold">Personalised Recommendations</h3>
                <p className="mt-2 text-sm text-slate-600">Candidates discover aligned roles through intelligent matching.</p>
              </div>
              <div className="bg-slate-50 border rounded-lg p-5 shadow-sm">
                <h3 className="font-semibold">Pre-Vetted Candidate Matches</h3>
                <p className="mt-2 text-sm text-slate-600">Employers receive curated shortlists to accelerate hiring decisions.</p>
              </div>
            </div>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/auth/register" className="inline-flex items-center px-6 py-3 rounded-md bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Get Started Free</Link>
              <Link href="/employers/subscribe" className="inline-flex items-center px-6 py-3 rounded-md border border-indigo-600 text-indigo-600 font-semibold hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Start Hiring</Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
