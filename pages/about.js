import Head from 'next/head';
import Link from 'next/link';

export default function About() {
  return (
    <>
      <Head>
        <title>About PMO Network — Empowering PMO Careers & Project Delivery Teams</title>
        <meta name="description" content="PMO Network is the trusted PMO recruitment platform connecting PMO professionals with employers. Discover PMO jobs, create a PMO-specific profile, and hire portfolio & programme management talent." />
        <meta name="keywords" content="PMO Network, PMO jobs, PMO careers, Project delivery professionals, PMO analysts, PMO managers, Portfolio & programme management talent, Hire PMO professionals, PMO recruitment platform, Project management jobs" />
        <meta property="og:title" content="About PMO Network — Empowering the PMO Community" />
        <meta property="og:description" content="PMO Network connects top PMO professionals with organisations that depend on disciplined delivery and governance. Find jobs or hire verified PMO talent." />
        <meta property="og:image" content="/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://www.pmonetwork.example/about" />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "About — PMO Network",
          "url": "https://www.pmonetwork.example/about",
          "description": "PMO Network connects PMO professionals with employers seeking portfolio & programme management talent. Find PMO jobs, create a skills-focused PMO profile, or hire verified PMO professionals.",
          "publisher": {
            "@type": "Organization",
            "name": "PMO Network",
            "logo": {
              "@type": "ImageObject",
              "url": "/logo.svg"
            }
          }
        }) }} />
      </Head>

      <main className="bg-white text-slate-800">
        {/* Hero Introduction */}
        <section className="bg-gradient-to-b from-white to-slate-50">
          <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">Empowering the PMO Community. Connecting Talent, Opportunity & Excellence.</h1>
                <p className="mt-4 text-lg text-slate-600">PMO Network is the leading platform built exclusively for PMO, Project Delivery, and Project Controls professionals. We connect the best talent with the organisations shaping tomorrow’s programmes, portfolios, and transformation initiatives.</p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/auth/register" className="inline-flex items-center px-5 py-3 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700">Join the Network</Link>
                  <Link href="/jobs" className="inline-flex items-center px-5 py-3 rounded-md border border-indigo-600 text-indigo-600 font-medium hover:bg-indigo-50">Explore PMO Talent</Link>
                  <Link href="/employers/post-job" className="inline-flex items-center px-5 py-3 rounded-md bg-slate-100 text-slate-800 font-medium hover:bg-slate-200">Post a PMO Role</Link>
                </div>

                <p className="mt-6 text-sm text-slate-500">Keywords: PMO Network • PMO jobs • PMO careers • Project delivery professionals • PMO recruitment platform</p>
              </div>

              <div aria-hidden className="w-full">
                <div className="bg-white border rounded-xl shadow p-6 flex items-center justify-center" style={{ minHeight: 260 }}>
                  <div className="text-center text-slate-400">
                    <div className="w-56 h-36 bg-slate-100 rounded-md mx-auto mb-4" />
                    <div className="font-semibold">Hero image placeholder</div>
                    <div className="text-sm">Diverse PMO professionals collaborating in a modern project office (placeholder)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Mission */}
        <section className="border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6 py-12">
            <h2 className="text-2xl font-bold">Our Mission: Elevate the PMO Profession.</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">PMO Network exists to professionalise and champion the world of Project, Programme, and Portfolio Management. Our mission is to create a space where PMO professionals can showcase their skills, grow their careers, and connect with organisations that value structured delivery, strategic oversight, and operational excellence.</p>
            <p className="mt-3 text-slate-600">We enable businesses to find the right talent faster — individuals who bring discipline, clarity, and measurable value to complex programmes.</p>

            <div className="mt-6 bg-slate-50 border rounded-lg p-6">
              <div className="w-full h-40 bg-slate-100 rounded-md" />
              <div className="mt-3 text-sm text-slate-500">Abstract illustration placeholder: mission-driven teamwork or strategic planning.</div>
            </div>
          </div>
        </section>

        {/* Why We Exist */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold">The PMO Space Deserves Better.</h2>
          <p className="mt-4 text-slate-600">The PMO profession has long been underserved by generic job boards and outdated recruitment processes. Candidates struggle to stand out, while employers struggle to identify genuine PMO capability.</p>
          <p className="mt-3 text-slate-600">PMO Network changes that. We bring structure, clarity, and relevance back to PMO and Project Delivery hiring — so professionals are fairly represented and organisations find the right talent, faster.</p>
        </section>

        {/* What We Offer Candidates */}
        <section className="bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold">Built for PMO Professionals, Analysts, Managers & Leaders.</h3>
              <ul className="mt-4 space-y-3 text-slate-600 list-disc list-inside">
                <li>A PMO-specific professional profile, tailored to competencies, delivery frameworks, and career pathways.</li>
                <li>AI-powered profile health score evaluating readiness, capability, and market strength.</li>
                <li>Showcase your project portfolio, tools expertise (e.g., Jira, Power BI), and delivery methods (Agile, Waterfall, SAFe).</li>
                <li>Track roles you’ve applied for and manage applications from one dashboard.</li>
                <li>See who has viewed your profile and which companies follow your updates.</li>
                <li>Document vault for CVs, cover letters, and project evidence.</li>
                <li>Career insights and PMO trend updates tailored to your skill level.</li>
                <li>A professional home where your PMO identity is understood and celebrated.</li>
              </ul>
            </div>

            <div>
              <div className="bg-white border rounded-lg p-6 shadow">
                <div className="w-full h-52 bg-slate-100 rounded-md" />
                <div className="mt-3 text-sm text-slate-500">Dashboard-style screenshot mockup placeholder: candidate profile.</div>
              </div>
            </div>
          </div>
        </section>

        {/* What We Offer Employers */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <h3 className="text-xl font-semibold">Hire Verified PMO & Project Delivery Talent with Confidence.</h3>
              <ul className="mt-4 space-y-3 text-slate-600 list-disc list-inside">
                <li>Access a curated network of PMO Analysts, Managers, Portfolio Specialists, PMO Leads, PSOs, PMs, and Change professionals.</li>
                <li>Advanced search filters by methodology, tools, sector experience, seniority, and delivery specialism.</li>
                <li>Verified profiles and capability scoring for faster shortlisting.</li>
                <li>Streamlined role posting with automated matching to top talent.</li>
                <li>Transparent insights on candidate strengths, availability, and working preferences.</li>
                <li>Better quality hires for strategic programme delivery, transformation, governance, and controls.</li>
              </ul>
            </div>

            <div>
              <div className="bg-white border rounded-lg p-6 shadow">
                <div className="w-full h-48 bg-slate-100 rounded-md" />
                <div className="mt-3 text-sm text-slate-500">Employer dashboard placeholder: talent search interface.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="bg-slate-50 border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6 py-12">
            <h2 className="text-2xl font-bold">Driven by Quality, Community & Integrity.</h2>
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-600">
              <li><strong>Professionalism:</strong> We raise the standards of PMO representation online.</li>
              <li><strong>Transparency:</strong> Honest profiles. Honest hiring.</li>
              <li><strong>Community-first:</strong> A platform built with PMO professionals, not around them.</li>
              <li><strong>Impact:</strong> We help organisations deliver change that matters.</li>
            </ul>

            <div className="mt-6 bg-white border rounded-lg p-6">
              <div className="w-full h-40 bg-slate-100 rounded-md" />
              <div className="mt-3 text-sm text-slate-500">Values-themed workplace photography placeholder.</div>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold">Founded by PMO Experts, Built for the PMO Community.</h2>
          <p className="mt-4 text-slate-600">PMO Network was created by seasoned PMO and Transformation professionals who understand the gaps in the industry. We saw organisations struggling to recruit effectively — and talented professionals getting lost in one-size-fits-all job boards.</p>
          <p className="mt-3 text-slate-600">So we built a platform that speaks the language of PMOs: methods, governance, reporting, tooling, planning, resourcing, RAID management, assurance, and delivery capability. This is a community designed to elevate careers, strengthen organisations, and move the industry forward.</p>
        </section>

        {/* Our Vision */}
        <section className="bg-slate-50 border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6 py-12">
            <h2 className="text-2xl font-bold">Creating the World's Most Trusted PMO Talent Ecosystem.</h2>
            <p className="mt-4 text-slate-600">Our long-term vision is to become the global hub for PMO capability:</p>
            <ul className="mt-3 list-disc list-inside text-slate-600 space-y-2">
              <li>training pathways</li>
              <li>digital credentials</li>
              <li>verified portfolios</li>
              <li>advanced skills assessments</li>
              <li>community knowledge sharing</li>
              <li>PMO events & networking</li>
              <li>mentoring & career guidance</li>
            </ul>
            <p className="mt-4 text-slate-600">PMO Network is not just a platform — it’s the future of PMO talent.</p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="rounded-lg bg-indigo-600 text-white p-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Join the Network Shaping the Future of PMO.</h2>
              <p className="mt-2 text-indigo-100">Whether you’re building your PMO career or hiring delivery talent, PMO Network makes the journey clearer and faster.</p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <Link href="/auth/register" className="inline-flex items-center px-4 py-2 rounded-md bg-white text-indigo-600 font-semibold">Create Your Profile</Link>
              <Link href="/jobs" className="inline-flex items-center px-4 py-2 rounded-md border border-white text-white font-medium">Explore PMO Talent</Link>
              <Link href="/contact" className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-700 text-white font-medium">Contact Us</Link>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-slate-500">Image placeholder: Community/network illustration showing connection and collaboration.</div>
        </section>
      </main>
    </>
  );
}
