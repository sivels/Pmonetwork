import Head from 'next/head';
import { useState, useRef } from 'react';

const faqs = [
  {
    q: 'Is PMO Network free for candidates?',
    a: 'Yes, creating a profile, applying for jobs, and accessing your dashboard is completely free for PMO professionals.'
  },
  {
    q: 'How much does it cost for employers?',
    a: 'Employers pay a subscription of $1,000 per month for unlimited job postings and access to all candidate profiles.'
  },
  {
    q: 'Can I apply to multiple jobs at once?',
    a: 'Yes, candidates can apply to as many roles as they like using their PMO Network profile.'
  },
  {
    q: 'How are candidate profiles verified?',
    a: 'All candidates go through a verification process, including reviewing work experience and PMO skills to ensure quality.'
  },
  {
    q: 'What types of roles are available on PMO Network?',
    a: 'We feature PMO Analyst, PMO Manager, Portfolio Manager, Programme Manager, Project Support Officer, and other PMO-related roles.'
  },
  {
    q: 'Can employers search for candidates by specific skills or frameworks?',
    a: 'Yes, employers can filter candidates by PMO frameworks, methodologies, certifications, experience level, and tools expertise.'
  },
  {
    q: 'Is my personal information secure?',
    a: 'Absolutely. PMO Network uses secure servers and encryption to keep all candidate and employer information safe.'
  },
  {
    q: 'Can I edit my profile after creating it?',
    a: 'Yes, candidates can update their profile, CV, and documents anytime to keep their information current.'
  },
  {
    q: 'What support is available if I encounter issues?',
    a: 'Both candidates and employers have access to our support team via email and live chat for any questions or technical assistance.'
  },
  {
    q: 'Can I cancel my employer subscription?',
    a: 'Yes, employer subscriptions can be canceled at any time. Access remains active until the end of the billing cycle.'
  }
];

function FaqItem({ index, q, a }) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef(null);
  const id = `faq-panel-${index}`;

  const toggle = () => setOpen(o => !o);

  // dynamic height for smooth animation
  const height = open && contentRef.current ? contentRef.current.scrollHeight : 0;

  return (
    <div className="border border-slate-200 rounded-lg mb-4 bg-white shadow-sm" key={index}>
      <h2 className="m-0">
        <button
          onClick={toggle}
          aria-expanded={open}
          aria-controls={id}
          className="w-full text-left flex items-center gap-4 px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600" aria-hidden="true">
            {open ? (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /></svg>
            ) : (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            )}
          </span>
          <span className="font-semibold text-slate-800 text-base md:text-lg">
            {q}
          </span>
        </button>
      </h2>
      <div
        id={id}
        role="region"
        aria-labelledby={id + '-label'}
        style={{ height, transition: 'height 260ms cubic-bezier(.25,.9,.3,1)', overflow: 'hidden' }}
      >
        <div ref={contentRef} className="px-5 pb-5 pt-0 text-slate-600 text-sm leading-relaxed">
          {a}
        </div>
      </div>
    </div>
  );
}

export default function FAQPage() {
  return (
    <>
      <Head>
        <title>FAQ – PMO Network</title>
        <meta name="description" content="Frequently asked questions about PMO Network: pricing, PMO jobs, candidate profiles, employer subscriptions, verification, security and support." />
        <meta name="keywords" content="PMO Network FAQ, PMO jobs, PMO careers, PMO professionals, Hire PMO talent, PMO contractor network" />
        <link rel="canonical" href="https://www.pmonetwork.example/faq" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map(f => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a }
              }))
            })
          }}
        />
      </Head>
      <section className="max-w-4xl mx-auto px-6 py-14">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-8">FAQ</h1>
        <p className="text-slate-600 mb-10 max-w-2xl">Answers to common questions about PMO Network’s platform, candidate features, employer subscriptions, verified profiles, security and support. Explore how we help PMO professionals advance their careers and employers hire top PMO talent.</p>
        <div>
          {faqs.map((f, i) => (
            <FaqItem key={i} index={i} q={f.q} a={f.a} />
          ))}
        </div>
      </section>
    </>
  );
}
