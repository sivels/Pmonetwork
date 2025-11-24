import Head from 'next/head';

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy – PMO Network</title>
        <meta name="description" content="PMO Network Privacy Policy detailing data collection, usage, security, retention and user rights (GDPR-ready)." />
        <link rel="canonical" href="https://www.pmonetwork.example/privacy" />
      </Head>
      <section className="max-w-3xl mx-auto px-6 py-14">
          <h1 className="text-3xl font-extrabold mb-6">Privacy Policy</h1>
          <p className="text-slate-600 mb-4">This Privacy Policy explains how PMO Network collects, uses, stores and protects personal data for candidates and employers.</p>
          <h2 className="text-xl font-semibold mt-8 mb-2">1. Data Collected</h2>
          <p className="text-slate-600">We collect profile details, application data, employer subscription data, usage analytics and optional documents you upload.</p>
          <h2 className="text-xl font-semibold mt-8 mb-2">2. Legal Basis</h2>
          <p className="text-slate-600">Processing is based on consent (profile creation), contract (subscription), and legitimate interest (platform improvement).</p>
          <h2 className="text-xl font-semibold mt-8 mb-2">3. Data Usage</h2>
          <p className="text-slate-600">Information is used for matching, recommendations, verification, analytics and customer support.</p>
          <h2 className="text-xl font-semibold mt-8 mb-2">4. Security</h2>
          <p className="text-slate-600">We apply encryption, access controls and logging to protect data against unauthorized access.</p>
          <h2 className="text-xl font-semibold mt-8 mb-2">5. Retention</h2>
          <p className="text-slate-600">Data is retained while your account is active or as required for legal obligations, then securely deleted or anonymized.</p>
          <h2 className="text-xl font-semibold mt-8 mb-2">6. Rights</h2>
          <p className="text-slate-600">You may request access, correction, deletion, restriction or portability of your personal data at any time.</p>
          <h2 className="text-xl font-semibold mt-8 mb-2">7. Third Parties</h2>
          <p className="text-slate-600">We may use trusted processors for hosting, email and analytics. They act under contractual safeguards.</p>
          <h2 className="text-xl font-semibold mt-8 mb-2">8. Cookies</h2>
          <p className="text-slate-600">Essential cookies power authentication; optional analytics cookies help improve user experience.</p>
          <h2 className="text-xl font-semibold mt-8 mb-2">9. Contact</h2>
          <p className="text-slate-600">For privacy requests contact: privacy@pmonetwork.example</p>
          <p className="mt-8 text-sm text-slate-500">Last updated: Placeholder date.</p>
        </section>
    </>
  );
}
