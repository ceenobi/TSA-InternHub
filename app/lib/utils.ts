import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateInviteCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "INV";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const getTimeOfDay = (name: string): string => {
  const currentHour = new Date().getHours();

  if (currentHour >= 5 && currentHour < 12) {
    return `Good morning, ${name} ☀️ `;
  } else if (currentHour >= 12 && currentHour < 18) {
    return `Good afternoon, ${name} 🌤️ `;
  } else {
    return `Good evening, ${name} 🌙 `;
  }
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const generateTicketId = () => {
  const timestamp = Math.floor(Date.now() / 1000)
    .toString()
    .slice(-4);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(6, "0");
  return `TK-${timestamp}-${random}`;
};
