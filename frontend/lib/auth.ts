const API_URL = 'http://localhost:3001';

export interface LoginResponse {
  success: boolean;
  access_token?: string;
  message?: string;
}

export interface AdminUser {
  id: number;
  email: string;
}

// Login fonksiyonu
export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  
  if (data.success && data.access_token) {
    localStorage.setItem('admin_token', data.access_token);
  }
  
  return data;
}

// Logout fonksiyonu
export function logout() {
  localStorage.removeItem('admin_token');
  window.location.href = '/admin/login';
}

// Token kontrolü
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

// Login durumu kontrolü
export function isLoggedIn(): boolean {
  return !!getToken();
}

// Authenticated fetch
export async function authFetch(url: string, options: RequestInit = {}) {
  const token = getToken();
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    logout();
    throw new Error('Oturum süresi doldu');
  }
  
  return response;
}