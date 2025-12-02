import React, { useState, useRef } from 'react';
import { Upload, X, Film, Loader } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const PropertyVideoUpload = ({ videos = [], onChange, brand = {}, userId }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  const primary = brand?.primary || '#FF6B35';

  // Maximum 3 videos, 100MB each
  const MAX_VIDEOS = 3;
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    
    if (videos.length + files.length > MAX_VIDEOS) {
      toast.error(`Maximum ${MAX_VIDEOS} videos allowed`);
      return;
    }

    setUploading(true);

    try {
      const uploadedVideos = [];

      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('video/')) {
          toast.error(`${file.name} is not a video file`);
          continue;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name} exceeds 100MB limit`);
          continue;
        }

        // Generate unique file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to Supabase Storage
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        const { data, error } = await supabase.storage
          .from('property-videos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Upload error:', error);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('property-videos')
          .getPublicUrl(fileName);

        // Get video duration
        const duration = await getVideoDuration(file);

        uploadedVideos.push({
          url: publicUrl,
          filename: file.name,
          size: file.size,
          duration: Math.round(duration),
          path: fileName // Store path for deletion
        });

        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      }

      onChange([...videos, ...uploadedVideos]);
      toast.success(`${uploadedVideos.length} video(s) uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload videos');
    } finally {
      setUploading(false);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };

      video.onerror = () => {
        resolve(0);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleRemove = async (index) => {
    const videoToRemove = videos[index];
    
    // Delete from Supabase Storage if it has a path
    if (videoToRemove.path) {
      try {
        await supabase.storage
          .from('property-videos')
          .remove([videoToRemove.path]);
      } catch (error) {
        console.error('Error deleting video:', error);
      }
    }

    const newVideos = videos.filter((_, i) => i !== index);
    onChange(newVideos);
    toast.success('Video removed');
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/mov,video/quicktime"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || videos.length >= MAX_VIDEOS}
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || videos.length >= MAX_VIDEOS}
          className={`w-full border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
            uploading || videos.length >= MAX_VIDEOS
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-[#FF6B35] hover:bg-orange-50 cursor-pointer'
          }`}
          style={{
            borderColor: uploading || videos.length >= MAX_VIDEOS ? undefined : primary + '40'
          }}
        >
          <div className="flex flex-col items-center space-y-3">
            {uploading ? (
              <Loader className="w-10 h-10 text-gray-400 animate-spin" />
            ) : (
              <Film className="w-10 h-10 text-gray-400" />
            )}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {uploading ? 'Uploading videos...' : 'Click to upload videos'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                MP4, WebM, MOV up to 100MB • Max {MAX_VIDEOS} videos • {videos.length}/{MAX_VIDEOS} uploaded
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Video List */}
      <AnimatePresence>
        {videos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {videos.map((video, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
              >
                {/* Video Preview */}
                <div className="relative aspect-video bg-gray-900">
                  <video
                    src={video.url}
                    className="w-full h-full object-cover"
                    preload="metadata"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="bg-white bg-opacity-90 rounded-full p-3">
                      <Film className="w-6 h-6 text-gray-700" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration || 0)}
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {video.filename || 'Video'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(video.size || 0)}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Upload Progress */}
                {uploadProgress[video.filename] !== undefined && uploadProgress[video.filename] < 100 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                    <div
                      className="h-full bg-[#FF6B35] transition-all duration-300"
                      style={{ width: `${uploadProgress[video.filename]}%` }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PropertyVideoUpload;
