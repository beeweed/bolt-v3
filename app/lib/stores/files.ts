import { map, type MapStore } from 'nanostores';
import * as nodePath from 'node:path';
import { WORK_DIR } from '~/utils/constants';
import { computeFileModifications } from '~/utils/diff';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('FilesStore');

const STORAGE_KEY = 'bolt-files';

export interface File {
  type: 'file';
  content: string;
  isBinary: boolean;
}

export interface Folder {
  type: 'folder';
}

type Dirent = File | Folder;

export type FileMap = Record<string, Dirent | undefined>;

export class FilesStore {
  #size = 0;
  #modifiedFiles: Map<string, string> = import.meta.hot?.data.modifiedFiles ?? new Map();
  files: MapStore<FileMap> = import.meta.hot?.data.files ?? map({});

  get filesCount() {
    return this.#size;
  }

  constructor() {
    if (import.meta.hot) {
      import.meta.hot.data.files = this.files;
      import.meta.hot.data.modifiedFiles = this.#modifiedFiles;
    }

    this.#loadFromStorage();
  }

  #loadFromStorage() {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored) as FileMap;

        for (const [path, dirent] of Object.entries(parsed)) {
          if (dirent) {
            this.files.setKey(path, dirent);

            if (dirent.type === 'file') {
              this.#size++;
            }
          }
        }
        logger.info('Loaded files from localStorage');
      }
    } catch (error) {
      logger.error('Failed to load files from localStorage', error);
    }
  }

  #saveToStorage() {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const files = this.files.get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    } catch (error) {
      logger.error('Failed to save files to localStorage', error);
    }
  }

  getFile(filePath: string) {
    const dirent = this.files.get()[filePath];

    if (dirent?.type !== 'file') {
      return undefined;
    }

    return dirent;
  }

  getFileModifications() {
    return computeFileModifications(this.files.get(), this.#modifiedFiles);
  }

  resetFileModifications() {
    this.#modifiedFiles.clear();
  }

  async saveFile(filePath: string, content: string) {
    try {
      const oldContent = this.getFile(filePath)?.content;

      if (!this.#modifiedFiles.has(filePath) && oldContent !== undefined) {
        this.#modifiedFiles.set(filePath, oldContent);
      }

      this.files.setKey(filePath, { type: 'file', content, isBinary: false });
      this.#saveToStorage();

      logger.info('File updated');
    } catch (error) {
      logger.error('Failed to update file content\n\n', error);
      throw error;
    }
  }

  async writeFile(filePath: string, content: string) {
    const normalizedPath = filePath.startsWith(WORK_DIR) ? filePath : `${WORK_DIR}/${filePath}`;

    const folder = nodePath.dirname(normalizedPath);

    if (folder !== '.' && folder !== WORK_DIR) {
      this.#ensureFolderExists(folder);
    }

    const existingFile = this.getFile(normalizedPath);

    if (!existingFile) {
      this.#size++;
    }

    this.files.setKey(normalizedPath, { type: 'file', content, isBinary: false });
    this.#saveToStorage();

    logger.debug(`File written: ${normalizedPath}`);
  }

  #ensureFolderExists(folderPath: string) {
    const parts = folderPath.split('/').filter(Boolean);
    let currentPath = '';

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;

      const existing = this.files.get()[currentPath];

      if (!existing) {
        this.files.setKey(currentPath, { type: 'folder' });
      }
    }
  }

  clearFiles() {
    this.files.set({});
    this.#size = 0;
    this.#modifiedFiles.clear();

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
