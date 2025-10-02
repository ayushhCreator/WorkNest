import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload} from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  loading?: boolean;
  accept?: string;
  maxSize?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileUpload, 
  loading = false,
  accept = 'image/*,.pdf,.doc,.docx,.txt',
  maxSize = 10 * 1024 * 1024 // 10MB
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize,
    multiple: false
  });

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} disabled={loading} />
        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        {loading ? (
          <p className="text-sm text-gray-600">Uploading...</p>
        ) : isDragActive ? (
          <p className="text-sm text-blue-600">Drop the file here...</p>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-1">
              Drag & drop a file here, or click to select
            </p>
            <p className="text-xs text-gray-400">
              Supports images, PDF, DOC, DOCX, TXT (max 10MB)
            </p>
          </div>
        )}
      </div>

      {fileRejections.length > 0 && (
        <div className="text-sm text-red-600">
          {fileRejections[0].errors.map((error) => (
            <p key={error.code}>{error.message}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;