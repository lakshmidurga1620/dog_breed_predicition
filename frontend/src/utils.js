import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// This function merges multiple class names and resolves Tailwind conflicts!
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
