import { DefaultOptions } from "@tanstack/react-query";

export const QUERY_CONFIG: DefaultOptions = {
  queries: {
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  },
};
