// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { proxy } from './proxy';

const request = (path: string, cookie?: string) =>
  new NextRequest(`http://localhost:3000${path}`, { headers: cookie ? { cookie } : {} });

describe('proxy', () => {
  it('redirects to login without a session cookie', () => {
    const response = proxy(request('/admin/produtos'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/admin/login');
  });

  it('lets the login page through', () => {
    expect(proxy(request('/admin/login')).headers.get('location')).toBeNull();
  });

  it('lets requests with a session cookie through (the API validates it)', () => {
    expect(proxy(request('/admin/categorias', 'agc_session=abc')).headers.get('location')).toBeNull();
  });
});
