import React, { useState } from 'react';
import {
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Copy,
  MessageCircle,
  Mail,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const SocialShare = ({
  propertyTitle,
  propertyUrl,
  propertyImage,
  description = "Check out this amazing property!",
  trigger = null // Custom trigger component
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const shareUrl = propertyUrl || window.location.href;
  const shareText = `${propertyTitle} - ${description}`;
  const shareImage = propertyImage || '';

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: propertyTitle,
          text: shareText,
          url: shareUrl,
        });
        setIsOpen(false);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          toast.error('Failed to share');
        }
      }
    } else {
      // Fallback to showing share options
      setIsOpen(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
      setIsOpen(false);
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(url, '_blank');
    setIsOpen(false);
  };

  const handleEmailShare = () => {
    const subject = `Check out this property: ${propertyTitle}`;
    const body = `${shareText}\n\n${shareUrl}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
    setIsOpen(false);
  };

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: Copy,
      action: handleCopyLink,
      color: 'text-gray-600 hover:text-gray-800'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      action: handleFacebookShare,
      color: 'text-blue-600 hover:text-blue-800'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      action: handleTwitterShare,
      color: 'text-sky-500 hover:text-sky-700'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      action: handleLinkedInShare,
      color: 'text-blue-700 hover:text-blue-900'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      action: handleWhatsAppShare,
      color: 'text-green-600 hover:text-green-800'
    },
    {
      name: 'Email',
      icon: Mail,
      action: handleEmailShare,
      color: 'text-gray-600 hover:text-gray-800'
    }
  ];

  return (
    <div className="relative">
      {trigger ? (
        <div onClick={handleNativeShare}>
          {trigger}
        </div>
      ) : (
        <button
          onClick={handleNativeShare}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-sm">Share</span>
        </button>
      )}

      {/* Share Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 px-2">
              Share this property
            </div>
            <div className="space-y-1">
              {shareOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={option.action}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${option.color}`}
                >
                  <option.icon className="w-4 h-4" />
                  <span>{option.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

// Property Share Button Component
export const PropertyShareButton = ({
  property,
  variant = 'default',
  size = 'medium',
  className = ''
}) => {
  const propertyUrl = `${window.location.origin}/properties/${property.id}`;
  const propertyTitle = property.title || 'Amazing Property';

  const triggerComponent = (
    <button
      className={`flex items-center space-x-2 transition-colors ${
        variant === 'outline'
          ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
          : 'text-gray-600 hover:text-gray-800'
      } ${size === 'small' ? 'px-3 py-2 text-sm' : 'px-4 py-3'} rounded-lg ${className}`}
    >
      <Share2 className={size === 'small' ? 'w-4 h-4' : 'w-5 h-5'} />
      <span>{size === 'small' ? 'Share' : 'Share Property'}</span>
    </button>
  );

  return (
    <SocialShare
      propertyTitle={propertyTitle}
      propertyUrl={propertyUrl}
      propertyImage={property.images?.[0]}
      description={`Beautiful ${property.property_type || 'property'} in ${property.location} for ₦${property.price?.toLocaleString()}`}
      trigger={triggerComponent}
    />
  );
};

export default SocialShare;
