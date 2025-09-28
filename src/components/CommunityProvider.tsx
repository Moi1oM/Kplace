"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { useCommunityStore } from "@/lib/store";
import { useAuth } from "@clerk/nextjs";

export default function CommunityProvider() {
  const { isSignedIn, isLoaded } = useAuth();
  const {
    setCommunityInfo,
    setLoading,
    setError,
    incrementFetchAttempts,
    fetchAttempts,
    communityInfo,
  } = useCommunityStore();

  const { data, isLoading, error } = trpc.user.getCommunityInfo.useQuery(
    undefined,
    {
      enabled: isLoaded && isSignedIn && fetchAttempts < 2,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000,
    }
  );

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    setLoading(isLoading);

    if (data && !communityInfo) {
      setCommunityInfo({
        community: data.community,
        communitySetAt: data.communitySetAt ?? null,
        canChange: data.canChange,
        daysRemaining: data.daysRemaining,
      });
      incrementFetchAttempts();
    }

    if (error) {
      setError(new Error(error.message));
      incrementFetchAttempts();
    }
  }, [
    data,
    isLoading,
    error,
    isSignedIn,
    isLoaded,
    setCommunityInfo,
    setLoading,
    setError,
    incrementFetchAttempts,
    communityInfo,
  ]);

  return null;
}