// Types partagés entre le frontend et le backend

export enum UserStatus {
  USER = 'USER',
  TRANSLATOR = 'TRANSLATOR', 
  AUTHOR = 'AUTHOR',
  GUEST = 'GUEST',
  ADMIN = 'ADMIN'
}

export enum Platform {
  TWITTER = 'TWITTER',
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM'
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    status: UserStatus;
    avatar?: string;
    createdAt: string;
  };
  token: string;
}

export interface CreateSharedReadingRequest {
  title: string;
  description?: string;
  bookId: string;
  startDate: string;
  endDate: string;
  isPublic: boolean;
}

export interface CreateAnnotationRequest {
  sharedReadingId: string;
  content: string;
  cfi: string;
  selectedText: string;
  page: number;
  isPublic: boolean;
}

export interface UpdateProgressRequest {
  progress: number;
  cfi?: string;
}