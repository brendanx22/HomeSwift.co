import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, Share2, ZoomIn } from 'lucide-react';

const ImageGallery = ({ images, title, alt }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const openLightbox = (index) => {
    setSelectedImageIndex(index);
    setIsFullscreen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setIsFullscreen(false);
    setSelectedImageIndex(null);
    document.body.style.overflow = 'unset';
  };

  const nextImage = () => {
    if (selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowRight') {
      nextImage();
    } else if (e.key === 'ArrowLeft') {
      prevImage();
    }
  };

  React.useEffect(() => {
    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isFullscreen, selectedImageIndex]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Check out this property: ${title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = images[selectedImageIndex];
    link.download = `${title}-image-${selectedImageIndex + 1}.jpg`;
    link.click();
  };

  return (
    <>
      {/* Thumbnail Gallery */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {images.map((image, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => openLightbox(index)}
          >
            <img
              src={image}
              alt={`${alt} - Image ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />

            {/* Overlay with zoom icon */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Image counter for multiple images */}
            {images.length > 1 && index === 0 && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                1/{images.length}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-60"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Main image */}
            <motion.div
              key={selectedImageIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={images[selectedImageIndex]}
                alt={`${alt} - Image ${selectedImageIndex + 1}`}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              />

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    disabled={selectedImageIndex === 0}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-12 h-12" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    disabled={selectedImageIndex === images.length - 1}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-12 h-12" />
                  </button>
                </>
              )}

              {/* Image counter and actions */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black bg-opacity-60 rounded-full px-4 py-2">
                <span className="text-white text-sm">
                  {selectedImageIndex + 1} / {images.length}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare();
                  }}
                  className="text-white hover:text-gray-300 transition-colors"
                  title="Share image"
                >
                  <Share2 className="w-5 h-5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                  className="text-white hover:text-gray-300 transition-colors"
                  title="Download image"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>

              {/* Thumbnail strip */}
              {images.length > 1 && (
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-2 max-w-[80vw] overflow-x-auto p-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex(index);
                      }}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === selectedImageIndex
                          ? 'border-white'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImageGallery;
