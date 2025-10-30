import React, { useState, useEffect } from 'react';

// NOTE: This component assumes Tailwind CSS classes are available.

/**
 * Fetch YouTube videos for a specific search query
 */
const useYouTubeVideos = (searchQuery, maxResults = 2) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY || 'AIzaSyBxBH-5_hJ2rAm1TuIVzlBK6xcjsch1FCk';
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=${maxResults}&key=${API_KEY}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error('YouTube API Error:', response.statusText);
          setError(true);
          setLoading(false);
          return;
        }

        const data = await response.json();
        
        if (data.items) {
          setVideos(data.items);
        }
      } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (searchQuery) {
      fetchVideos();
    }
  }, [searchQuery, maxResults]);

  return { videos, loading, error };
};

/**
 * Video Category Section Component
 */
const VideoCategorySection = ({ breedName, category, icon, title, searchSuffix, bgGradient, borderColor, shadowColor }) => {
  const readableBreedName = breedName.replace(/-/g, ' ');
  const searchQuery = `${readableBreedName} dog ${searchSuffix}`;
  const { videos, loading, error } = useYouTubeVideos(searchQuery, 2);

  const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

  // Loading State
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{icon}</span>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className={`aspect-video ${bgGradient} rounded-xl animate-pulse flex items-center justify-center`}>
              <div className="text-white text-sm">Loading...</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error or No Videos State
  if (error || videos.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{icon}</span>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <a
          href={fallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`block p-8 ${bgGradient} border-2 ${borderColor} rounded-xl hover:scale-[1.02] hover:shadow-xl ${shadowColor} transition-all duration-300 group cursor-pointer`}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">▶️</div>
            <p className="text-white font-semibold mb-1">Watch on YouTube</p>
            <p className="text-gray-300 text-sm">Click to search for videos</p>
          </div>
        </a>
      </div>
    );
  }

  // Display Videos
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <a
          href={fallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-400 hover:text-purple-300 text-sm font-semibold flex items-center gap-1 transition-colors duration-200"
        >
          View More →
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.slice(0, 2).map((video) => (
          <div
            key={video.id.videoId}
            className={`group relative aspect-video border-2 ${borderColor} rounded-xl overflow-hidden hover:border-opacity-100 hover:shadow-xl ${shadowColor} transition-all duration-300`}
          >
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${video.id.videoId}`}
              title={video.snippet.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Main wrapper for the Video Content section with categories
 */
const VideoContent = ({ actualBreedName }) => {
  const readableBreedName = actualBreedName.replace(/-/g, ' ');
  const [activeTab, setActiveTab] = useState('all');

  const categories = [
    {
      id: 'care',
      icon: '✂️',
      title: 'Care & Grooming',
      searchSuffix: 'grooming care',
      bgGradient: 'bg-gradient-to-br from-pink-500/20 to-rose-500/20',
      borderColor: 'border-pink-500/30',
      shadowColor: 'hover:shadow-pink-500/30'
    },
    {
      id: 'diet',
      icon: '🍖',
      title: 'Diet & Nutrition',
      searchSuffix: 'diet nutrition feeding',
      bgGradient: 'bg-gradient-to-br from-orange-500/20 to-amber-500/20',
      borderColor: 'border-orange-500/30',
      shadowColor: 'hover:shadow-orange-500/30'
    },
    {
      id: 'training',
      icon: '🎓',
      title: 'Training & Behavior',
      searchSuffix: 'training behavior tips',
      bgGradient: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-500/30',
      shadowColor: 'hover:shadow-blue-500/30'
    },
    {
      id: 'health',
      icon: '💪',
      title: 'Health & Exercise',
      searchSuffix: 'health exercise fitness',
      bgGradient: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/30',
      shadowColor: 'hover:shadow-green-500/30'
    }
  ];

  const tabs = [
    { id: 'all', label: 'All Videos', icon: '📺' },
    { id: 'care', label: 'Care', icon: '✂️' },
    { id: 'diet', label: 'Diet', icon: '🍖' },
    { id: 'training', label: 'Training', icon: '🎓' },
    { id: 'health', label: 'Health', icon: '💪' }
  ];

  const filteredCategories = activeTab === 'all' 
    ? categories 
    : categories.filter(cat => cat.id === activeTab);

  return (
    <div className="bg-white/5 backdrop-blur-2xl border-2 border-purple-500/20 rounded-3xl p-6 md:p-10 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3 mb-2">
          <span className="text-4xl bg-gradient-to-br from-purple-600/30 to-indigo-600/30 p-3 rounded-2xl">🎥</span>
          Video Resources
        </h2>
        <p className="text-gray-400 text-sm md:text-base">
          Expert guides and tutorials for {readableBreedName}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8 overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 md:px-6 py-3 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border-2 border-purple-500/30'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Video Categories */}
      <div className="space-y-8">
        {filteredCategories.map((category, index) => (
          <div key={category.id}>
            <VideoCategorySection
              breedName={actualBreedName}
              category={category.id}
              icon={category.icon}
              title={category.title}
              searchSuffix={category.searchSuffix}
              bgGradient={category.bgGradient}
              borderColor={category.borderColor}
              shadowColor={category.shadowColor}
            />
            {index < filteredCategories.length - 1 && (
              <div className="my-8 border-t-2 border-purple-500/20"></div>
            )}
          </div>
        ))}
      </div>

      {/* Additional Resources */}
      <div className="mt-8 p-6 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-2 border-purple-500/30 rounded-2xl">
        <div className="flex items-start gap-4">
          <span className="text-3xl flex-shrink-0">💡</span>
          <div>
            <h4 className="text-white font-bold text-lg mb-2">Pro Tip</h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              Each category features hand-picked videos from experienced dog trainers and veterinarians. 
              Click "View More" to explore additional content on YouTube for comprehensive breed-specific guidance.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(readableBreedName + ' puppy care')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 bg-white/5 border-2 border-purple-500/30 rounded-xl hover:bg-white/10 hover:border-purple-400 transition-all duration-300 text-center group"
        >
          <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">🐕</div>
          <div className="text-white text-xs font-semibold">Puppy Care</div>
        </a>
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(readableBreedName + ' breed guide')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 bg-white/5 border-2 border-purple-500/30 rounded-xl hover:bg-white/10 hover:border-purple-400 transition-all duration-300 text-center group"
        >
          <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">📖</div>
          <div className="text-white text-xs font-semibold">Breed Guide</div>
        </a>
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(readableBreedName + ' owner review')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 bg-white/5 border-2 border-purple-500/30 rounded-xl hover:bg-white/10 hover:border-purple-400 transition-all duration-300 text-center group"
        >
          <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">⭐</div>
          <div className="text-white text-xs font-semibold">Reviews</div>
        </a>
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(readableBreedName + ' vs comparison')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 bg-white/5 border-2 border-purple-500/30 rounded-xl hover:bg-white/10 hover:border-purple-400 transition-all duration-300 text-center group"
        >
          <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">⚖️</div>
          <div className="text-white text-xs font-semibold">Compare</div>
        </a>
      </div>
    </div>
  );
};

export default VideoContent;