import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { breedsData } from '../data/breedsData';
import { db } from '../firebase';
import { collection, getDocs, addDoc, query, orderBy, limit } from 'firebase/firestore';

const BreedsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedSize, setSelectedSize] = useState('All');
  const [selectedEnergy, setSelectedEnergy] = useState('All');
  const [selectedGrooming, setSelectedGrooming] = useState('All');
  const [selectedGoodWithKids, setSelectedGoodWithKids] = useState('All');
  const [apartmentFriendly, setApartmentFriendly] = useState(false);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedTemperaments, setSelectedTemperaments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);
  const breedsPerPage = 12;

  // NEW: States for Recent Searches and Popular Breeds
  const [recentSearches, setRecentSearches] = useState([]);
  const [top10Recent, setTop10Recent] = useState([]);
  const [popularBreeds, setPopularBreeds] = useState([]);

  // Normalize breed name for navigation
  const normalizeBreedName = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/_+/g, '-')
      .replace(/--+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '');
  };

  // Generate placeholder image as fallback
  const getPlaceholderImage = (breedName) => {
    const colors = ['6366f1', '8b5cf6', 'a855f7', '06b6d4', '10b981'];
    const colorIndex = breedName.length % colors.length;
    const color = colors[colorIndex];
    const encodedName = encodeURIComponent(breedName.substring(0, 20));
    return `https://via.placeholder.com/400x400/${color}/ffffff?text=${encodedName}`;
  };

  const breeds = Object.keys(breedsData);
  
  const groups = ['All', 'Hound', 'Sporting', 'Working', 'Terrier', 'Toy', 'Non-Sporting', 'Herding'];
  const sizes = ['All', 'Small', 'Medium', 'Large', 'Giant'];
  const energyLevels = ['All', 'Low', 'Moderate', 'High', 'Very High'];
  const groomingNeeds = ['All', 'Low', 'Moderate', 'High'];
  const goodWithKidsOptions = ['All', 'Yes', 'No'];

  // NEW: Fetch Recent Searches from Firestore
  useEffect(() => {
    const fetchRecentSearches = async () => {
      try {
        const q = query(
          collection(db, 'recentSearches'),
          orderBy('timestamp', 'desc'),
          limit(500)
        );
        const snapshot = await getDocs(q);
        const searches = snapshot.docs.map((doc) => doc.data().term);
        setRecentSearches(searches);
      } catch (error) {
        console.error('Error fetching recent searches:', error);
      }
    };
    fetchRecentSearches();
  }, []);

  // NEW: Calculate Top 10 Recent and Top 5 Popular Breeds
  useEffect(() => {
    if (recentSearches.length === 0) {
      setTop10Recent([]);
      setPopularBreeds([]);
      return;
    }

    // Top 10 Recent
    const top10 = recentSearches.slice(0, 10);
    setTop10Recent(top10);

    // Count occurrences for popularity
    const counts = recentSearches.reduce((acc, term) => {
      const normalizedTerm = term.trim().charAt(0).toUpperCase() + term.trim().slice(1).toLowerCase();
      if (breedsData[normalizedTerm] || breedsData[normalizedTerm.toLowerCase()]) {
        acc[normalizedTerm] = (acc[normalizedTerm] || 0) + 1;
      }
      return acc;
    }, {});

    // Sort by count and get Top 5
    const sortedBreeds = Object.entries(counts)
      .map(([breed, count]) => ({ breed, count }))
      .sort((a, b) => b.count - a.count);
    
    const top5 = sortedBreeds.slice(0, 5);
    setPopularBreeds(top5);
  }, [recentSearches]);

  // Extract unique colors and temperaments from data
  const allColors = useMemo(() => {
    const colorSet = new Set();
    breeds.forEach(breed => {
      const colors = breedsData[breed].colors || [];
      colors.forEach(color => colorSet.add(color));
    });
    return Array.from(colorSet).sort();
  }, [breeds]);

  const allTemperaments = useMemo(() => {
    const tempSet = new Set();
    breeds.forEach(breed => {
      const temps = breedsData[breed].temperament || [];
      temps.forEach(temp => tempSet.add(temp));
    });
    return Array.from(tempSet).sort();
  }, [breeds]);

  const filteredBreeds = useMemo(() => {
    return breeds.filter(breed => {
      const breedData = breedsData[breed];
      const matchesSearch = breed.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = selectedGroup === 'All' || breedData.group === selectedGroup;
      const matchesSize = selectedSize === 'All' || breedData.size === selectedSize;
      const matchesEnergy = selectedEnergy === 'All' || breedData.energy_level === selectedEnergy;
      const matchesGrooming = selectedGrooming === 'All' || breedData.grooming_needs === selectedGrooming;
      const matchesKids = selectedGoodWithKids === 'All' || 
        (selectedGoodWithKids === 'Yes' && breedData.good_with_kids) ||
        (selectedGoodWithKids === 'No' && !breedData.good_with_kids);
      const matchesApartment = !apartmentFriendly || breedData.apartment_friendly;
      const matchesColors = selectedColors.length === 0 || 
        selectedColors.some(color => (breedData.colors || []).includes(color));
      const matchesTemperaments = selectedTemperaments.length === 0 || 
        selectedTemperaments.some(temp => (breedData.temperament || []).includes(temp));
      
      return matchesSearch && matchesGroup && matchesSize && matchesEnergy && 
             matchesGrooming && matchesKids && matchesApartment && matchesColors && matchesTemperaments;
    });
  }, [searchTerm, selectedGroup, selectedSize, selectedEnergy, selectedGrooming, 
      selectedGoodWithKids, apartmentFriendly, selectedColors, selectedTemperaments, breeds]);

  // Pagination
  const totalPages = Math.ceil(filteredBreeds.length / breedsPerPage);
  const startIndex = (currentPage - 1) * breedsPerPage;
  const endIndex = startIndex + breedsPerPage;
  const currentBreeds = filteredBreeds.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGroup, selectedSize, selectedEnergy, selectedGrooming, 
      selectedGoodWithKids, apartmentFriendly, selectedColors, selectedTemperaments]);

  const handleColorToggle = (color) => {
    setSelectedColors(prev => 
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const handleTemperamentToggle = (temp) => {
    setSelectedTemperaments(prev => 
      prev.includes(temp) ? prev.filter(t => t !== temp) : [...prev, temp]
    );
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedGroup('All');
    setSelectedSize('All');
    setSelectedEnergy('All');
    setSelectedGrooming('All');
    setSelectedGoodWithKids('All');
    setApartmentFriendly(false);
    setSelectedColors([]);
    setSelectedTemperaments([]);
    setCurrentPage(1);
  };

  // NEW: Handle Search Submit (saves to Firestore)
  const handleSearchSubmit = async (term) => {
    if (!term.trim()) return;

    const trimmedTerm = term.trim();

    try {
      const recentSearchesCol = collection(db, 'recentSearches');
      const isDuplicate = recentSearches.some(
        (search) => search.toLowerCase() === trimmedTerm.toLowerCase()
      );

      if (!isDuplicate) {
        await addDoc(recentSearchesCol, {
          term: trimmedTerm,
          timestamp: Date.now(),
        });
        setRecentSearches((prev) => [trimmedTerm, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      console.error('Error saving recent search:', error);
    }

    const breedKey = breeds.find(
      (b) => b.toLowerCase() === term.trim().toLowerCase()
    );
    if (breedKey) {
      navigate(`/breeds/${normalizeBreedName(breedKey)}`);
    }
  };

  const handleBreedClick = async (breedName) => {
    await handleSearchSubmit(breedName);
    const normalizedName = normalizeBreedName(breedName);
    navigate(`/breeds/${normalizedName}`);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black pb-16">
      {/* Hero Section */}
      <div className="relative pt-32 pb-12 px-8 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight animate-fade-in-up">
            Discover Dog Breeds
          </h1>
          <p className="text-lg md:text-xl text-gray-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Explore {breeds.length}+ amazing dog breeds and find your perfect companion
          </p>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors duration-300 flex items-center justify-center gap-2"
          >
            <span>{showFilters ? '✕ Hide Filters' : '☰ Show Filters'}</span>
          </button>

          {/* Left Sidebar - Filters */}
          <aside className={`${showFilters ? 'block' : 'hidden'} lg:block lg:sticky lg:top-4 lg:h-fit w-full lg:w-80 flex-shrink-0`}>
            <div className="bg-white/5 backdrop-blur-2xl border-2 border-purple-500/30 rounded-3xl p-6 space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-purple-500/30">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>🎯</span>
                  Filters
                </h2>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-purple-300 hover:text-purple-200 font-semibold transition-colors"
                >
                  Clear All
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search breeds..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchSubmit(searchTerm);
                    }
                  }}
                  className="w-full px-4 py-3 pl-11 bg-white/5 border-2 border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-white/10 transition-all duration-300 text-sm"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl"> </span>
              </div>

              {/* NEW: Recent Searches */}
              {top10Recent.length > 0 && (
                <div className="pb-4 border-b border-purple-500/30">
                  <h3 className="text-white text-xs font-bold mb-3 uppercase tracking-wider text-purple-300">
                    Recent Searches
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {top10Recent.map((term, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSearchTerm(term);
                          handleSearchSubmit(term);
                        }}
                        className="px-3 py-1 bg-white/10 text-gray-300 text-xs rounded-full border border-purple-500/50 hover:bg-white/20 hover:text-white transition-all duration-200 cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* NEW: Most Popular Breeds */}
              {popularBreeds.length > 0 && (
                <div className="pb-4 border-b border-purple-500/30">
                  <h3 className="text-white text-xs font-bold mb-3 uppercase tracking-wider text-green-300 flex items-center gap-2">
                    <span className="text-lg">⭐</span> Most Popular Breeds
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    {popularBreeds.map((item, idx) => (
                      <button
                        key={item.breed}
                        onClick={() => {
                          setSearchTerm(item.breed);
                          handleSearchSubmit(item.breed);
                        }}
                        className="w-full text-left px-3 py-2 bg-green-900/20 text-gray-300 text-sm rounded-lg border border-green-500/50 hover:bg-green-500/20 hover:text-white transition-all duration-200 cursor-pointer flex justify-between items-center"
                      >
                        <span className="font-semibold">{idx + 1}. {item.breed}</span>
                        <span className="px-2 py-0.5 bg-green-500 rounded-full text-xs font-bold text-white">
                          {item.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Group Filter */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                  <span>🐕</span>
                  Group
                </label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border-2 border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400 focus:bg-white/10 transition-all duration-300 cursor-pointer appearance-none text-sm"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1.25em',
                  }}
                >
                  {groups.map(group => (
                    <option key={group} value={group} className="bg-gray-800">
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              {/* Size Filter */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                  <span>📏</span>
                  Size
                </label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border-2 border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400 focus:bg-white/10 transition-all duration-300 cursor-pointer appearance-none text-sm"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1.25em',
                  }}
                >
                  {sizes.map(size => (
                    <option key={size} value={size} className="bg-gray-800">
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              {/* Energy Level Filter */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                  <span>⚡</span>
                  Energy Level
                </label>
                <select
                  value={selectedEnergy}
                  onChange={(e) => setSelectedEnergy(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border-2 border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400 focus:bg-white/10 transition-all duration-300 cursor-pointer appearance-none text-sm"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1.25em',
                  }}
                >
                  {energyLevels.map(level => (
                    <option key={level} value={level} className="bg-gray-800">
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grooming Needs Filter */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                  <span>✂️</span>
                  Grooming Needs
                </label>
                <select
                  value={selectedGrooming}
                  onChange={(e) => setSelectedGrooming(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border-2 border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400 focus:bg-white/10 transition-all duration-300 cursor-pointer appearance-none text-sm"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1.25em',
                  }}
                >
                  {groomingNeeds.map(level => (
                    <option key={level} value={level} className="bg-gray-800">
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              {/* Good With Kids Filter */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                  <span>👶</span>
                  Good With Kids
                </label>
                <select
                  value={selectedGoodWithKids}
                  onChange={(e) => setSelectedGoodWithKids(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border-2 border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400 focus:bg-white/10 transition-all duration-300 cursor-pointer appearance-none text-sm"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1.25em',
                  }}
                >
                  {goodWithKidsOptions.map(option => (
                    <option key={option} value={option} className="bg-gray-800">
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Apartment Friendly Checkbox */}
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={apartmentFriendly}
                    onChange={(e) => setApartmentFriendly(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-purple-500/30 bg-white/5 checked:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-purple-300 group-hover:text-purple-200 transition-colors flex items-center gap-2">
                    <span>🏢</span>
                    Apartment Friendly
                  </span>
                </label>
              </div>

              {/* Colors Multi-select */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                  <span>🎨</span>
                  Colors {selectedColors.length > 0 && `(${selectedColors.length})`}
                </label>
                <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-white/5 border border-purple-500/20 rounded-xl custom-scrollbar">
                  {allColors.map(color => (
                    <label key={color} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedColors.includes(color)}
                        onChange={() => handleColorToggle(color)}
                        className="w-4 h-4 rounded border-2 border-purple-500/30 bg-white/5 checked:bg-purple-600 focus:outline-none cursor-pointer"
                      />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                        {color}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Temperament Multi-select */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                  <span>😊</span>
                  Temperament {selectedTemperaments.length > 0 && `(${selectedTemperaments.length})`}
                </label>
                <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-white/5 border border-purple-500/20 rounded-xl custom-scrollbar">
                  {allTemperaments.map(temp => (
                    <label key={temp} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedTemperaments.includes(temp)}
                        onChange={() => handleTemperamentToggle(temp)}
                        className="w-4 h-4 rounded border-2 border-purple-500/30 bg-white/5 checked:bg-purple-600 focus:outline-none cursor-pointer"
                      />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                        {temp}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </aside>

          {/* Right Content Area */}
          <main className="flex-1 space-y-6">
            
            {/* Results Count Bar */}
            <div className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-2xl border-2 border-purple-500/30 rounded-2xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <span className="text-white text-lg font-semibold">
                  {filteredBreeds.length} breed{filteredBreeds.length !== 1 ? 's' : ''} found
                </span>
              </div>
              <div className="text-gray-300 text-sm">
                Page {currentPage} of {totalPages || 1}
              </div>
            </div>

            {/* Breeds Grid */}
            {currentBreeds.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
                  {currentBreeds.map((breedName) => {
                    const breed = breedsData[breedName];
                    const imageUrl = breed.img_url || getPlaceholderImage(breedName);
                    
                    return (
                      <div
                        key={breedName}
                        onClick={() => handleBreedClick(breedName)}
                        className="group bg-white/5 backdrop-blur-2xl border-2 border-purple-500/30 rounded-3xl overflow-hidden hover:border-purple-400 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 cursor-pointer"
                      >
                        {/* Image Container */}
                        <div className="relative h-64 overflow-hidden bg-gradient-to-br from-purple-900/20 to-indigo-900/20">
                          <img 
                            src={imageUrl}
                            alt={breedName}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                              e.target.src = getPlaceholderImage(breedName);
                            }}
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                          
                          {/* Overlay Text */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="px-6 py-3 bg-purple-600 text-white font-bold rounded-full text-sm border-2 border-white/30 backdrop-blur-sm">
                              View Details →
                            </span>
                          </div>
                        </div>

                      {/* Card Content */}
                        <div className="p-6 space-y-4">
                          <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors duration-300 line-clamp-1">
                            {breedName}
                          </h3>
                          
                          <div className="flex flex-wrap gap-2">
                            <span className="px-4 py-2 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/40 text-purple-200 text-xs font-semibold rounded-full">
                              {breed.size}
                            </span>
                            <span className="px-4 py-2 bg-gradient-to-br from-indigo-600/20 to-blue-600/20 border border-indigo-500/40 text-indigo-200 text-xs font-semibold rounded-full">
                              {breed.group}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <span className="text-lg">🕐</span>
                            <span>{breed.life_span}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white/5 border-2 border-purple-500/30 rounded-xl text-white font-semibold hover:bg-white/10 hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      ← Previous
                    </button>

                    <div className="flex gap-2">
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => handlePageChange(pageNumber)}
                              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                                currentPage === pageNumber
                                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-2 border-purple-400 shadow-lg shadow-purple-500/50'
                                  : 'bg-white/5 border-2 border-purple-500/30 text-white hover:bg-white/10 hover:border-purple-400'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        } else if (
                          pageNumber === currentPage - 2 ||
                          pageNumber === currentPage + 2
                        ) {
                          return (
                            <span key={pageNumber} className="px-2 py-2 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white/5 border-2 border-purple-500/30 rounded-xl text-white font-semibold hover:bg-white/10 hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <div className="bg-white/5 backdrop-blur-2xl border-2 border-purple-500/30 rounded-3xl p-12 max-w-md mx-auto">
                  <span className="text-7xl block mb-6"> </span>
                  <h3 className="text-2xl font-bold text-white mb-4">No Breeds Found</h3>
                  <p className="text-gray-400 mb-6">
                    No breeds match your current search criteria. Try adjusting your filters.
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-full hover:scale-105 hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Custom CSS for animations and scrollbar */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease;
        }

        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        select option {
          background-color: #1f2937;
          color: white;
          padding: 0.5rem;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.5);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.7);
        }
      `}</style>
    </div>
  );
};

export default BreedsPage;