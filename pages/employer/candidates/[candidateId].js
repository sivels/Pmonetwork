import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ChevronLeft, Loader2, MapPin, Briefcase, Calendar, Award, X, Send } from 'lucide-react';
import { prisma } from '../../../lib/prisma';

function parseMbtiInsight(candidate) {
  if (!candidate?.personalityType || !candidate?.personalityDesc) return null;
  try {
    const parsed = JSON.parse(candidate.personalityDesc);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.visibleToEmployers) return null;
    return {
      type: candidate.personalityType,
      completedAt: parsed.completedAt || null,
      pairScores: Array.isArray(parsed.pairScores) ? parsed.pairScores : [],
    };
  } catch {
    return null;
  }
}

export default function CandidateDetailPage({ candidate }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const mbtiInsight = parseMbtiInsight(candidate);

  const defaultMessage = `Hi ${candidate?.fullName?.split(' ')[0] || 'there'},

I've reviewed your profile on PMO Network and I'm impressed with your experience and skills. I would like to discuss a potential opportunity with you that I think would be a great fit.

Would you be available for a brief conversation to explore this further?

Best regards`;

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'EMPLOYER') {
      router.push('/employer-login');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (showMessageModal) {
      setMessage(defaultMessage);
    }
  }, [showMessageModal]);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setSending(true);
    setError('');

    try {
      // Get employer profile ID
      const profileRes = await fetch('/api/user/profile');
      const profileData = await profileRes.json();
      
      if (!profileData.employerProfile?.id) {
        throw new Error('Employer profile not found');
      }

      // First, create or get conversation
      const convRes = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          employerId: profileData.employerProfile.id
        })
      });

      if (!convRes.ok) {
        throw new Error('Failed to create conversation');
      }

      const conversation = await convRes.json();

      // Send the message
      const msgRes = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderUserId: session.user.id,
          receiverUserId: candidate.userId,
          text: message
        })
      });

      if (!msgRes.ok) {
        throw new Error('Failed to send message');
      }

      // Close modal and redirect to messages
      setShowMessageModal(false);
      router.push('/employer/messages');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (status === 'loading' || !candidate) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/employer/search-candidates"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Search
        </Link>

        {/* Header */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-6">
            <img
              src={candidate.profilePhotoUrl || '/avatar-placeholder.png'}
              alt={candidate.fullName}
              className="h-24 w-24 rounded-full object-cover"
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{candidate.fullName}</h1>
              <p className="mt-1 text-lg text-gray-600">{candidate.jobTitle}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                {candidate.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {candidate.location}
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={() => setShowMessageModal(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Contact Candidate
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Main Content - Left */}
          <div className="space-y-6 lg:col-span-2">
            {/* Summary */}
            {candidate.summary && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">Professional Summary</h2>
                <p className="text-sm text-gray-700 leading-relaxed">{candidate.summary}</p>
              </div>
            )}

            {/* Experience */}
            {candidate.experiences && candidate.experiences.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Work Experience</h2>
                <div className="space-y-4">
                  {candidate.experiences.map((exp, idx) => (
                    <div key={idx} className="border-l-2 border-blue-500 pl-4">
                      <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                      <p className="text-sm text-gray-600">{exp.company}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(exp.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                        {' - '}
                        {exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Present'}
                      </p>
                      {exp.description && (
                        <p className="mt-2 text-sm text-gray-700">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {candidate.education && candidate.education.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Education</h2>
                <div className="space-y-3">
                  {candidate.education.map((edu, idx) => (
                    <div key={idx}>
                      <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                      <p className="text-sm text-gray-600">{edu.institution}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(edu.startYear, 0).getFullYear()}
                        {edu.endYear && ` - ${new Date(edu.endYear, 0).getFullYear()}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Right */}
          <div className="space-y-6">
            {/* Skills */}
            {candidate.skills && candidate.skills.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {candidate.certifications && candidate.certifications.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Certifications
                </h2>
                <div className="space-y-2">
                  {candidate.certifications.map((cert, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="font-medium text-gray-900">{cert.name}</div>
                      <div className="text-xs text-gray-500">{cert.issuer}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Facts */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Quick Facts</h2>
              <div className="space-y-3 text-sm">
                {candidate.availability && (
                  <div>
                    <span className="font-medium text-gray-700">Availability:</span>
                    <div className="mt-1 text-gray-600">
                      {candidate.availability.replace(/_/g, ' ')}
                    </div>
                  </div>
                )}
                {candidate.employmentType && (
                  <div>
                    <span className="font-medium text-gray-700">Employment Type:</span>
                    <div className="mt-1 text-gray-600 capitalize">
                      {candidate.employmentType.toLowerCase()}
                    </div>
                  </div>
                )}
                {candidate.remotePreference && (
                  <div>
                    <span className="font-medium text-gray-700">Remote Work:</span>
                    <div className="mt-1 text-gray-600 capitalize">
                      {candidate.remotePreference}
                    </div>
                  </div>
                )}
                {candidate.rightToWork && (
                  <div>
                    <span className="font-medium text-gray-700">Right to Work:</span>
                    <div className="mt-1 text-gray-600 uppercase">
                      {candidate.rightToWork}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {mbtiInsight && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">Professional Insights</h2>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700">
                    <span className="font-medium">Myers-Briggs result:</span>{' '}
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">{mbtiInsight.type}</span>
                  </p>
                  {mbtiInsight.completedAt && (
                    <p className="text-gray-500">Completed {new Date(mbtiInsight.completedAt).toLocaleDateString()}</p>
                  )}
                </div>

                {mbtiInsight.pairScores?.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {mbtiInsight.pairScores.map((pair) => (
                      <div key={pair.title}>
                        <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                          <span>{pair.title}</span>
                          <span>
                            {pair.left?.toUpperCase()} {pair.leftPct}% · {pair.right?.toUpperCase()} {pair.rightPct}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pair.leftPct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Contact {candidate.fullName}
              </h2>
              <button
                onClick={() => setShowMessageModal(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Message Input */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Your Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Type your message here..."
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowMessageModal(false)}
                disabled={sending}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={sending || !message.trim()}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps(context) {
  const { getServerSession } = await import('next-auth/next');
  const { authOptions } = await import('../../api/auth/[...nextauth]');

  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session || session.user.role !== 'EMPLOYER') {
    return {
      redirect: {
        destination: '/employer-login',
        permanent: false,
      },
    };
  }

  const { candidateId } = context.params;

  const candidate = await prisma.candidateProfile.findUnique({
    where: { id: candidateId },
    include: {
      skills: true,
      experiences: {
        orderBy: { startDate: 'desc' },
      },
      education: {
        orderBy: { startDate: 'desc' },
      },
      certifications: true,
    },
  });

  if (!candidate) {
    return { notFound: true };
  }

  let visibleToEmployers = false;
  if (candidate.personalityDesc) {
    try {
      const parsed = JSON.parse(candidate.personalityDesc);
      visibleToEmployers = Boolean(parsed?.visibleToEmployers);
    } catch {
      visibleToEmployers = false;
    }
  }

  if (!visibleToEmployers) {
    candidate.personalityType = null;
    candidate.personalityDesc = null;
  }

  return {
    props: {
      candidate: JSON.parse(JSON.stringify(candidate)),
    },
  };
}
