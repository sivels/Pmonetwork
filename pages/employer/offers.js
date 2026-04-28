import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function EmployerOffersPage() {
  const { status } = useSession();
  const router = useRouter();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/employer-login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchOffers();
    }
  }, [status]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/offers/employer');
      if (res.ok) {
        const data = await res.json();
        setOffers(data.offers || []);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusCounts = useMemo(() => {
    const counts = { ALL: offers.length, SENT: 0, ACCEPTED: 0, DECLINED: 0, WITHDRAWN: 0 };
    offers.forEach((offer) => {
      const key = (offer.status || '').toUpperCase();
      if (counts[key] !== undefined) counts[key] += 1;
    });
    return counts;
  }, [offers]);

  const filteredOffers = useMemo(() => {
    if (filter === 'ALL') return offers;
    return offers.filter((offer) => (offer.status || '').toUpperCase() === filter);
  }, [offers, filter]);

  if (status === 'loading' || loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading offers...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Job Offers | PMO Network</title>
      </Head>

      <div className="offers-page">
        <div className="page-header">
          <h1>Job Offers</h1>
          <p>Track sent offers, candidate decisions, and attachments.</p>
        </div>

        <div className="filter-tabs">
          {['ALL', 'SENT', 'ACCEPTED', 'DECLINED', 'WITHDRAWN'].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`filter-tab ${filter === tab ? 'active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab} ({statusCounts[tab] || 0})
            </button>
          ))}
        </div>

        {filteredOffers.length === 0 ? (
          <div className="empty-state">
            <h3>No offers found</h3>
            <p>
              {filter === 'ALL'
                ? 'Send job offers from completed interviews to see them here.'
                : `No offers with status ${filter} yet.`}
            </p>
          </div>
        ) : (
          <div className="offers-grid">
            {filteredOffers.map((offer) => {
              const statusValue = (offer.status || 'SENT').toUpperCase();
              const candidateName = offer.application?.candidate?.user?.fullName || 'Candidate';
              const candidateEmail = offer.application?.candidate?.user?.email || 'Unknown email';
              const jobTitle = offer.application?.job?.title || 'Job role';
              const sentDate = offer.sentAt ? new Date(offer.sentAt).toLocaleString() : 'Unknown';
              const respondedDate = offer.respondedAt ? new Date(offer.respondedAt).toLocaleString() : null;
              const attachments = Array.isArray(offer.attachments) ? offer.attachments : [];

              return (
                <article className="offer-card" key={offer.id}>
                  <div className="offer-top">
                    <div>
                      <h3>{offer.title}</h3>
                      <p className="muted">{jobTitle}</p>
                    </div>
                    <span className={`status-badge ${statusValue.toLowerCase()}`}>{statusValue}</span>
                  </div>

                  <div className="info-grid">
                    <div>
                      <span className="label">Candidate</span>
                      <p>{candidateName}</p>
                      <p className="muted small">{candidateEmail}</p>
                    </div>
                    <div>
                      <span className="label">Compensation</span>
                      <p>{offer.salary || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="label">Proposed start</span>
                      <p>{offer.startDate ? new Date(offer.startDate).toLocaleDateString() : 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="label">Sent</span>
                      <p>{sentDate}</p>
                    </div>
                    <div>
                      <span className="label">Responded</span>
                      <p>{respondedDate || 'Pending'}</p>
                    </div>
                  </div>

                  {offer.message && (
                    <div className="offer-message">
                      <span className="label">Message</span>
                      <p>{offer.message}</p>
                    </div>
                  )}

                  {attachments.length > 0 && (
                    <div className="attachments">
                      <span className="label">Attachments</span>
                      <ul>
                        {attachments.map((file, index) => (
                          <li key={`${offer.id}-${index}`}>
                            <a href={file.url} target="_blank" rel="noreferrer">
                              {file.name || `Attachment ${index + 1}`}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <a
                    className="view-application"
                    href={`/employer/jobs/${offer.application?.jobId}/applications?applicationId=${offer.applicationId}`}
                  >
                    View Application
                  </a>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .offers-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .page-header h1 {
          margin: 0;
          font-size: 2rem;
          color: #111827;
        }

        .page-header p {
          margin: 0.5rem 0 0;
          color: #6b7280;
        }

        .filter-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin: 1.5rem 0;
        }

        .filter-tab {
          border: 1px solid #d1d5db;
          background: #fff;
          color: #374151;
          border-radius: 9999px;
          padding: 0.45rem 0.8rem;
          cursor: pointer;
          font-weight: 600;
        }

        .filter-tab.active {
          background: #4f46e5;
          border-color: #4f46e5;
          color: #fff;
        }

        .offers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1rem;
        }

        .offer-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fff;
          padding: 1rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }

        .offer-top {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 0.75rem;
        }

        .offer-top h3 {
          margin: 0;
          font-size: 1rem;
          color: #111827;
        }

        .muted {
          color: #6b7280;
          margin: 0.25rem 0 0;
        }

        .small {
          font-size: 0.82rem;
        }

        .status-badge {
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.3rem 0.6rem;
          border: 1px solid transparent;
          white-space: nowrap;
        }

        .status-badge.sent {
          background: #fef3c7;
          color: #92400e;
          border-color: #fcd34d;
        }

        .status-badge.accepted {
          background: #dcfce7;
          color: #166534;
          border-color: #86efac;
        }

        .status-badge.declined {
          background: #fee2e2;
          color: #991b1b;
          border-color: #fca5a5;
        }

        .status-badge.withdrawn {
          background: #e5e7eb;
          color: #374151;
          border-color: #d1d5db;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
        }

        .label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin-bottom: 0.2rem;
        }

        .info-grid p,
        .offer-message p {
          margin: 0;
          color: #111827;
        }

        .offer-message p {
          white-space: pre-wrap;
          line-height: 1.45;
        }

        .attachments ul {
          margin: 0;
          padding-left: 1rem;
        }

        .attachments a {
          color: #1d4ed8;
          text-decoration: none;
        }

        .attachments a:hover {
          text-decoration: underline;
        }

        .view-application {
          display: inline-flex;
          align-self: flex-start;
          text-decoration: none;
          color: #4f46e5;
          border: 1px solid #c7d2fe;
          background: #eef2ff;
          border-radius: 8px;
          padding: 0.5rem 0.85rem;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .empty-state {
          border: 1px dashed #d1d5db;
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          color: #6b7280;
          background: #fff;
        }

        .empty-state h3 {
          margin: 0 0 0.4rem;
          color: #111827;
        }

        .loading-container {
          min-height: 320px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
        }

        .spinner {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid #e5e7eb;
          border-top-color: #4f46e5;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .offers-page {
            padding: 1rem;
          }

          .offers-grid {
            grid-template-columns: 1fr;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
