"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import Image from 'next/image';

interface ImageUploadZoneProps {
  exhibitionId: string;
  currentImages: string[];
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: string) => void;
  onDeleteImage?: (url: string) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  bucket?: 'exhibition-images' | 'show-images';
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
}

export function ImageUploadZone({
  exhibitionId,
  currentImages,
  onUploadSuccess,
  onUploadError,
  onDeleteImage,
  maxFiles = 10,
  maxSizeMB = 5,
  bucket = 'exhibition-images'
}: ImageUploadZoneProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map());

  const uploadFile = async (file: File) => {
    const fileId = `${file.name}-${Date.now()}`;
    
    // Add to uploading files
    setUploadingFiles(prev => new Map(prev).set(fileId, {
      file,
      progress: 0,
      status: 'uploading'
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      formData.append('entityId', exhibitionId);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Update status to success
      setUploadingFiles(prev => {
        const updated = new Map(prev);
        updated.set(fileId, {
          file,
          progress: 100,
          status: 'success',
          url: data.url
        });
        return updated;
      });

      // Call success callback
      onUploadSuccess(data.url);
      toast.success(`${file.name} uploaded successfully`);

      // Remove from uploading files after 2 seconds
      setTimeout(() => {
        setUploadingFiles(prev => {
          const updated = new Map(prev);
          updated.delete(fileId);
          return updated;
        });
      }, 2000);

    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Update status to error
      setUploadingFiles(prev => {
        const updated = new Map(prev);
        updated.set(fileId, {
          file,
          progress: 0,
          status: 'error',
          error: error.message
        });
        return updated;
      });

      // Call error callback
      if (onUploadError) {
        onUploadError(error.message);
      }
      
      toast.error(`Failed to upload ${file.name}: ${error.message}`);

      // Remove from uploading files after 5 seconds
      setTimeout(() => {
        setUploadingFiles(prev => {
          const updated = new Map(prev);
          updated.delete(fileId);
          return updated;
        });
      }, 5000);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Check if we're at max files
    const totalFiles = currentImages.length + uploadingFiles.size + acceptedFiles.length;
    if (totalFiles > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed`);
      return;
    }

    // Upload each file
    for (const file of acceptedFiles) {
      await uploadFile(file);
    }
  }, [currentImages.length, uploadingFiles.size, maxFiles]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: true,
    disabled: currentImages.length >= maxFiles
  });

  // Handle file rejections
  if (fileRejections.length > 0) {
    fileRejections.forEach(rejection => {
      const errors = rejection.errors.map(e => {
        if (e.code === 'file-too-large') {
          return `File is too large. Maximum size is ${maxSizeMB}MB.`;
        }
        if (e.code === 'file-invalid-type') {
          return 'Invalid file type. Only JPEG, PNG, and WebP are allowed.';
        }
        return e.message;
      });
      toast.error(errors.join(' '));
    });
  }

  const handleDeleteImage = async (url: string) => {
    if (onDeleteImage) {
      onDeleteImage(url);
      toast.success('Image removed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <Card
        {...getRootProps()}
        className={`
          border-2 border-dashed p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
          ${currentImages.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload className={`w-12 h-12 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
          {isDragActive ? (
            <p className="text-lg font-medium">Drop images here...</p>
          ) : (
            <>
              <p className="text-lg font-medium">
                {currentImages.length >= maxFiles 
                  ? `Maximum ${maxFiles} images reached`
                  : 'Drag & drop images here, or click to select'
                }
              </p>
              <p className="text-sm text-muted-foreground">
                JPEG, PNG, WebP up to {maxSizeMB}MB each
              </p>
              <p className="text-xs text-muted-foreground">
                {currentImages.length} / {maxFiles} images uploaded
              </p>
            </>
          )}
        </div>
      </Card>

      {/* Uploading Files */}
      {uploadingFiles.size > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploading...</h4>
          {Array.from(uploadingFiles.values()).map((uploadingFile, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center gap-3">
                {uploadingFile.status === 'uploading' && (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                )}
                {uploadingFile.status === 'success' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {uploadingFile.status === 'error' && (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{uploadingFile.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadingFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {uploadingFile.status === 'error' && uploadingFile.error && (
                    <p className="text-xs text-destructive mt-1">{uploadingFile.error}</p>
                  )}
                </div>

                {uploadingFile.status === 'uploading' && (
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadingFile.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Current Images */}
      {currentImages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentImages.map((url, index) => (
              <Card key={index} className="relative group overflow-hidden">
                <div className="aspect-square relative">
                  <Image
                    src={url}
                    alt={`Exhibition image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  {onDeleteImage && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteImage(url)}
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {currentImages.length === 0 && uploadingFiles.size === 0 && (
        <Card className="p-8 text-center border-dashed">
          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No images uploaded yet</p>
        </Card>
      )}
    </div>
  );
}
