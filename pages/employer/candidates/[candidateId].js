import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ChevronLeft, Loader2, MapPin, Briefcase, Mail, Phone, Calendar, Award } from 'lucide-react';
import { prisma } from '../../../lib/prisma';

export default function CandidateDetailPage({ candidate }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'EMPLOYER') {
      router.push('/employer-login');
    }
  }, [session, status, router]);

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
                {candidate.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {candidate.phone}
                  </span>
                )}
                {candidate.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {candidate.email}
                  </span>
                )}
              </div>
            </div>
            <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
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
          </div>
        </div>
      </div>
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

  const candidate = await prisma.candidate.findUnique({
    where: { id: parseInt(candidateId) },
    include: {
      skills: true,
      experiences: {
        orderBy: { startDate: 'desc' },
      },
      education: {
        orderBy: { startYear: 'desc' },
      },
      certifications: true,
    },
  });

  if (!candidate) {
    return { notFound: true };
  }

  return {
    props: {
      candidate: JSON.parse(JSON.stringify(candidate)),
    },
  };
}
