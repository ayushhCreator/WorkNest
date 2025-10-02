import React, { useState } from 'react';
import axios from '../utils/axios';
import FileUpload from './FileUpload';

interface Attachment {
  _id: string;
  name: string;
  url: string;
}

interface Props {
  taskId: string;
  existingAttachments: Attachment[];
}

export default function TaskAttachments({ taskId, existingAttachments }: Props) {
  const [attachments, setAttachments] = useState(existingAttachments);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileUpload = async (file: File) => {
    // Check for duplicates
    const exists = attachments.some(att => att.name === file.name);
    if (exists) {
      setMessage('⚠️ This file is already uploaded.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await axios.post(
        `/api/tasks/${taskId}/attachments`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      // Add new attachment to list
      setAttachments(prev => [...prev, data.attachment]);
      setMessage('✅ File uploaded successfully!');
    } catch (err) {
      console.error(err);
      setMessage('❌ Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <FileUpload onFileUpload={handleFileUpload} loading={loading} />
      {message && <p className="text-sm text-gray-700">{message}</p>}

      <div>
        <h4 className="font-semibold mb-2">Attached Files:</h4>
        <ul className="list-disc pl-5">
          {attachments.map(att => (
            <li key={att._id}>
              <a href={att.url} target="_blank" rel="noopener noreferrer">
                {att.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
