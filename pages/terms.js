import Head from 'next/head';

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service – PMO Network</title>
        <meta name="description" content="PMO Network Terms of Service covering platform use, user responsibilities, subscriptions and acceptable conduct." />
        <link rel="canonical" href="https://www.pmonetwork.example/terms" />
      </Head>
      <section className="max-w-3xl mx-auto px-6 py-14">
          <h1 className="text-3xl font-extrabold mb-6">Terms of Service</h1>
          <p className="text-slate-600 mb-4">These Terms of Service ("Terms") govern your use of the PMO Network platform. By accessing or using the site you agree to be bound by these Terms.</p>
          <h2 className="text-xl font-semibold mt-8 mb-2">1. Use of the Platform</h2>
          <p className="text-slate-600">You agree to use PMO Network only for lawful purposes related to professional PMO recruitment and career development.</p>
          <h2 className="text-xl font-semibold mt-8 mb-2">2. Candidate Accounts</h2>
          <p className="text-slate-600">Candidates must provide accurate profile information and maintain the confidentiality of login credentials.</p>
          <h2 className="text-xl font-semibold mt-8 mb-2">3. Employer Subscriptions</h2>
          <p className="text-slate-600">Employer access is subscription-based ($1,000/month) and renews automatically unless cancelled before the next billing cycle.</p>
          <h2 className="text-xl font-semibold mt-8 mb-2">4. Content & Accuracy</h2>
          <p className="text-slate-600">You are responsible for the accuracy of information you submit. PMO Network may remove false or misleading content.</p>
          <h2 className="text-xl font-semibold mt-8 mb-2">5. Intellectual Property</h2>
          <p className="text-slate-600">All platform features, branding and compiled data are the property of PMO Network.</p>
          <h2 className="text-xl font-semibold mt-8 mb-2">6. Termination</h2>
          <p className="text-slate-600">We reserve the right to suspend or terminate accounts that violate these Terms.</p>
          <h2 className="text-xl font-semibold mt-8 mb-2">7. Liability</h2>
          <p className="text-slate-600">The platform is provided “as is” without warranties. PMO Network is not liable for hiring outcomes or third-party actions.</p>
          <h2 className="text-xl font-semibold mt-8 mb-2">8. Changes</h2>
          <p className="text-slate-600">We may update these Terms periodically. Continued use constitutes acceptance of changes.</p>
          <p className="mt-8 text-sm text-slate-500">Last updated: Placeholder date.</p>
        </section>
    </>
  );
}
