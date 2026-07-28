import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getParamId(params: { id?: string | string[] }): string {
  return Array.isArray(params.id) ? (params.id[0] as string) : (params.id as string)
}
