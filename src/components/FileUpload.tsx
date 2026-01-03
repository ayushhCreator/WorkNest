import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle2 } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  loading?: boolean;
  progress?: number;
  success?: string;
  maxSize?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileUpload, 
  loading = false,
  progress = 0,
  success = '',
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
            : success 
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} disabled={loading} />
        
        {loading ? (
          <div className="space-y-3">
            <div className="flex justify-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-sm text-gray-600">Uploading...</p>
            {/* Progress Bar */}
            {progress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[200px] mx-auto overflow-hidden">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
            <p className="text-xs text-gray-500">{progress}%</p>
          </div>
        ) : success ? (
          <div className="space-y-2 animate-fadeIn">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
            <p className="text-sm font-medium text-green-700">{success}</p>
            <p className="text-xs text-green-600">Drag another file to upload</p>
          </div>
        ) : isDragActive ? (
          <>
            <Upload className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-blue-600">Drop the file here...</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <div>
              <p className="text-sm text-gray-600 mb-1">
                Drag & drop a file here, or click to select
              </p>
              <p className="text-xs text-gray-400">
                Supports images, PDF, DOC, DOCX, TXT (max 10MB)
              </p>
            </div>
          </>
        )}
      </div>

      {fileRejections.length > 0 && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {fileRejections[0].errors.map((error) => (
            <p key={error.code}>{error.message}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;