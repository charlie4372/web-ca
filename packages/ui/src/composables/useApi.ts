import { ofetch, type FetchOptions } from 'ofetch';
import type { ApiResponse } from '@web-ca/shared';

const api = ofetch.create({
  baseURL: '/api/v1',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
});

export function useApi() {
  async function get<T>(url: string, opts?: FetchOptions): Promise<T> {
    const res = await api<ApiResponse<T>>(url, { method: 'GET', ...opts });
    return res.data;
  }

  async function post<T>(url: string, body?: unknown, opts?: FetchOptions): Promise<T> {
    const res = await api<ApiResponse<T>>(url, { method: 'POST', body, ...opts });
    return res.data;
  }

  async function patch<T>(url: string, body?: unknown, opts?: FetchOptions): Promise<T> {
    const res = await api<ApiResponse<T>>(url, { method: 'PATCH', body, ...opts });
    return res.data;
  }

  async function del(url: string, opts?: FetchOptions): Promise<void> {
    await api(url, { method: 'DELETE', ...opts });
  }

  function downloadUrl(url: string): string {
    return `/api/v1${url}`;
  }

  return { get, post, patch, del, downloadUrl };
}
