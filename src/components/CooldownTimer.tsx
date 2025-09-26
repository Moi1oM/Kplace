"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function CooldownTimer() {
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const { isSignedIn } = useAuth();

  // Use tRPC query for fetching cooldown status with optimized settings
  const { data: cooldownData } = trpc.user.getCooldownStatus.useQuery(
    undefined,
    {
      enabled: isSignedIn, // Only run query when signed in
      refetchInterval: cooldownRemaining > 0 ? 2000 : 10000, // Check more frequently when cooling down
      staleTime: 1000, // Consider data fresh for 1 second
      cacheTime: 5000, // Keep in cache for 5 seconds
      onError: (error) => {
        console.error('Error fetching cooldown:', error.message);
      },
    }
  );

  // Update cooldown remaining when data changes
  useEffect(() => {
    if (cooldownData?.cooldown) {
      setCooldownRemaining(cooldownData.cooldown.remainingSeconds);
    }
  }, [cooldownData]);

  // Countdown timer
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [cooldownRemaining]);

  if (!isSignedIn || cooldownRemaining <= 0) return null;

  const minutes = Math.floor(cooldownRemaining / 60);
  const seconds = cooldownRemaining % 60;

  return (
    <div className="fixed bottom-24 right-4 z-50 w-auto">
      <Alert className="bg-gray-900 text-white border-gray-700 shadow-lg">
        <Clock className="h-4 w-4 animate-pulse" />
        <AlertDescription className="text-white ml-2">
          Cooldown: {minutes}:{seconds.toString().padStart(2, '0')}
        </AlertDescription>
      </Alert>
    </div>
  );
}