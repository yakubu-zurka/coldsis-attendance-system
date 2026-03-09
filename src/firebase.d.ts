declare module 'firebase/app' {
  export * from '@firebase/app';
}

declare module 'firebase/auth' {
  export * from '@firebase/auth';
  export { getAuth } from '@firebase/auth';
  export { signInWithEmailAndPassword } from '@firebase/auth';
  export { signOut } from '@firebase/auth';
  export { onAuthStateChanged } from '@firebase/auth';
  export { User } from '@firebase/auth';
}

declare module 'firebase/database' {
  export * from '@firebase/database';
  export { getDatabase } from '@firebase/database';
  export { ref } from '@firebase/database';
  export { onValue } from '@firebase/database';
  export { set } from '@firebase/database';
  export { push } from '@firebase/database';
  export { remove } from '@firebase/database';
  export { update } from '@firebase/database';
}
