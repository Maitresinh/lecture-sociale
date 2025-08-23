export interface User {
  id: string;
  email: string;
  name: string;
  status: 'user' | 'translator' | 'author' | 'guest' | 'admin';
  avatar?: string;
  createdAt: Date;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverUrl?: string;
  epubUrl: string;
  totalPages: number;
  createdAt: Date;
}

export interface SharedReading {
  id: string;
  bookId: string;
  book: Book;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  isPublic: boolean;
  inviteCode?: string;
  createdBy: string;
  creator: User;
  participants: SharedReadingParticipant[];
  annotations: Annotation[];
  createdAt: Date;
}

export interface SharedReadingParticipant {
  id: string;
  sharedReadingId: string;
  userId: string;
  user: User;
  joinedAt: Date;
  progress: number; // 0-1
}

export interface Annotation {
  id: string;
  sharedReadingId: string;
  userId: string;
  user: User;
  content: string;
  cfi: string; // EPUB Canonical Fragment Identifier
  selectedText: string;
  page: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReadingSession {
  sharedReadingId: string;
  currentCfi: string;
  progress: number;
  lastReadAt: Date;
}

export interface Citation {
  id: string;
  annotationId: string;
  text: string;
  author: string;
  bookTitle: string;
  sharedOnPlatforms: ('twitter' | 'facebook' | 'instagram')[];
  createdAt: Date;
}