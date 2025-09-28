"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Clock, User } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { COMMUNITIES } from "@/lib/communities";
import { formatTimeAgo } from "@/lib/date-utils";

interface PixelHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  x: number;
  y: number;
}

export default function PixelHistoryModal({
  open,
  onOpenChange,
  x,
  y,
}: PixelHistoryModalProps) {
  const { data: historyData, isLoading } = trpc.pixel.getHistory.useQuery(
    { x, y, limit: 20 },
    { enabled: open }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">
            픽셀 히스토리 ({x}, {y})
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-2 pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : historyData?.history.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">
              변경 이력이 없습니다
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-600 font-medium mb-2">
                총 {historyData?.totalCount ?? 0}개 변경
              </p>
              {historyData?.history.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border transition-all ${
                    idx === 0
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-6 h-6 rounded border-2 border-gray-300"
                      style={{ backgroundColor: item.color }}
                    />

                    <span className="text-xs font-mono text-gray-700">
                      {item.color}
                    </span>

                    {idx === 0 && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold ml-auto">
                        현재
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-3 h-3 text-gray-500" />
                    <span className="text-xs font-medium text-gray-700">
                      {item.user.username || "Anonymous"}
                    </span>
                  </div>

                  {item.user.community && (
                    <div className="mb-1">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor:
                            COMMUNITIES[item.user.community].color + "20",
                          color: COMMUNITIES[item.user.community].color,
                          border: `1px solid ${COMMUNITIES[item.user.community].color}40`,
                        }}
                      >
                        {COMMUNITIES[item.user.community].logoPath && (
                          <Image
                            src={COMMUNITIES[item.user.community].logoPath}
                            alt={COMMUNITIES[item.user.community].name}
                            width={14}
                            height={14}
                            className="rounded"
                          />
                        )}
                        {COMMUNITIES[item.user.community].name}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(item.createdAt)}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}