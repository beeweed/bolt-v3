import { useRef, type ChangeEvent } from 'react';
import {
  type FileAttachment,
  MAX_FILE_SIZE,
  ACCEPTED_FILE_TYPES,
  isAcceptedFileType,
  formatFileSize,
  convertFileToBase64,
  createFileAttachment,
} from '~/utils/fileUtils';

interface FileUploadProps {
  files: FileAttachment[];
  onFilesChange: (files: FileAttachment[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export function FileUpload({ files, onFilesChange, onError, disabled = false }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: FileAttachment[] = [];

    for (const file of selectedFiles) {
      if (file.size > MAX_FILE_SIZE) {
        onError?.(`File ${file.name} is too large. Maximum size: ${formatFileSize(MAX_FILE_SIZE)}`);
        continue;
      }

      if (!isAcceptedFileType(file.type)) {
        onError?.(`File type ${file.type} is not supported`);
        continue;
      }

      try {
        const base64Data = await convertFileToBase64(file);
        const attachment = createFileAttachment(file, base64Data);
        newFiles.push(attachment);
      } catch {
        onError?.(`Failed to process file ${file.name}`);
      }
    }

    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-2">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="relative group flex items-center gap-2 px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg"
            >
              <div className="flex items-center gap-2">
                {file.type === 'image' ? (
                  <div className="w-10 h-10 rounded overflow-hidden bg-bolt-elements-background-depth-3">
                    <img src={file.data} alt={file.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded bg-bolt-elements-background-depth-3 flex items-center justify-center text-bolt-elements-textSecondary">
                    📄
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-xs text-bolt-elements-textPrimary truncate max-w-[150px]">{file.name}</span>
                  <span className="text-xs text-bolt-elements-textSecondary">{formatFileSize(file.size)}</span>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="ml-2 p-1 rounded hover:bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
                title="Remove file"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={ACCEPTED_FILE_TYPES.join(',')}
        multiple
        className="hidden"
        disabled={disabled}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="p-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Upload files or images"
      >
        <div className="i-ph:paperclip text-xl"></div>
      </button>
    </div>
  );
}
