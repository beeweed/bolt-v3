import { atom } from 'nanostores';

export type Mode = 'build' | 'chat';

export const kMode = 'bolt_mode';

export function modeIsBuild() {
  return modeStore.get() === 'build';
}

export function modeIsChat() {
  return modeStore.get() === 'chat';
}

export const DEFAULT_MODE = 'build';

export const modeStore = atom<Mode>(initStore());

function initStore() {
  if (!import.meta.env.SSR) {
    const persistedMode = localStorage.getItem(kMode) as Mode | undefined;
    const validModes: Mode[] = ['build', 'chat'];

    if (persistedMode && validModes.includes(persistedMode)) {
      return persistedMode;
    }
  }

  return DEFAULT_MODE;
}

export function setMode(mode: Mode) {
  modeStore.set(mode);

  if (!import.meta.env.SSR) {
    localStorage.setItem(kMode, mode);
  }
}
