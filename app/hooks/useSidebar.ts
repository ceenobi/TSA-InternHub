import { useEffect, useState } from "react";

const COOKIE_NAME = "sbarTsaInterHub";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function useSidebar() {
  const [isOpenSidebar, setIsOpenSidebar] = useState(() => {
    const saved = getCookie(COOKIE_NAME);
    return saved === "true";
  });

  useEffect(() => {
    setCookie(COOKIE_NAME, String(isOpenSidebar));
  }, [isOpenSidebar]);

  return {
    isOpenSidebar,
    setIsOpenSidebar,
  };
}