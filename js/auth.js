const PASSWORD_KEY = 'lop84_password_hash';

export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getPasswordHash() {
  return localStorage.getItem(PASSWORD_KEY);
}

export function setPasswordHash(hash) {
  localStorage.setItem(PASSWORD_KEY, hash);
}