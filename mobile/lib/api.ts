import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Use your actual API URL here
const BASE_URL = __DEV__
  ? Platform.OS === "android"
    ? "http://10.0.2.2:3000" // Android emulator
    : "http://localhost:3000"
  : "https://buzz2remote.com";

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync("auth_token");
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync("auth_token", token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync("auth_token");
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data as T;
}

// Auth
export async function login(email: string, password: string) {
  const data = await apiFetch<{ token: string; user: User }>("/auth/mobile-login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  await setToken(data.token);
  return data;
}

export async function register(name: string, email: string, password: string) {
  await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  // Auto-login after register
  return login(email, password);
}

export async function logout() {
  await clearToken();
}

// Types
export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  subscriptionPlan: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  job_type: string | null;
  remote_type: string | null;
  experience_level: string | null;
  skills: string[] | null;
  apply_url: string | null;
  posted_date: string | null;
  description?: string;
  requirements?: string;
  benefits?: string;
}

export interface Application {
  id: string;
  status: string;
  applied_at: string;
  jobs: {
    id: string;
    title: string;
    company: string;
    location: string | null;
  };
}

export interface Profile {
  id: string;
  profile_name: string;
  is_default: boolean;
  title: string | null;
  bio: string | null;
  skills: { name: string }[] | null;
  resume_url: string | null;
}
