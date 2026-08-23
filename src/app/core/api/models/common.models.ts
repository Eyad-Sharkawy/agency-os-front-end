/**
 * RFC 7807 Problem Details for HTTP APIs
 */
export interface ProblemDetail {
  type?: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  timestamp?: string;
  fieldErrors?: Record<string, string>;
  [key: string]: unknown;
}
