"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";

interface LoadingLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function LoadingLink({
  href,
  children,
  className,
}: LoadingLinkProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const canUsePortal = typeof document !== "undefined";

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    window.setTimeout(() => {
      router.push(href);
    }, 900);
  };

  return (
    <>
      <a
        href={href}
        onClick={handleClick}
        className={className}
      >
        {children}
      </a>

      {canUsePortal &&
        isLoading &&
        createPortal(
          <div
            className="route-loader"
            role="status"
            aria-live="polite"
            aria-label="Loading Blanc visual query builder"
          >
            <div className="route-loader-mark">Blanc.</div>
            <div className="route-loader-line" />
          </div>,
          document.body,
        )}
    </>
  );
}
