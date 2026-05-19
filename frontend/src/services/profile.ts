export type UserProfile = {
  id: string;
  age: number | null;
  gender: string;
  past_medication: string[];
  allergies: string[];
  avoid_list: string[];
  diet_type: string;
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://127.0.0.1:8000';
const storageKey = (userId: string) => `informula_profile_${userId}`;

export function defaultProfile(userId: string): UserProfile {
  return {
    id: userId,
    age: null,
    gender: '',
    past_medication: [],
    allergies: [],
    avoid_list: [],
    diet_type: '',
  };
}

function fromStorage(userId: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function toStorage(profile: UserProfile) {
  localStorage.setItem(storageKey(profile.id), JSON.stringify(profile));
}

export async function loadProfile(userId: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/api/profile/${encodeURIComponent(userId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.id) {
        toStorage(data);
        return data as UserProfile;
      }
    }
  } catch {
    // fall through to local storage
  }
  return fromStorage(userId);
}

export async function saveProfile(profile: UserProfile): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (res.ok) {
      toStorage(profile);
      return true;
    }
  } catch {
    // fall through to local storage
  }
  toStorage(profile);
  return true;
}
