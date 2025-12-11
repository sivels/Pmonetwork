import React from 'react';
import Link from 'next/link';
import { Bookmark, MapPin, Briefcase, Star } from 'lucide-react';

export default function CandidateCard({ candidate, onBookmarkToggle }) {
  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onBookmarkToggle) {
      onBookmarkToggle(candidate.id, !candidate.isSaved);
    }
  };

  const getAvailabilityLabel = (availability) => {
    const labels = {
      'AVAILABLE_IMMEDIATE': 'Available Now',
      'AVAILABLE_2_WEEKS': '2 Weeks',
      'AVAILABLE_1_MONTH': '1 Month',
      'NOT_AVAILABLE': 'Not Available'
    };
    return labels[availability] || availability;
  };

  const getAvailabilityColor = (availability) => {
    if (availability === 'AVAILABLE_IMMEDIATE') return 'bg-green-100 text-green-700';
    if (availability?.includes('WEEKS')) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="group relative rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-blue-500 hover:shadow-lg">
      <Link href={`/employer/candidates/${candidate.id}`} className="block">
        <div className="flex items-start gap-4">
          {/* Profile Photo */}
          <img
            src={candidate.profilePhotoUrl || '/avatar-placeholder.png'}
            alt={candidate.fullName}
            className="h-16 w-16 rounded-full object-cover"
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600">
                  {candidate.fullName}
                </h3>
                <p className="text-sm text-gray-600 truncate">{candidate.jobTitle}</p>
              </div>

              {/* Bookmark Button */}
              <button
                onClick={handleBookmark}
                className={`p-2 rounded-full transition-colors ${
                  candidate.isSaved
                    ? 'text-yellow-500 hover:text-yellow-600'
                    : 'text-gray-400 hover:text-yellow-500'
                }`}
                title={candidate.isSaved ? 'Remove bookmark' : 'Bookmark candidate'}
              >
                <Bookmark
                  className={`h-5 w-5 ${candidate.isSaved ? 'fill-current' : ''}`}
                />
              </button>
            </div>

            {/* Location & Experience */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              {candidate.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {candidate.location}
                </span>
              )}
              {candidate.yearsExperience && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {candidate.yearsExperience} years
                </span>
              )}
              {candidate.remotePreference && (
                <span className="capitalize">{candidate.remotePreference}</span>
              )}
            </div>

            {/* Summary */}
            {candidate.summary && (
              <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                {candidate.summary}
              </p>
            )}

            {/* Skills */}
            {candidate.skills && candidate.skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {candidate.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                  >
                    {skill}
                  </span>
                ))}
                {candidate.totalSkills > 5 && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    +{candidate.totalSkills - 5} more
                  </span>
                )}
              </div>
            )}

            {/* Footer - Availability & CTA */}
            <div className="mt-4 flex items-center justify-between">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getAvailabilityColor(
                  candidate.availability
                )}`}
              >
                {getAvailabilityLabel(candidate.availability)}
              </span>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-medium text-blue-600">
                  View Profile →
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
