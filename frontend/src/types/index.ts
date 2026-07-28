export * from "./auth";

export interface ApiErrorResponse {
  detail: string | { msg: string; loc: string[] }[];
}
