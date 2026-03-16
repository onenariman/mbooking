const MINUTE = 1000 * 60;

export const QUERY_STALE_TIMES = {
  reference: Infinity,
  live: 5 * MINUTE,
  analytics: MINUTE,
  feedback: MINUTE,
  recommendations: MINUTE,
};

export const QUERY_DEFAULTS = {
  staleTime: QUERY_STALE_TIMES.analytics,
  refetchOnWindowFocus: false,
  retry: 0,
};

const baseQueryOptions = {
  refetchOnWindowFocus: false,
};

export const QUERY_OPTIONS = {
  reference: {
    ...baseQueryOptions,
    staleTime: QUERY_STALE_TIMES.reference,
  },
  live: {
    ...baseQueryOptions,
    staleTime: QUERY_STALE_TIMES.live,
  },
  analytics: {
    ...baseQueryOptions,
    staleTime: QUERY_STALE_TIMES.analytics,
  },
  feedback: {
    ...baseQueryOptions,
    staleTime: QUERY_STALE_TIMES.feedback,
  },
  recommendations: {
    ...baseQueryOptions,
    staleTime: QUERY_STALE_TIMES.recommendations,
  },
};
