import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Plus,
  Search,
  Filter,
  Calendar,
  File,
  Image,
  Video,
  Music,
  Archive,
  CheckCircle,
  X,
  AlertTriangle,
  Lock,
  Unlock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const PropertyDocuments = ({ propertyId }) => {
  const { user, isAuthenticated } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    file: null,
    name: '',
    description: '',
    category: 'general',
    isPublic: false
  });

  useEffect(() => {
    if (isAuthenticated && propertyId) {
      loadDocuments();
    }
  }, [isAuthenticated, propertyId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);

      // Mock documents data - in real implementation, this would query a documents table
      const mockDocuments = [
        {
          id: 1,
          name: 'Property Title Deed',
          filename: 'title_deed.pdf',
          type: 'pdf',
          size: 2457600, // 2.4 MB
          category: 'legal',
          isPublic: false,
          uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          uploadedBy: user?.id,
          description: 'Official property ownership document'
        },
        {
          id: 2,
          name: 'Property Photos',
          filename: 'property_photos.zip',
          type: 'archive',
          size: 15728640, // 15 MB
          category: 'media',
          isPublic: true,
          uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
          uploadedBy: user?.id,
          description: 'High-resolution property images for marketing'
        },
        {
          id: 3,
          name: 'Property Survey',
          filename: 'survey_report.pdf',
          type: 'pdf',
          size: 1048576, // 1 MB
          category: 'legal',
          isPublic: false,
          uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
          uploadedBy: user?.id,
          description: 'Land survey and boundary documentation'
        },
        {
          id: 4,
          name: 'Virtual Tour Video',
          filename: 'virtual_tour.mp4',
          type: 'video',
          size: 52428800, // 50 MB
          category: 'media',
          isPublic: true,
          uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          uploadedBy: user?.id,
          description: '360° virtual tour of the property'
        }
      ];

      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setUploadForm(prev => ({ ...prev, file }));
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.name.trim()) {
      toast.error('Please select a file and enter a name');
      return;
    }

    try {
      setUploading(true);

      // Determine file type
      const fileExtension = uploadForm.file.name.split('.').pop().toLowerCase();
      let fileType = 'other';

      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
        fileType = 'image';
      } else if (['pdf'].includes(fileExtension)) {
        fileType = 'pdf';
      } else if (['mp4', 'avi', 'mov', 'wmv'].includes(fileExtension)) {
        fileType = 'video';
      } else if (['mp3', 'wav', 'aac'].includes(fileExtension)) {
        fileType = 'audio';
      } else if (['zip', 'rar', '7z', 'tar'].includes(fileExtension)) {
        fileType = 'archive';
      }

      // In a real implementation, this would upload to Supabase Storage
      const newDocument = {
        id: Date.now(),
        name: uploadForm.name,
        filename: uploadForm.file.name,
        type: fileType,
        size: uploadForm.file.size,
        category: uploadForm.category,
        isPublic: uploadForm.isPublic,
        uploadedAt: new Date(),
        uploadedBy: user.id,
        description: uploadForm.description
      };

      setDocuments(prev => [newDocument, ...prev]);
      setShowUploadModal(false);

      // Reset form
      setUploadForm({
        file: null,
        name: '',
        description: '',
        category: 'general',
        isPublic: false
      });

      toast.success('Document uploaded successfully!');
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleDownload = (document) => {
    // In a real implementation, this would generate a download URL from Supabase Storage
    toast.success(`Downloading ${document.name}...`);
  };

  const handlePreview = (document) => {
    // In a real implementation, this would open a preview modal or redirect to view
    toast.info(`Previewing ${document.name}...`);
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />;
      case 'image':
        return <Image className="w-8 h-8 text-blue-500" />;
      case 'video':
        return <Video className="w-8 h-8 text-purple-500" />;
      case 'audio':
        return <Music className="w-8 h-8 text-green-500" />;
      case 'archive':
        return <Archive className="w-8 h-8 text-gray-500" />;
      default:
        return <File className="w-8 h-8 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || doc.category === filterType;
    return matchesSearch && matchesFilter;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please log in to manage property documents</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Property Documents</h1>
                <p className="text-gray-600">Manage and organize all property-related documents</p>
              </div>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-2 bg-[#FF6B35] text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="legal">Legal Documents</option>
                <option value="media">Media Files</option>
                <option value="financial">Financial</option>
                <option value="maintenance">Maintenance</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#FF6B35]"></div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Documents Found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm || filterType !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Upload your first document to get started.'}
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Upload First Document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDocuments.map((document) => (
              <motion.div
                key={document.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Document Preview */}
                <div className="relative h-32 bg-gray-50 flex items-center justify-center">
                  {getFileIcon(document.type)}

                  {/* Privacy Badge */}
                  <div className="absolute top-2 right-2">
                    {document.isPublic ? (
                      <Unlock className="w-4 h-4 text-green-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      document.category === 'legal' ? 'bg-red-100 text-red-800' :
                      document.category === 'media' ? 'bg-blue-100 text-blue-800' :
                      document.category === 'financial' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {document.category}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                    {document.name}
                  </h3>

                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {document.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{formatFileSize(document.size)}</span>
                    <span>{document.uploadedAt.toLocaleDateString()}</span>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePreview(document)}
                      className="flex-1 flex items-center justify-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">Preview</span>
                    </button>

                    <button
                      onClick={() => handleDownload(document)}
                      className="flex items-center justify-center space-x-1 text-green-600 hover:text-green-800 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteDocument(document.id)}
                      className="flex items-center justify-center space-x-1 text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Storage Usage */}
        <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Usage</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#FF6B35] mb-1">
                {formatFileSize(documents.reduce((total, doc) => total + doc.size, 0))}
              </div>
              <div className="text-sm text-gray-600">Total Storage Used</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {documents.length}
              </div>
              <div className="text-sm text-gray-600">Total Documents</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {documents.filter(doc => doc.category === 'legal').length}
              </div>
              <div className="text-sm text-gray-600">Legal Documents</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#FF6B35] h-2 rounded-full"
                style={{
                  width: `${Math.min((documents.reduce((total, doc) => total + doc.size, 0) / (500 * 1024 * 1024)) * 100, 100)}%`
                }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {formatFileSize(documents.reduce((total, doc) => total + doc.size, 0))} of 500 MB used
            </p>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Upload Document</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Name *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    placeholder="Enter document name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File *
                  </label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.zip,.rar"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PDF, DOC, Images, Videos, Archives (max 50MB)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  >
                    <option value="general">General</option>
                    <option value="legal">Legal Documents</option>
                    <option value="media">Media Files</option>
                    <option value="financial">Financial</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    placeholder="Brief description of the document"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={uploadForm.isPublic}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35]"
                  />
                  <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                    Make this document publicly accessible
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleUpload}
                  disabled={uploading || !uploadForm.file || !uploadForm.name.trim()}
                  className="flex-1 bg-[#FF6B35] text-white py-3 px-6 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent inline-block mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 inline-block mr-2" />
                      Upload Document
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PropertyDocuments;
