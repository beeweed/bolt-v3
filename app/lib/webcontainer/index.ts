/*
 * WebContainer is disabled - files are stored in localStorage only
 * This file is kept for compatibility but does not boot WebContainer
 */

interface WebContainerContext {
  loaded: boolean;
}

export const webcontainerContext: WebContainerContext = {
  loaded: false,
};

// WebContainer is not used in this simplified version
export const webcontainer = null;
