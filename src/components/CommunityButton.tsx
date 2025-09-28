"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Home, Loader2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { trpc } from "@/lib/trpc/client";
import { COMMUNITIES } from "@/lib/communities";
import { Community } from "@prisma/client";
import { toast } from "sonner";
import { useCommunityStore } from "@/lib/store";

const SESSION_KEY = "community_modal_dismissed";

export default function CommunityButton() {
  const [open, setOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

  const { isSignedIn } = useAuth();
  const { communityInfo, isLoading: storeLoading, setCommunityInfo } = useCommunityStore();
  const { refetch, isLoading: queryLoading } = trpc.user.getCommunityInfo.useQuery(
    undefined,
    { enabled: open && !communityInfo, refetchOnWindowFocus: false }
  );

  const isLoading = storeLoading || queryLoading;

  useEffect(() => {
    if (!isSignedIn || isLoading || !communityInfo) return;

    const dismissed = sessionStorage.getItem(SESSION_KEY);
    if (dismissed) return;

    const hasNoCommunity = !communityInfo.community;
    if (hasNoCommunity && communityInfo.canChange) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isSignedIn, communityInfo, isLoading]);

  const updateCommunityMutation = trpc.user.updateCommunity.useMutation({
    onSuccess: (data) => {
      toast.success("커뮤니티가 설정되었습니다!");
      sessionStorage.removeItem(SESSION_KEY);

      setCommunityInfo({
        community: data.user.community,
        communitySetAt: data.user.communitySetAt,
        canChange: false,
        daysRemaining: 30,
      });

      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSelectCommunity = (community: Community) => {
    setSelectedCommunity(community);
  };

  const handleConfirm = () => {
    if (!selectedCommunity) return;
    updateCommunityMutation.mutate({ community: selectedCommunity });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && !communityInfo?.community) {
      sessionStorage.setItem(SESSION_KEY, "true");
    }
  };

  const currentCommunity = communityInfo?.community;
  const buttonLabel = currentCommunity
    ? COMMUNITIES[currentCommunity].shortName
    : "?";

  const hasNoCommunity = !currentCommunity;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <TooltipProvider>
        <Tooltip open={hasNoCommunity ? undefined : false}>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`rounded-full shadow-lg bg-white transition-all duration-300 ${
                  hasNoCommunity
                    ? "animate-pulse border-2 border-orange-400 bg-orange-50 hover:bg-orange-100"
                    : ""
                }`}
                style={{
                  backgroundColor: currentCommunity
                    ? COMMUNITIES[currentCommunity].color + "20"
                    : undefined,
                  borderColor: currentCommunity
                    ? COMMUNITIES[currentCommunity].color
                    : undefined,
                }}
              >
                {currentCommunity && COMMUNITIES[currentCommunity].logoPath ? (
                  <Image
                    src={COMMUNITIES[currentCommunity].logoPath}
                    alt={COMMUNITIES[currentCommunity].name}
                    width={20}
                    height={20}
                    className="rounded"
                  />
                ) : currentCommunity ? (
                  <span className="text-xs font-bold">{buttonLabel}</span>
                ) : (
                  <Home className="h-5 w-5 text-orange-500" />
                )}
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          {hasNoCommunity && (
            <TooltipContent side="left" className="bg-orange-500 text-white">
              <p className="font-semibold">🏠 커뮤니티를 선택해주세요!</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>커뮤니티 선택</DialogTitle>
          {communityInfo?.canChange && (
            <DialogDescription>
              소속 커뮤니티를 선택하세요. ⚠️ 한 번 선택하면 30일간 변경할 수
              없습니다.
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : communityInfo?.canChange ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(COMMUNITIES).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => handleSelectCommunity(key as Community)}
                  className={`p-3 rounded-lg border-2 transition-all text-xs font-medium flex flex-col items-center gap-2 ${
                    selectedCommunity === key
                      ? "ring-2 ring-offset-2 ring-blue-600 border-blue-600"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{
                    backgroundColor: info.color + "15",
                    borderColor:
                      selectedCommunity === key ? info.color : undefined,
                  }}
                >
                  {info.logoPath ? (
                    <Image
                      src={info.logoPath}
                      alt={info.name}
                      width={24}
                      height={24}
                      className="rounded"
                    />
                  ) : null}
                  <span>{info.name}</span>
                </button>
              ))}
            </div>

            <Button
              onClick={handleConfirm}
              disabled={!selectedCommunity || updateCommunityMutation.isPending}
              className="w-full"
            >
              {updateCommunityMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  설정 중...
                </>
              ) : (
                "확인"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div
                className="inline-flex items-center gap-3 px-6 py-3 rounded-lg text-lg font-bold"
                style={{
                  backgroundColor: currentCommunity
                    ? COMMUNITIES[currentCommunity].color + "20"
                    : undefined,
                  color: currentCommunity
                    ? COMMUNITIES[currentCommunity].color
                    : undefined,
                }}
              >
                {currentCommunity && COMMUNITIES[currentCommunity].logoPath && (
                  <Image
                    src={COMMUNITIES[currentCommunity].logoPath}
                    alt={COMMUNITIES[currentCommunity].name}
                    width={40}
                    height={40}
                    className="rounded"
                  />
                )}
                <span>
                  {currentCommunity
                    ? COMMUNITIES[currentCommunity].name
                    : "미설정"}
                </span>
              </div>
            </div>
            <p className="text-center text-sm text-gray-600">
              📅 {communityInfo?.daysRemaining}일 후 변경 가능
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}