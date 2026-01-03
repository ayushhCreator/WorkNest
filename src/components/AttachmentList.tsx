import React from 'react';
import { Download, File, Image, FileText, X, Eye } from 'lucide-react';

interface Attachment {
  _id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimetype: string;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  uploadedAt: string;
}

interface AttachmentListProps {
  attachments: Attachment[];
  onDelete?: (attachmentId: string) => void;
  canDelete?: boolean;
}

const AttachmentList: React.FC<AttachmentListProps> = ({ 
  attachments, 
  onDelete, 
  canDelete = false 
}) => {
  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-500" />;
    } else if (mimetype === 'application/pdf') {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else {
      return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (mimetype: string) => mimetype.startsWith('image/');

  if (attachments.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        No attachments yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {attachments.map((attachment) => (
        <div key={attachment._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          {getFileIcon(attachment.mimetype)}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {attachment.originalName}
              </p>
              <span className="text-xs text-gray-500">
                {formatFileSize(attachment.size)}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Uploaded by {attachment.uploadedBy.name} • {new Date(attachment.uploadedAt).toLocaleDateString()}
            </p>
          </div>

          {isImage(attachment.mimetype) && (
            <img
              src={attachment.url}
              alt={attachment.originalName}
              className="w-10 h-10 object-cover rounded"
            />
          )}

          <div className="flex items-center space-x-1">
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </a>
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </a>
            
            {canDelete && onDelete && (
              <button
                onClick={() => onDelete(attachment._id)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AttachmentList;