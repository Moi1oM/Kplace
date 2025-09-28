import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React from "react";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Script from "next/script";
import ZoomControls from "@/components/ZoomControl";
import ZoomToPixels from "@/components/ZoomToPixels";
import InfoModal from "@/components/InfoModal";
import PaintButton from "@/components/PaintButton";
import CooldownTimer from "@/components/CooldownTimer";
import { TRPCProvider } from "@/lib/trpc/provider";
import { Toaster } from "@/components/ui/sonner";
import CommunityProvider from "@/components/CommunityProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kplace - 커뮤니티 픽셀 전쟁",
  description:
    "대한민국 지도 위에서 펼쳐지는 커뮤니티 픽셀 전쟁! 당신의 커뮤니티를 위해 픽셀을 그려보세요.",
  openGraph: {
    type: "website",
    url: "https://kplace.site",
    title: "Kplace - 커뮤니티 픽셀 전쟁",
    description:
      "대한민국 지도 위에서 펼쳐지는 커뮤니티 픽셀 전쟁! 당신의 커뮤니티를 위해 픽셀을 그려보세요.",
    siteName: "Kplace",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kplace - 커뮤니티 픽셀 전쟁",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kplace - 커뮤니티 픽셀 전쟁",
    description:
      "대한민국 지도 위에서 펼쳐지는 커뮤니티 픽셀 전쟁! 당신의 커뮤니티를 위해 픽셀을 그려보세요.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased h-full m-0 p-0 overflow-hidden`}
        >
          <TRPCProvider>
            <CommunityProvider />
            {/* 네이버 지도 API 스크립트 - beforeInteractive로 우선 로딩 */}
            <Script
              type="text/javascript"
              src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVERMAP_CLIENT_ID}`}
            />

            {/* 전체화면 지도 위에 오버레이되는 헤더 */}
            {/* 전체화면 지도 위에 오버레이되는 헤더 */}
            <header className="fixed top-0 right-0 z-50 flex flex-col items-end p-4 gap-4">
              {/* 로그인/회원가입 버튼 */}
              <div className="flex items-center gap-4">
                <SignedOut>
                  <SignInButton>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm px-4 py-2 shadow-lg transition-colors duration-200">
                      Log in
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <div className="bg-white rounded-full p-1 shadow-lg">
                    <UserButton />
                  </div>
                </SignedIn>
              </div>

              {/* 줌 컨트롤 버튼 */}
              <ZoomControls />
            </header>

            {/* Paint 버튼 - 하단 중앙에 고정 */}
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
              <PaintButton />
            </div>

            {/* Zoom 안내 텍스트 - 상단 중앙 */}
            <ZoomToPixels />
            {/* 도움말 버튼 - 좌측 상단 */}
            <InfoModal />
            {/* 쿨다운 타이머 */}
            <CooldownTimer />

            {children}
            <Analytics />
            <Toaster />
          </TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
