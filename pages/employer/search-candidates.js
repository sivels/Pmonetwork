import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';
import CandidateCard from '../../components/employer/CandidateCard';
import FilterPanel from '../../components/employer/FilterPanel';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function SearchCandidatesContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    skills: '',
    minExp: '',
    maxExp: '',
    availability: '',
    employmentType: '',
    minSalary: '',
    maxSalary: '',
    minDayRate: '',
    maxDayRate: '',
    remoteOnly: false,
    rightToWork: '',
  });
  const [page, setPage] = useState(1);
  const limit = 12;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Build query params
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.append('q', debouncedQuery);
    if (filters.location) params.append('location', filters.location);
    if (filters.skills) params.append('skills', filters.skills);
    if (filters.minExp) params.append('minExp', filters.minExp);
    if (filters.maxExp) params.append('maxExp', filters.maxExp);
    if (filters.availability) params.append('availability', filters.availability);
    if (filters.employmentType) params.append('employmentType', filters.employmentType);
    if (filters.minSalary) params.append('minSalary', filters.minSalary);
    if (filters.maxSalary) params.append('maxSalary', filters.maxSalary);
    if (filters.minDayRate) params.append('minDayRate', filters.minDayRate);
    if (filters.maxDayRate) params.append('maxDayRate', filters.maxDayRate);
    if (filters.remoteOnly) params.append('remoteOnly', 'true');
    if (filters.rightToWork) params.append('rightToWork', filters.rightToWork);
    params.append('page', page);
    params.append('limit', limit);
    return params.toString();
  };

  // Fetch candidates
  const { data, isLoading, error } = useQuery({
    queryKey: ['candidates', debouncedQuery, filters, page],
    queryFn: async () => {
      const res = await fetch(`/api/employer/candidates/search?${buildQueryParams()}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch candidates');
      }
      return res.json();
    },
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async ({ candidateId, isSaved }) => {
      const method = isSaved ? 'DELETE' : 'POST';
      const res = await fetch('/api/employer/candidates/bookmark', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update bookmark');
      }
      return res.json();
    },
    onSuccess: () => {
      // Refetch candidates to update bookmark status
      queryClient.invalidateQueries(['candidates']);
    },
  });

  const handleBookmarkToggle = (candidateId, isSaved) => {
    bookmarkMutation.mutate({ candidateId, isSaved });
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to page 1 on filter change
  };

  const handleClearFilters = () => {
    setFilters({
      location: '',
      skills: '',
      minExp: '',
      maxExp: '',
      availability: '',
      employmentType: '',
      minSalary: '',
      maxSalary: '',
      minDayRate: '',
      maxDayRate: '',
      remoteOnly: false,
      rightToWork: '',
    });
    setSearchQuery('');
    setPage(1);
  };

  const candidates = data?.candidates || [];
  const totalPages = data?.totalPages || 1;
  const totalResults = data?.total || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Search Candidates</h1>
          <p className="mt-2 text-gray-600">
            Find the perfect candidate for your open positions
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, sector, or summary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Filter Panel - Left Sidebar */}
          <aside className="hidden lg:block lg:w-80 flex-shrink-0">
            <FilterPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClear={handleClearFilters}
            />
          </aside>

          {/* Results - Right Side */}
          <main className="flex-1 min-w-0">
            {/* Results Header */}
            {!isLoading && (
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {totalResults > 0 ? (
                    <>
                      Showing <span className="font-medium">{candidates.length}</span> of{' '}
                      <span className="font-medium">{totalResults}</span> candidates
                    </>
                  ) : (
                    'No candidates found'
                  )}
                </p>
                <div className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Loading candidates...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                <p className="font-medium">Error loading candidates</p>
                <p className="text-sm">{error.message}</p>
              </div>
            )}

            {/* Results Grid */}
            {!isLoading && !error && candidates.length > 0 && (
              <>
                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                  {candidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      onBookmarkToggle={handleBookmarkToggle}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Empty State */}
            {!isLoading && !error && candidates.length === 0 && (
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <Search className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No candidates found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Try adjusting your search or filters to find what you're looking for
                </p>
                <button
                  onClick={handleClearFilters}
                  className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function SearchCandidatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated or not an employer
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/employer-login');
    } else if (session.user.role !== 'EMPLOYER') {
      router.push('/');
    }
  }, [session, status, router]);

  if (status === 'loading' || !session || session.user.role !== 'EMPLOYER') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SearchCandidatesContent />
    </QueryClientProvider>
  );
}

export async function getServerSideProps(context) {
  const { getServerSession } = await import('next-auth/next');
  const { authOptions } = await import('../api/auth/[...nextauth]');

  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session || session.user.role !== 'EMPLOYER') {
    return {
      redirect: {
        destination: '/employer-login',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
