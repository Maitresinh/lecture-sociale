import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function calculateTimeRemaining(endDate: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const now = new Date().getTime();
  const end = new Date(endDate).getTime();
  const total = end - now;

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((total % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, total };
}

export function formatProgress(progress: number): string {
  return `${Math.round(progress * 100)}%`;
}

export function generateShareText(annotation: {
  selectedText: string;
  content?: string;
  user: { name: string };
  book: { title: string; author: string };
}): string {
  const quote = `"${annotation.selectedText}"`;
  const author = `— ${annotation.book.author}, ${annotation.book.title}`;
  const comment = annotation.content ? `\n\n${annotation.content} (${annotation.user.name})` : '';
  
  return `${quote}\n${author}${comment}\n\n#LectureSociale`;
}