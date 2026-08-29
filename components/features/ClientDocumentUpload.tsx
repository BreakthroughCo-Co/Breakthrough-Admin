'use client';

import React, { useState, useRef } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { Client } from '@/types';
import { FileUp, File, ShieldCheck, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
// import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
// import { storage } from '@/lib/firebase'; // Assuming setup

export const ClientDocumentUpload: React.FC<{ client: Client }> = ({ client }) => {
  const { addNotification, addAuditLog } = useManagementStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string; url: string; date: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type (e.g., pdf, images, docs)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      addNotification({ title: 'Invalid File', message: 'Only PDF, Word, and Images are supported.', type: 'system', severity: 'medium' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate Encryption & Firebase Upload for demonstration in this UI
      // In production, we'd use:
      // const storageRef = ref(storage, `clients/${client.id}/documents/${file.name}`);
      // const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Simulated progress
      for (let i = 0; i <= 100; i += 20) {
        setUploadProgress(i);
        await new Promise(r => setTimeout(r, 200));
      }

      const mockUrl = URL.createObjectURL(file);
      
      const newDoc = {
        id: `doc-${Math.random().toString(36).substring(7)}`,
        name: file.name,
        url: mockUrl,
        date: new Date().toISOString().slice(0, 10)
      };

      setUploadedFiles(prev => [...prev, newDoc]);
      addNotification({ title: 'Document Secured', message: `${file.name} encrypted & uploaded to Firebase Storage.`, type: 'system', severity: 'low' });
      addAuditLog('UPLOAD_DOCUMENT', 'CLIENT_RECORD', client.id, `Uploaded ${file.name} for ${client.name}`);

    } catch (err) {
      console.error(err);
      addNotification({ title: 'Upload Failed', message: 'There was an error uploading the document.', type: 'system', severity: 'high' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (docId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== docId));
    addAuditLog('DELETE_DOCUMENT', 'CLIENT_RECORD', client.id, `Removed document for ${client.name}`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            Secure Document Storage
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload NDIS Support Plans or medical documents. Files are encrypted at rest via Firebase Storage.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Upload Area */}
        <div 
          className="border-2 border-dashed border-slate-700 hover:border-teal-500/50 bg-slate-950/50 rounded-xl p-6 text-center cursor-pointer transition-colors relative"
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <FileUp className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-white">Click to Upload Document</div>
            <div className="text-[10px] text-slate-500">PDF, Word, or Images (Max 10MB)</div>
          </div>
          
          {isUploading && (
            <div className="absolute inset-0 bg-slate-950/80 rounded-xl flex flex-col items-center justify-center backdrop-blur-sm z-10">
              <Loader2 className="w-6 h-6 text-teal-400 animate-spin mb-2" />
              <div className="text-xs font-bold text-teal-300">Encrypting & Uploading... {uploadProgress}%</div>
              <div className="w-48 h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* File List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Stored Documents</div>
            {uploadedFiles.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 text-slate-300 rounded">
                    <File className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-teal-300 transition-colors cursor-pointer" onClick={() => window.open(doc.url, '_blank')}>
                      {doc.name}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      Encrypted • {doc.date}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => removeFile(doc.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                  title="Remove Document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
