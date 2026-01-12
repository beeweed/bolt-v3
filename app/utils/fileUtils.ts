export interface FileAttachment {
  type: 'image' | 'document';
  name: string;
  size: number;
  mimeType: string;
  data: string; // base64 data URL
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

export const ACCEPTED_DOCUMENT_TYPES: string[] = [
  /*
   * Document support may require additional backend configuration
   * depending on the AI provider's capabilities
   */
];

export const ACCEPTED_FILE_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_DOCUMENT_TYPES];

export function isImageFile(mimeType: string): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(mimeType);
}

export function isAcceptedFileType(mimeType: string): boolean {
  return ACCEPTED_FILE_TYPES.includes(mimeType);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return bytes + ' B';
  }

  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB';
  }

  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export async function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function createFileAttachment(file: File, base64Data: string): FileAttachment {
  return {
    type: isImageFile(file.type) ? 'image' : 'document',
    name: file.name,
    size: file.size,
    mimeType: file.type,
    data: base64Data,
  };
}
