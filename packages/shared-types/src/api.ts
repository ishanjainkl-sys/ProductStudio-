export interface ApiSuccess<T> {
  data: T;
}

export interface ApiListSuccess<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VERSION_CONFLICT"
  | "RESOURCE_IN_USE"
  | "UNPROCESSABLE"
  | "INTERNAL_ERROR";

export interface PublicUser {
  id: string;
  email: string;
  role: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  ownerId: string;
  templateVersionId: string | null;
  updatedAt: string;
  createdAt: string;
  deletedAt: string | null;
  saveStatus?: "saved" | "unsaved";
}

export interface PageSummary {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  isHome: boolean;
  version: number;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface AssetSummary {
  id: string;
  projectId: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  originalFilename: string;
  createdAt: string;
}
