"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Info } from "lucide-react";

const STORAGE_KEY = "welcomeModalDismissedUntil";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [hideForDay, setHideForDay] = useState(false);

  useEffect(() => {
    const dismissedUntil = localStorage.getItem(STORAGE_KEY);

    if (!dismissedUntil) {
      setIsOpen(true);
      return;
    }

    const dismissTimestamp = parseInt(dismissedUntil, 10);
    if (Date.now() > dismissTimestamp) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    if (hideForDay) {
      const dismissUntil = Date.now() + ONE_DAY_MS;
      localStorage.setItem(STORAGE_KEY, dismissUntil.toString());
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md z-[60]" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-blue-600" />
            <DialogTitle className="text-lg">
              K-Place에 오신 것을 환영합니다!
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="text-left text-sm text-gray-600 leading-relaxed space-y-3">
          <p>안녕하세요! K-Place를 방문해 주셔서 감사합니다.</p>
          <p>K-Place는 커뮤니티의 힘싸움을 시각화해보고자 시작했습니다.</p>
          <p>
            현재 K-Place는 <strong>초기 버전</strong> 및 1인 개발으로 운영
            중이며, 아직 불안정한 부분이 많을 수 있습니다.
          </p>
          <p>
            사용 중 불편한 점이나 개선이 필요한 부분이 있으시면 언제든 피드백을
            남겨주시면 큰 도움이 됩니다. 자세한 사항은 왼쪽 위 ? 버튼을 누르셔서
            확인해주세요.
          </p>
          <p className="text-gray-700 font-medium">
            더 나은 서비스를 만들기 위해 최선을 다하겠습니다.
            <br />
            감사합니다.
          </p>
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-col">
          <div className="flex items-center gap-2">
            <Checkbox
              id="hideForDay"
              checked={hideForDay}
              onCheckedChange={(checked) => setHideForDay(checked === true)}
            />
            <label
              htmlFor="hideForDay"
              className="text-sm text-gray-600 cursor-pointer select-none"
            >
              하루동안 보지 않기
            </label>
          </div>

          <Button onClick={handleClose} className="w-full" size="sm">
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
