import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  MessageSquare,
  Send,
  Star,
  ThumbsUp,
  ThumbsDown,
  Lock,
  Globe,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Shield,
  Image as ImageIcon,
  X,
  Upload,
  Sparkles,
  TrendingUp,
  Award
} from 'lucide-react';

const FeedbackPage = () => {
  const { getToken, userId } = useAuth();
  
  // States
  const [activeTab, setActiveTab] = useState('submit');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Feedback Form States
  const [feedbackType, setFeedbackType] = useState('general');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Feedback Lists
  const [myFeedback, setMyFeedback] = useState([]);
  const [publicFeedback, setPublicFeedback] = useState([]);
  
  // Filters
  const [filterType, setFilterType] = useState('all');
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    avgRating: 0,
    mostCommonType: null,
    responseRate: 0
  });

  const API_URL = 'http://localhost:8000';

  // Calculate stats from feedback
  const calculateStats = useCallback((feedbackList) => {
    if (feedbackList.length === 0) return;

    const total = feedbackList.length;
    const withRating = feedbackList.filter(f => f.rating);
    const avgRating = withRating.length > 0
      ? (withRating.reduce((sum, f) => sum + f.rating, 0) / withRating.length).toFixed(1)
      : 0;

    const typeCounts = {};
    feedbackList.forEach(f => {
      typeCounts[f.type] = (typeCounts[f.type] || 0) + 1;
    });
    const mostCommonType = Object.keys(typeCounts).length > 0
      ? Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b)
      : null;

    const withResponse = feedbackList.filter(f => f.admin_response);
    const responseRate = total > 0 ? ((withResponse.length / total) * 100).toFixed(0) : 0;

    setStats({
      total,
      avgRating,
      mostCommonType,
      responseRate
    });
  }, []);

  // Fetch my feedback
  const fetchMyFeedback = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      const response = await fetch(`${API_URL}/feedback/my?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch feedback');

      const data = await response.json();
      setMyFeedback(data.feedback || []);
      calculateStats(data.feedback || []);
    } catch (err) {
      console.error('Error fetching my feedback:', err);
      setError('Failed to load your feedback');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  }, [getToken, calculateStats]);

  // Fetch public feedback
  const fetchPublicFeedback = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      const response = await fetch(`${API_URL}/feedback/public?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch public feedback');

      const data = await response.json();
      setPublicFeedback(data.feedback || []);
    } catch (err) {
      console.error('Error fetching public feedback:', err);
      setError('Failed to load community feedback');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image (JPG, PNG, WebP)');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (file.size > maxSize) {
      setError('Image must be smaller than 5MB');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSelectedImage(file);
    
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Upload image to Cloudinary (via backend)
  const uploadImageToCloudinary = async (file) => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId);
      formData.append('folder', 'feedback');

      const token = await getToken();
      
      const response = await fetch(`${API_URL}/upload-feedback-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload image');

      const data = await response.json();
      return data.image_url;
    } catch (err) {
      console.error('Error uploading image:', err);
      throw err;
    } finally {
      setUploadingImage(false);
    }
  };

  // Submit feedback
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please provide feedback message');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const token = await getToken();
      
      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadImageToCloudinary(selectedImage);
      }

      const response = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          feedback_type: feedbackType,
          message: message.trim(),
          rating: rating || null,
          is_private: isPrivate,
          metadata: {
            submitted_from: 'feedback_page',
            image_url: imageUrl,
            has_attachment: !!imageUrl
          }
        })
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      setSuccess('🎉 Thank you! Your feedback has been submitted successfully.');
      
      setMessage('');
      setRating(0);
      setFeedbackType('general');
      setIsPrivate(false);
      removeImage();
      
      await fetchMyFeedback();
      
      setTimeout(() => {
        setActiveTab('my-feedback');
        setSuccess(null);
      }, 2000);

    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(`Failed to submit feedback: ${err.message}`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle privacy of feedback
  const togglePrivacy = async (feedbackId, currentPrivacy) => {
    try {
      const token = await getToken();
      
      const response = await fetch(`${API_URL}/feedback/${feedbackId}/privacy`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          is_private: !currentPrivacy
        })
      });

      if (!response.ok) throw new Error('Failed to update privacy');

      setMyFeedback(prev => 
        prev.map(f => 
          f.id === feedbackId 
            ? { ...f, is_private: !currentPrivacy }
            : f
        )
      );
      
      setSuccess('Privacy setting updated');
      setTimeout(() => setSuccess(null), 2000);

    } catch (err) {
      console.error('Error toggling privacy:', err);
      setError('Failed to update privacy');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Load feedback on tab change
  useEffect(() => {
    if (activeTab === 'my-feedback' && myFeedback.length === 0) {
      fetchMyFeedback();
    } else if (activeTab === 'public-feedback' && publicFeedback.length === 0) {
      fetchPublicFeedback();
    }
  }, [activeTab, myFeedback.length, publicFeedback.length, fetchMyFeedback, fetchPublicFeedback]);

  // Memoized filtered feedback
  const filteredMyFeedback = useMemo(() => {
    if (filterType === 'all') return myFeedback;
    return myFeedback.filter(fb => fb.type === filterType);
  }, [myFeedback, filterType]);

  const filteredPublicFeedback = useMemo(() => {
    if (filterType === 'all') return publicFeedback;
    return publicFeedback.filter(fb => fb.type === filterType);
  }, [publicFeedback, filterType]);

  // Render feedback card (optimized with React.memo)
  const FeedbackCard = React.memo(({ feedback, isMine = false }) => {
    const typeConfig = {
      general: { color: 'from-blue-500 to-cyan-500', icon: MessageSquare, emoji: '💬' },
      feature: { color: 'from-purple-500 to-pink-500', icon: Sparkles, emoji: '✨' },
      bug: { color: 'from-red-500 to-orange-500', icon: AlertCircle, emoji: '🐛' },
      prediction_correct: { color: 'from-green-500 to-emerald-500', icon: ThumbsUp, emoji: '👍' },
      prediction_wrong: { color: 'from-yellow-500 to-orange-500', icon: ThumbsDown, emoji: '👎' }
    };

    const config = typeConfig[feedback.type] || typeConfig.general;
    const Icon = config.icon;
    const feedbackImageUrl = feedback.metadata?.image_url;

    return (
      <div className="group bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden hover:border-purple-400/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4 flex-1">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 relative`}>
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
                <Icon className="w-7 h-7 text-white relative z-10" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-black text-lg capitalize mb-1 flex items-center gap-2">
                  {config.emoji} {feedback.type.replace('_', ' ')}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {isMine && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                      feedback.is_private 
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' 
                        : 'bg-green-500/20 text-green-300 border border-green-400/30'
                    }`}>
                      {feedback.is_private ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                      {feedback.is_private ? 'Private' : 'Public'}
                    </span>
                  )}
                  {feedback.metadata?.has_attachment && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                      <ImageIcon className="w-3 h-3" />
                      Image
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {isMine && (
              <button
                onClick={() => togglePrivacy(feedback.id, feedback.is_private)}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-gradient-to-br hover:from-purple-500/20 hover:to-pink-500/20 border border-white/20 hover:border-purple-400/50 transition-all duration-300"
                title={feedback.is_private ? 'Make Public' : 'Make Private'}
              >
                {feedback.is_private ? <EyeOff className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-white" />}
              </button>
            )}
          </div>

          {/* Rating */}
          {feedback.rating && (
            <div className="flex gap-1.5 mb-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-3 w-fit border border-yellow-400/30">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 transition-all ${i < feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}`}
                />
              ))}
              <span className="ml-2 text-yellow-300 font-bold text-sm">{feedback.rating}/5</span>
            </div>
          )}

          {/* Attached Image */}
          {feedbackImageUrl && (
            <div className="mb-4">
              <img 
                src={feedbackImageUrl}
                alt="Feedback attachment"
                className="w-full max-h-64 object-cover rounded-xl border-2 border-white/20 cursor-pointer hover:border-purple-400/50 transition-all"
                loading="lazy"
                onClick={() => window.open(feedbackImageUrl, '_blank')}
              />
            </div>
          )}

          {/* Message */}
          <p className="text-white/90 mb-4 leading-relaxed text-base break-words">{feedback.message}</p>

          {/* Breed Info */}
          {feedback.breed_predicted && (
            <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-4 mb-4 border border-white/20">
              <p className="text-white/90 text-sm mb-2 flex items-center gap-2">
                <span className="font-bold text-purple-300">🔮 Predicted:</span> 
                <span className="text-white font-semibold">{feedback.breed_predicted}</span>
              </p>
              {feedback.actual_breed && (
                <p className="text-white/90 text-sm flex items-center gap-2">
                  <span className="font-bold text-green-300">✅ Actual:</span> 
                  <span className="text-white font-semibold">{feedback.actual_breed}</span>
                </p>
              )}
            </div>
          )}

          {/* Admin Response */}
          {feedback.admin_response && (
            <div className="relative bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/40 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-purple-200 font-bold text-sm">Admin Response</span>
              </div>
              <p className="text-white/95 text-sm leading-relaxed pl-11">{feedback.admin_response}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-white/50 text-xs pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-medium">
                {new Date(feedback.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            {feedback.status && (
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                feedback.status === 'resolved' ? 'bg-green-500/20 text-green-300' :
                feedback.status === 'reviewed' ? 'bg-blue-500/20 text-blue-300' :
                'bg-yellow-500/20 text-yellow-300'
              }`}>
                {feedback.status}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  });

  FeedbackCard.displayName = 'FeedbackCard';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black py-20 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 mb-6 shadow-2xl shadow-purple-500/50 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
            <MessageSquare className="w-12 h-12 text-white relative z-10" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
              Feedback Center
            </span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto font-medium">
            Share your thoughts, report issues, or suggest improvements
          </p>
        </div>

        {/* Stats Cards (My Feedback Tab Only) */}
        {activeTab === 'my-feedback' && stats.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                <span className="text-2xl font-black text-white">{stats.total}</span>
              </div>
              <p className="text-white/60 text-sm font-semibold">Total Submitted</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <Star className="w-6 h-6 text-yellow-400" />
                <span className="text-2xl font-black text-white">{stats.avgRating || 'N/A'}</span>
              </div>
              <p className="text-white/60 text-sm font-semibold">Avg Rating</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-6 h-6 text-blue-400" />
                <span className="text-lg font-black text-white truncate">
                  {stats.mostCommonType?.replace('_', ' ') || 'N/A'}
                </span>
              </div>
              <p className="text-white/60 text-sm font-semibold">Most Common</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-6 h-6 text-green-400" />
                <span className="text-2xl font-black text-white">{stats.responseRate}%</span>
              </div>
              <p className="text-white/60 text-sm font-semibold">Response Rate</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'submit', label: 'Submit Feedback', icon: Send },
            { id: 'my-feedback', label: 'My Feedback', icon: User },
            { id: 'public-feedback', label: 'Community', icon: Globe }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 text-white shadow-xl shadow-purple-500/50 scale-105'
                    : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white border border-white/20'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/50 rounded-2xl p-4 flex items-center gap-3 backdrop-blur-xl">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <span className="text-green-300 font-semibold">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-400/50 rounded-2xl p-4 flex items-center gap-3 backdrop-blur-xl">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <span className="text-red-300 font-semibold">{error}</span>
          </div>
        )}

        {/* Content */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          
          {/* SUBMIT FEEDBACK TAB */}
          {activeTab === 'submit' && (
            <form onSubmit={handleSubmitFeedback} className="space-y-6">
              
              {/* Feedback Type */}
              <div>
                <label className="block text-white font-bold text-lg mb-4">Feedback Type</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'general', label: 'General', emoji: '💬', color: 'from-blue-500 to-cyan-500' },
                    { value: 'feature', label: 'Feature', emoji: '✨', color: 'from-purple-500 to-pink-500' },
                    { value: 'bug', label: 'Bug Report', emoji: '🐛', color: 'from-red-500 to-orange-500' }
                  ].map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFeedbackType(type.value)}
                      className={`p-5 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                        feedbackType === type.value
                          ? `border-purple-400 bg-gradient-to-br ${type.color} shadow-lg shadow-purple-500/30`
                          : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="text-3xl mb-2">{type.emoji}</div>
                      <div className={`text-sm font-bold ${feedbackType === type.value ? 'text-white' : 'text-white/60'}`}>
                        {type.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-white font-bold text-lg mb-4">Rate Your Experience (Optional)</label>
                <div className="flex gap-3 bg-white/5 rounded-2xl p-4 w-fit border border-white/20">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(rating === star ? 0 : star)}
                      className="transition-all duration-300 hover:scale-125"
                    >
                      <Star className={`w-10 h-10 ${star <= rating ? 'fill-yellow-400 text-yellow-400 drop-shadow-lg' : 'text-white/30 hover:text-white/50'}`} />
                    </button>
                  ))}
                  {rating > 0 && (
                    <div className="flex items-center ml-3 px-4 bg-yellow-500/20 rounded-xl border border-yellow-400/30">
                      <span className="text-yellow-300 font-bold text-lg">{rating}/5</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-white font-bold text-lg mb-4">Your Feedback</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your thoughts, suggestions, or report an issue..."
                  rows={6}
                  className="w-full px-5 py-4 rounded-2xl bg-white/10 border-2 border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 focus:bg-white/15 transition-all resize-none text-base"
                  required
                />
                <p className="text-white/50 text-sm mt-2">{message.length} characters</p>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-white font-bold text-lg mb-4">Attach Image (Optional)</label>
                {!imagePreview ? (
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center bg-white/5 hover:bg-white/10 hover:border-purple-400/50 transition-all">
                      <Upload className="w-12 h-12 mx-auto text-white/40 mb-3" />
                      <p className="text-white/70 font-semibold mb-1">Click to upload an image</p>
                      <p className="text-white/50 text-sm">JPG, PNG, WebP (max 5MB)</p>
                    </div>
                  </label>
                ) : (<div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-64 object-cover rounded-2xl border-2 border-white/20"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-4 right-4 p-2 bg-red-500 hover:bg-red-600 rounded-full transition-all"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                )}
              </div>

              {/* Privacy Toggle */}
              <div className="flex items-center justify-between bg-gradient-to-r from-white/10 to-white/5 rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isPrivate ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-white/20'}`}>
                    {isPrivate ? <Lock className="w-6 h-6 text-white" /> : <Globe className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{isPrivate ? 'Private Feedback' : 'Public Feedback'}</p>
                    <p className="text-white/60 text-sm">
                      {isPrivate ? 'Only visible to administrators' : 'Visible to the entire community'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`relative w-16 h-9 rounded-full transition-all duration-300 ${
                    isPrivate ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50' : 'bg-white/20'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-7 h-7 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                    isPrivate ? 'translate-x-7' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || uploadingImage}
                className="w-full relative group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition duration-300 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 text-lg shadow-xl">
                  {submitting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      {uploadingImage ? 'Uploading Image...' : 'Submitting Feedback...'}
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      Submit Feedback
                    </>
                  )}
                </div>
              </button>
            </form>
          )}

          {/* MY FEEDBACK TAB */}
          {activeTab === 'my-feedback' && (
            <div>
              {/* Filters */}
              <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                    filterType === 'all' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  All Types
                </button>
                {['general', 'feature', 'bug', 'prediction_correct', 'prediction_wrong'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                      filterType === type ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="text-center py-20">
                  <Loader2 className="w-16 h-16 mx-auto text-purple-400 animate-spin mb-6" />
                  <p className="text-white/70 text-lg">Loading your feedback...</p>
                </div>
              ) : filteredMyFeedback.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/20">
                    <MessageSquare className="w-12 h-12 text-white/40" />
                  </div>
                  <p className="text-white/70 text-xl mb-2">No feedback found</p>
                  <p className="text-white/50 mb-6">Be the first to share your thoughts!</p>
                  <button
                    onClick={() => setActiveTab('submit')}
                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl hover:scale-105 transition-all shadow-lg shadow-purple-500/50"
                  >
                    Submit Your First Feedback
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {filteredMyFeedback.map(feedback => (
                    <FeedbackCard key={feedback.id} feedback={feedback} isMine={true} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PUBLIC FEEDBACK TAB */}
          {activeTab === 'public-feedback' && (
            <div>
              {/* Filters */}
              <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    filterType === 'all' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  All Types
                </button>
                {['general', 'feature', 'bug'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      filterType === type ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="text-center py-20">
                  <Loader2 className="w-16 h-16 mx-auto text-purple-400 animate-spin mb-6" />
                  <p className="text-white/70 text-lg">Loading community feedback...</p>
                </div>
              ) : filteredPublicFeedback.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-white/20">
                    <Globe className="w-12 h-12 text-white/40" />
                  </div>
                  <p className="text-white/70 text-xl">No public feedback available</p>
                  <p className="text-white/50 mt-2">Check back later for community insights</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {filteredPublicFeedback.map(feedback => (
                    <FeedbackCard key={feedback.id} feedback={feedback} isMine={false} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;