"use client";

import React, { Component, ReactNode } from "react";
import { TRPCClientError } from "@trpc/client";
import type { AppRouter } from "@/server/routers/_app";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export function handleTRPCError(error: unknown) {
  if (error instanceof TRPCClientError) {
    switch (error.data?.code) {
      case "UNAUTHORIZED":
        // 로그인 페이지로 리다이렉트
        window.location.href = "/sign-in";
        break;

      case "TOO_MANY_REQUESTS":
        // 쿨다운 타이머 표시
        const cause = error.cause as any;
        const remainingSeconds = cause?.remainingSeconds || 0;
        showNotification(
          `쿨다운 중입니다. ${remainingSeconds}초 후 다시 시도해주세요.`,
          "warning"
        );
        break;

      case "BAD_REQUEST":
        // 입력값 검증 에러 표시
        const zodError = (error.data as any)?.zodError;
        if (zodError) {
          const errorMessages = Object.entries(zodError.fieldErrors || {})
            .map(
              ([field, errors]) =>
                `${field}: ${(errors as string[]).join(", ")}`
            )
            .join("\n");
          showNotification(`입력값 오류:\n${errorMessages}`, "error");
        } else {
          showNotification("잘못된 요청입니다.", "error");
        }
        break;

      case "INTERNAL_SERVER_ERROR":
        // 일반적인 서버 에러
        showNotification(
          "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
          "error"
        );
        break;

      default:
        console.error("Unexpected tRPC error:", error);
        showNotification("알 수 없는 오류가 발생했습니다.", "error");
    }
  } else {
    console.error("Non-tRPC error:", error);
    showNotification("예상치 못한 오류가 발생했습니다.", "error");
  }
}

// 알림 표시 함수
function showNotification(
  message: string,
  type: "info" | "warning" | "error" | "success" = "info"
) {
  // 기존 알림 제거
  const existingNotification = document.getElementById("trpc-notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  // 새 알림 생성
  const notification = document.createElement("div");
  notification.id = "trpc-notification";
  notification.className =
    "fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-2 duration-300";

  const bgColors = {
    info: "bg-blue-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
    success: "bg-green-500",
  };

  notification.innerHTML = `
    <div class="flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white ${bgColors[type]}">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="${
            type === "error"
              ? "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              : type === "warning"
                ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                : type === "success"
                  ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  : "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          }"/>
      </svg>
      <span class="font-medium whitespace-pre-line">${message}</span>
    </div>
  `;

  document.body.appendChild(notification);

  // 자동 제거
  setTimeout(() => {
    notification.classList.add("animate-out", "fade-out", "slide-out-to-top-2");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

// React Error Boundary Component
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    handleTRPCError(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>오류가 발생했습니다</strong>
              <p className="mt-2">
                페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                페이지 새로고침
              </button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

// Export utility for use in components
export { showNotification };
