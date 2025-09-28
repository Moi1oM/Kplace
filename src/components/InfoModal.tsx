"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HelpCircle, Github, Mail, MessageCircle } from "lucide-react";

export default function InfoModal() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-4 left-4 z-50">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full shadow-lg bg-white"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <span className="text-3xl">🌍</span>
              <span>K-Place</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <section>
              <h3 className="font-semibold text-lg mb-3">Overview</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                K-Place는 한국 지도 위에서 실시간으로 픽셀 아트를 그릴 수 있는
                협업 캔버스입니다. 전국의 커뮤니티 사용자들과 경쟁을 해보세요!
                각 커뮤니티는 전용 색상 2가지가 있습니다. 픽셀은 찍고 난 후
                2시간 동안만 보호됩니다.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">Community</h3>
              <div className="flex flex-col gap-3">
                <a
                  href="https://discord.gg/PQfTGXBp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <MessageCircle className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="font-medium text-sm">Discord</p>
                    <p className="text-xs text-gray-500">커뮤니티에 참여하기</p>
                  </div>
                </a>

                <a
                  href="https://github.com/Moi1oM/Kplace"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <Github className="h-5 w-5 text-gray-800" />
                  <div>
                    <p className="font-medium text-sm">Github</p>
                    <p className="text-xs text-gray-500">소스 코드 보러가기</p>
                  </div>
                </a>

                <a
                  href="mailto:hcloud0806@gmail.com"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">Email</p>
                    <p className="text-xs text-gray-500">
                      hcloud0806@gmail.com
                    </p>
                  </div>
                </a>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
