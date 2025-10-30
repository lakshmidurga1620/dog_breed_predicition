import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  History,
  Trash2,
  Share2,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  Search,
  X,
  Settings,
  ChevronDown,
  ChevronUp,
  Camera,
  TrendingUp,
  Award,
  Eye,
  Sparkles,
  ImageIcon
} from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs, doc, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const PredictionHistoryPage = () => {
  const { getToken, userId } = useAuth();
  
  // States
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [historyEnabled, setHistoryEnabled] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    topBreed: null,
    avgConfidence: 0
  });

  useEffect(() => {
    if (userId) {
      fetchPredictions();
      fetchHistorySettings();
    }
  }, [userId]);

  const calculateStats = (preds) => {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisMonth = preds.filter(p => new Date(p.timestamp) >= firstOfMonth).length;
    
    const breedCounts = {};
    let totalConfidence = 0;
    
    preds.forEach(p => {
      const breed = p.prediction?.breed;
      if (breed) {
        breedCounts[breed] = (breedCounts[breed] || 0) + 1;
      }
      totalConfidence += (p.prediction?.confidence || 0);
    });
    
    const topBreed = Object.keys(breedCounts).length > 0
      ? Object.keys(breedCounts).reduce((a, b) => breedCounts[a] > breedCounts[b] ? a : b)
      : null;
    
    const avgConfidence = preds.length > 0 ? (totalConfidence / preds.length * 100).toFixed(1) : 0;
    
    setStats({
      total: preds.length,
      thisMonth,
      topBreed,
      avgConfidence
    });
  };

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      
      // Fetch from Firestore (with Cloudinary URLs)
      const q = query(
        collection(db, 'predictions'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const querySnapshot = await getDocs(q);
      const preds = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Handle both imageURL (old) and imageUrl (new) formats
          imageUrl: data.imageUrl || data.imageURL || null,
          thumbnailUrl: data.thumbnailUrl || data.thumbnailURL || null,
          timestamp: data.timestamp?.toDate?.() || new Date()
        };
      });
      
      console.log('✅ Fetched predictions with Cloudinary URLs:', preds.length);
      setPredictions(preds);
      calculateStats(preds);
    } catch (err) {
      console.error('❌ Error fetching predictions:', err);
      setError('Failed to load prediction history');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistorySettings = async () => {
    try {
      const q = query(
        collection(db, 'userSettings'),
        where('userId', '==', userId),
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const settings = snapshot.docs[0].data();
        setHistoryEnabled(settings.historyEnabled !== false);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const toggleHistorySetting = async () => {
    try {
      const settingsRef = collection(db, 'userSettings');
      const q = query(settingsRef, where('userId', '==', userId), limit(1));
      const snapshot = await getDocs(q);
      
      const newValue = !historyEnabled;
      
      if (snapshot.empty) {
        await addDoc(settingsRef, {
          userId: userId,
          historyEnabled: newValue,
          updatedAt: new Date()
        });
      } else {
        await updateDoc(doc(db, 'userSettings', snapshot.docs[0].id), {
          historyEnabled: newValue,
          updatedAt: new Date()
        });
      }
      
      setHistoryEnabled(newValue);
      setSuccess(newValue ? 'History tracking enabled' : 'History tracking disabled');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to update settings');
      setTimeout(() => setError(null), 3000);
    }
  };

  const deletePrediction = async (predictionId) => {
    try {
      await deleteDoc(doc(db, 'predictions', predictionId));
      const updatedPreds = predictions.filter(p => p.id !== predictionId);
      setPredictions(updatedPreds);
      calculateStats(updatedPreds);
      setShowDeleteConfirm(null);
      setSuccess('Prediction deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting prediction:', err);
      setError('Failed to delete prediction');
      setTimeout(() => setError(null), 3000);
    }
  };

  const sharePrediction = async (prediction) => {
    try {
      const token = await getToken();
      
      const response = await fetch('http://localhost:8000/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          feedback_type: 'prediction_correct',
          message: `Sharing prediction result: ${prediction.prediction.breed}`,
          rating: 5,
          prediction_id: prediction.id,
          breed_predicted: prediction.prediction.breed,
          is_private: false,
          metadata: {
            confidence: prediction.prediction.confidence,
            shared_from: 'history'
          }
        })
      });

      if (!response.ok) throw new Error('Failed to share');

      setSuccess('Shared to community feedback!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error sharing:', err);
      setError('Failed to share prediction');
      setTimeout(() => setError(null), 3000);
    }
  };

  const getFilteredPredictions = () => {
    let filtered = [...predictions];

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.prediction?.breed?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const now = new Date();
    if (filterDate === 'today') {
      filtered = filtered.filter(p => {
        const predDate = new Date(p.timestamp);
        return predDate.toDateString() === now.toDateString();
      });
    } else if (filterDate === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(p => new Date(p.timestamp) >= weekAgo);
    } else if (filterDate === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(p => new Date(p.timestamp) >= monthAgo);
    }

    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else if (sortBy === 'highest-confidence') {
      filtered.sort((a, b) => (b.prediction?.confidence || 0) - (a.prediction?.confidence || 0));
    }

    return filtered;
  };

  const renderPredictionCard = (prediction) => {
    const isExpanded = expandedCard === prediction.id;
    const cloudinaryImageUrl = prediction.thumbnailUrl || prediction.imageUrl;
    
    return (
      <div
        key={prediction.id}
        className="relative bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:border-purple-400/50 group animate-fade-in"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4 gap-4">
            {/* Image and Basic Info */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Cloudinary Image Display */}
              <div 
                className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 cursor-pointer group/img relative"
                onClick={() => cloudinaryImageUrl && setSelectedImage(cloudinaryImageUrl)}
              >
                {cloudinaryImageUrl ? (
                  <>
                    <img 
                      src={cloudinaryImageUrl} 
                      alt={prediction.prediction?.breed || 'Dog'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-110"
                      loading="lazy"
                      onError={(e) => {
                        console.warn('❌ Image failed to load:', e.target.src);
                        e.target.style.display = 'none';
                        const parent = e.target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500"><svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div>';
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-white/60" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-black text-white mb-2 truncate bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {prediction.prediction?.breed || 'Unknown'}
                </h3>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 bg-green-500/20 border border-green-400/40 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-300 font-bold text-sm">
                      {prediction.prediction?.percentage || Math.round((prediction.prediction?.confidence || 0) * 100)}% Match
                    </span>
                  </div>
                  {prediction.imageUrl && (
                    <div className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/40 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                      <Sparkles className="w-3 h-3 text-blue-400" />
                      <span className="text-blue-300 font-semibold text-xs">Cloud Stored</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-white/60 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">{new Date(prediction.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      {new Date(prediction.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setExpandedCard(isExpanded ? null : prediction.id)}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 hover:border-purple-400/50"
                title="View Details"
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-white" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white" />
                )}
              </button>
              <button
                onClick={() => sharePrediction(prediction)}
                className="p-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/40 transition-all border border-blue-400/30 hover:border-blue-400/60"
                title="Share to Community"
              >
                <Share2 className="w-5 h-5 text-blue-400" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(prediction.id)}
                className="p-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/40 transition-all border border-red-400/30 hover:border-red-400/60"
                title="Delete"
              >
                <Trash2 className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && prediction.breedInfo && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-white/60 text-xs mb-1 font-semibold uppercase tracking-wider">Size</p>
                  <p className="text-white font-bold text-lg">{prediction.breedInfo.size || 'N/A'}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-white/60 text-xs mb-1 font-semibold uppercase tracking-wider">Energy</p>
                  <p className="text-white font-bold text-lg">{prediction.breedInfo.energy_level || 'N/A'}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-white/60 text-xs mb-1 font-semibold uppercase tracking-wider">Lifespan</p>
                  <p className="text-white font-bold text-lg">{prediction.breedInfo.life_span || 'N/A'}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-white/60 text-xs mb-1 font-semibold uppercase tracking-wider">Group</p>
                  <p className="text-white font-bold text-lg truncate">{prediction.breedInfo.group || 'N/A'}</p>
                </div>
              </div>
              
              {prediction.breedInfo.temperament && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-white/60 text-xs mb-3 font-semibold uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Temperament
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {prediction.breedInfo.temperament.slice(0, 5).map((trait, i) => (
                      <span key={i} className="bg-purple-500/20 border border-purple-400/40 rounded-full px-3 py-1.5 text-xs text-purple-300 font-semibold">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm === prediction.id && (
          <div className="bg-red-500/10 border-t border-red-500/30 p-4 backdrop-blur-sm animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-300 font-semibold">Delete this prediction permanently?</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deletePrediction(prediction.id)}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const filteredPredictions = getFilteredPredictions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black py-20 px-4">
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        select {
          color-scheme: dark;
        }
        
        select option {
          background-color: #1e293b;
          color: white;
          padding: 8px;
        }
        
        select:focus {
          outline: 2px solid rgb(168, 85, 247);
          outline-offset: 2px;
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-6 shadow-xl shadow-purple-500/50">
            <History className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">
            Prediction <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">History</span>
          </h1>
          <p className="text-white/70 text-lg font-medium">View, manage, and share your past predictions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-400" />
              <span className="text-3xl font-black text-white">{stats.total}</span>
            </div>
            <p className="text-white/60 text-sm font-semibold">Total Predictions</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-blue-400" />
              <span className="text-3xl font-black text-white">{stats.thisMonth}</span>
            </div>
            <p className="text-white/60 text-sm font-semibold">This Month</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-yellow-400" />
              <span className="text-2xl font-black text-white truncate">{stats.topBreed || 'N/A'}</span>
            </div>
            <p className="text-white/60 text-sm font-semibold">Top Breed</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <Sparkles className="w-8 h-8 text-green-400" />
              <span className="text-3xl font-black text-white">{stats.avgConfidence}%</span>
            </div>
            <p className="text-white/60 text-sm font-semibold">Avg Confidence</p>
          </div>
        </div>

        {/* Notifications */}
        {success && (
          <div className="mb-6 bg-green-500/20 border border-green-400/50 rounded-xl p-4 flex items-center gap-3 animate-fade-in backdrop-blur-xl">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <span className="text-green-300 font-semibold">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-400/50 rounded-xl p-4 flex items-center gap-3 animate-fade-in backdrop-blur-xl">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <span className="text-red-300 font-semibold">{error}</span>
          </div>
        )}

        {/* History Settings Toggle */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mb-6 hover:bg-white/10 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-purple-400" />
              <div>
                <p className="text-white font-bold text-lg">History Tracking</p>
                <p className="text-white/60 text-sm">
                  {historyEnabled ? 'Predictions are being saved to your account' : 'New predictions won\'t be saved'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleHistorySetting}
              className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
                historyEnabled ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/20'
              }`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-lg ${
                historyEnabled ? 'translate-x-8' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by breed..."
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 transition-all font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-white/10 rounded-lg p-1"
                >
                  <X className="w-4 h-4 text-white/40 hover:text-white" />
                </button>
              )}
            </div>

            {/* Date Filter */}
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-400 transition-all cursor-pointer font-medium"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-400 transition-all cursor-pointer font-medium"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest-confidence">Highest Confidence</option>
            </select>
          </div>
        </div>

        {/* Predictions List */}
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 mx-auto text-purple-400 animate-spin mb-4" />
            <p className="text-white/70 text-lg font-medium">Loading your predictions...</p>
          </div>
        ) : filteredPredictions.length === 0 ? (
          <div className="text-center py-20 bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl">
            <History className="w-16 h-16 mx-auto text-white/30 mb-4" />
            <p className="text-white/70 text-xl mb-2 font-semibold">
              {predictions.length === 0 ? 'No predictions yet' : 'No predictions match your filters'}
            </p>
            <p className="text-white/50 text-sm">
              {predictions.length === 0 ? 'Start by uploading a dog image!' : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/70 font-medium">
                Showing <span className="font-black text-white text-lg">{filteredPredictions.length}</span> predictions
              </p>
            </div>
            {filteredPredictions.map(prediction => renderPredictionCard(prediction))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/20"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionHistoryPage;