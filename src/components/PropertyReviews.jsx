import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  User,
  Calendar,
  Flag,
  MoreHorizontal,
  Edit3,
  Trash2,
  Send
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { trackEvent } from '../lib/posthog';
import { toast } from 'react-hot-toast';

const PropertyReviews = ({ propertyId, propertyTitle }) => {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState({
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0
  });

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
    pros: '',
    cons: '',
    recommend: true
  });

  useEffect(() => {
    loadReviews();
  }, [propertyId]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);

      // Mock data for now - in real implementation, this would query a reviews table
      const mockReviews = [
        {
          id: 1,
          user_id: 'user1',
          user_name: 'John Doe',
          user_avatar: null,
          rating: 5,
          title: 'Excellent Property!',
          comment: 'Beautiful apartment with great amenities. The location is perfect and the landlord was very responsive.',
          pros: 'Great location, Modern amenities, Responsive landlord',
          cons: 'Slightly expensive',
          recommend: true,
          helpful_votes: 12,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          verified: true
        },
        {
          id: 2,
          user_id: 'user2',
          user_name: 'Jane Smith',
          user_avatar: null,
          rating: 4,
          title: 'Good value for money',
          comment: 'Nice place overall. Clean and well-maintained. Only minor issues with parking.',
          pros: 'Clean, Well-maintained, Good value',
          cons: 'Limited parking',
          recommend: true,
          helpful_votes: 8,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
          updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
          verified: true
        },
        {
          id: 3,
          user_id: 'user3',
          user_name: 'Mike Johnson',
          user_avatar: null,
          rating: 3,
          title: 'Average experience',
          comment: 'Property is okay but could use some improvements. Maintenance was slow to respond.',
          pros: 'Decent location',
          cons: 'Slow maintenance, Some wear and tear',
          recommend: false,
          helpful_votes: 3,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21),
          updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21),
          verified: false
        }
      ];

      setReviews(mockReviews);

      // Calculate average rating and distribution
      const totalReviews = mockReviews.length;
      const sumRatings = mockReviews.reduce((sum, review) => sum + review.rating, 0);
      const avg = totalReviews > 0 ? sumRatings / totalReviews : 0;

      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      mockReviews.forEach(review => {
        distribution[review.rating]++;
      });

      setAverageRating(avg);
      setRatingDistribution(distribution);

      // Check if user already has a review
      // In real implementation, this would check the database
      // setUserReview(mockReviews.find(r => r.user_id === user?.id) || null);

    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    try {
      if (!reviewForm.title.trim() || !reviewForm.comment.trim()) {
        toast.error('Please fill in all required fields');
        return;
      }

      const newReview = {
        id: Date.now(),
        user_id: user.id,
        user_name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || 'Anonymous',
        user_avatar: null,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
        pros: reviewForm.pros,
        cons: reviewForm.cons,
        recommend: reviewForm.recommend,
        helpful_votes: 0,
        created_at: new Date(),
        updated_at: new Date(),
        verified: false
      };

      setReviews(prev => [newReview, ...prev]);
      setUserReview(newReview);
      setIsWritingReview(false);

      // Reset form
      setReviewForm({
        rating: 5,
        title: '',
        comment: '',
        pros: '',
        cons: '',
        recommend: true
      });

      // Recalculate stats
      loadReviews();

      trackEvent('review_submitted', {
        property_id: propertyId,
        rating: reviewForm.rating,
        recommend: reviewForm.recommend
      });

      toast.success('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    }
  };

  const handleHelpfulVote = async (reviewId, isHelpful) => {
    try {
      setReviews(prev =>
        prev.map(review =>
          review.id === reviewId
            ? { ...review, helpful_votes: review.helpful_votes + (isHelpful ? 1 : -1) }
            : review
        )
      );

      toast.success(isHelpful ? 'Marked as helpful' : 'Removed helpful mark');
    } catch (error) {
      console.error('Error voting on review:', error);
      toast.error('Failed to update vote');
    }
  };

  const renderStars = (rating, interactive = false, onChange = null) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onChange && onChange(star)}
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              className={`w-5 h-5 ${star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
                }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const renderRatingDistribution = () => {
    const totalReviews = reviews.length;
    if (totalReviews === 0) return null;

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => (
          <div key={rating} className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 w-8">{rating}★</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full"
                style={{ width: `${(ratingDistribution[rating] / totalReviews) * 100}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 w-8">
              {ratingDistribution[rating]}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Reviews Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reviews & Ratings</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {renderStars(Math.round(averageRating))}
              <span className="text-lg font-semibold">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-gray-600">
                ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
              </span>
            </div>
          </div>
        </div>

        {isAuthenticated && !userReview && (
          <button
            onClick={() => setIsWritingReview(true)}
            className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Rating Distribution */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
          {renderRatingDistribution()}
        </div>
      )}

      {/* Write Review Form */}
      {isWritingReview && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-lg p-6 border border-gray-200"
        >
          <h3 className="text-lg font-semibold mb-4">Write Your Review</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Rating *
              </label>
              {renderStars(reviewForm.rating, true, (rating) =>
                setReviewForm(prev => ({ ...prev, rating }))
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Title *
              </label>
              <input
                type="text"
                value={reviewForm.title}
                onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                placeholder="Summarize your experience"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review *
              </label>
              <textarea
                rows={4}
                value={reviewForm.comment}
                onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                placeholder="Share your detailed experience..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pros (Optional)
                </label>
                <textarea
                  rows={2}
                  value={reviewForm.pros}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, pros: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  placeholder="What did you like?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cons (Optional)
                </label>
                <textarea
                  rows={2}
                  value={reviewForm.cons}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, cons: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  placeholder="What could be improved?"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reviewForm.recommend}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, recommend: e.target.checked }))}
                  className="rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35]"
                />
                <span className="ml-2 text-sm text-gray-700">I would recommend this property</span>
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleSubmitReview}
                className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Submit Review
              </button>
              <button
                onClick={() => {
                  setIsWritingReview(false);
                  setReviewForm({
                    rating: 5,
                    title: '',
                    comment: '',
                    pros: '',
                    cons: '',
                    recommend: true
                  });
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-[#FF6B35]"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No reviews yet. Be the first to review this property!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{review.user_name}</span>
                      {review.verified && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{review.created_at.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {renderStars(review.rating)}
                  <span className="text-sm text-gray-600">({review.rating}/5)</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                <p className="text-gray-700">{review.comment}</p>
              </div>

              {(review.pros || review.cons) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {review.pros && (
                    <div>
                      <h5 className="font-medium text-green-700 mb-1">Pros:</h5>
                      <p className="text-sm text-gray-600">{review.pros}</p>
                    </div>
                  )}
                  {review.cons && (
                    <div>
                      <h5 className="font-medium text-red-700 mb-1">Cons:</h5>
                      <p className="text-sm text-gray-600">{review.cons}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className={`text-sm px-3 py-1 rounded-full ${review.recommend
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {review.recommend ? 'Would recommend' : 'Would not recommend'}
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleHelpfulVote(review.id, true)}
                      className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm">{review.helpful_votes}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default PropertyReviews;
