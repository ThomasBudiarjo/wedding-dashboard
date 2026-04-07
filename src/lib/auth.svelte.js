import pb from './pb.js';

let user = $state(null);
let isSuperuser = $state(false);
let isLoggedIn = $derived(!!user);

export function getUser() {
  return user;
}

export function getIsSuperuser() {
  return isSuperuser;
}

export function getIsLoggedIn() {
  return isLoggedIn;
}

export function initAuth() {
  if (pb.authStore.isValid && pb.authStore.record) {
    user = pb.authStore.record;
    isSuperuser = pb.authStore.record.collectionName === '_superusers';
  }
}

export async function login(email, password) {
  // Try superuser first
  try {
    const result = await pb.collection('_superusers').authWithPassword(email, password);
    user = result.record;
    isSuperuser = true;
    return;
  } catch (e) {
    // Not a superuser, try regular user
  }

  try {
    const result = await pb.collection('users').authWithPassword(email, password);
    user = result.record;
    isSuperuser = false;
  } catch (e) {
    throw new Error('Invalid email or password');
  }
}

export function logout() {
  pb.authStore.clear();
  user = null;
  isSuperuser = false;
  navigate('#/');
}

function navigate(hash) {
  window.location.hash = hash;
}
