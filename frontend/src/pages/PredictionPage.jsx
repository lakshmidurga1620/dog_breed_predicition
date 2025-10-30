import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  User, 
  Lock,
  Trash2,
  Eye,
} from 'lucide-react';
import { collection, addDoc, getDocs, query, orderBy, limit, where, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useUser } from '@clerk/clerk-react';

const TABS = ['overview', 'care', 'health', 'behavior', 'living', 'appearance'];

// Simplified Utility Component for Card Backgrounds
const GlassCard = ({ children, className = '', delay = 0 }) => (
  <div 
    className={`glass-card-simple ${className}`} 
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

const GlassTag = ({ children, delay = 0 }) => (
  <span className="glass-tag-simple" style={{ animationDelay: `${delay}ms` }}>
    {children}
  </span>
);

const DogBreedPredictor = ({ isDarkMode = true }) => {
  const { isSignedIn, user } = useUser();
  const userId = user?.id || 'guest';
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [tab, setTab] = useState('overview');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyEnabled, setHistoryEnabled] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fileInput = useRef(null);
  const containerRef = useRef(null);

  const API_URL = 'http://localhost:8000';
  const CONFIDENCE_THRESHOLD = 60;

  useEffect(() => {
    checkBackend();
    
    if (userId && userId !== 'guest') {
      fetchHistorySettings();
    }
  }, [userId]);

  const checkBackend = async () => {
    try {
      const res = await fetch(`${API_URL}/health`);
      setBackendStatus(res.ok ? 'online' : 'offline');
    } catch {
      setBackendStatus('offline');
    }
  };

  const fetchHistorySettings = async () => {
    if (!userId || userId === 'guest') return;
    
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
        console.log('✅ History settings loaded:', settings.historyEnabled);
      } else {
        console.log('📝 No settings found, using default (enabled)');
      }
    } catch (err) {
      console.error('❌ Error fetching history settings:', err);
    }
  };

  const fetchHistory = async () => {
    if (!userId) {
      console.log('⚠️ User not authenticated');
      return;
    }

    try {
      const q = query(
        collection(db, "predictions"),
        where('userId', '==', userId),
        orderBy("timestamp", "desc"),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const preds = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(preds);
      setShowHistory(true);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const viewHistoryResult = (historyItem) => {
    setFile(null); 
    
    // Load Cloudinary URL into preview
    setPreview(historyItem.imageURL || null);
    
    setResult({
      prediction: historyItem.prediction,
      breed_info: historyItem.breedInfo 
    });

    setShowHistory(false); 
    setTab('overview');
  };

  const deleteHistoryItem = async (historyId, e) => {
    e.stopPropagation(); // Prevent triggering viewHistoryResult
    
    if (!window.confirm('Are you sure you want to delete this prediction?')) {
      return;
    }

    setDeletingId(historyId);
    
    try {
      await deleteDoc(doc(db, "predictions", historyId));
      setHistory(prev => prev.filter(item => item.id !== historyId));
      console.log('✅ Prediction deleted successfully');
    } catch (err) {
      console.error('❌ Error deleting prediction:', err);
      alert('Failed to delete prediction. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024;
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a valid image (JPG, PNG, WebP)');
      return;
    }
    if (selectedFile.size > maxSize) {
      setError('Image must be smaller than 10MB');
      return;
    }
    setFile(selectedFile);
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const predict = async () => {
    if (!file) {
      setError('Please upload an image first.');
      return;
    }

    setLoading(true);
    setError(null);
    
    let data;
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId); // Send userId to backend for Cloudinary folder structure
      
      const res = await fetch(`${API_URL}/predict`, { 
        method: 'POST', 
        body: formData,
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || errData.message || 'Prediction failed');
      }
      
      data = await res.json();
      
      setResult(data);
      setBackendStatus('online');
      
      // Save to Firestore if authenticated, history is enabled, and Cloudinary URL exists
      if (isSignedIn && userId && userId !== 'guest' && historyEnabled && data.image_url) {
        try {
          await addDoc(collection(db, "predictions"), {
            userId: userId,
            timestamp: new Date(),
            imageURL: data.image_url, // Cloudinary URL from backend
            prediction: data.prediction,
            breedInfo: data.breed_info
          });
          console.log("✅ Prediction and Cloudinary URL saved to Firestore");
        } catch (firestoreErr) {
          console.error("❌ Failed to save prediction:", firestoreErr);
        }
      } else {
        if (!historyEnabled) {
          console.log('📝 History tracking is disabled - prediction not saved');
        }
        if (!isSignedIn || userId === 'guest') {
          console.log('🔒 User not authenticated - prediction not saved');
        }
        if (!data.image_url) {
          console.log('⚠️ No Cloudinary URL received from backend');
        }
      }

    } catch (err) {
      setError(err.message || 'Prediction API failed.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setTab('overview');
    if (fileInput.current) fileInput.current.value = '';
  };

  // Simplified renderInfo for improved performance
  const renderInfo = () => {
    if (!result?.breed_info) return null;
    const info = result.breed_info;

    if (tab === 'overview') {
      return (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Size', value: info.size, icon: '📏', gradient: 'from-cyan-400 to-indigo-600' },
              { label: 'Energy', value: info.energy_level, icon: '⚡', gradient: 'from-yellow-400 to-red-600' },
              { label: 'Lifespan', value: info.life_span, icon: '⏰', gradient: 'from-green-400 to-teal-600' },
              { label: 'Group', value: info.group, icon: '🏷️', gradient: 'from-purple-400 to-rose-600' }
            ].map((item, idx) => (
              <GlassCard key={item.label} delay={idx * 100}>
                <div className="text-4xl mb-3">{item.icon}</div>
                <div className="text-xs text-white/60 mb-1 font-bold uppercase tracking-widest">{item.label}</div>
                <div className={`text-xl font-black bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>{item.value}</div>
              </GlassCard>
            ))}
          </div>

          <GlassCard delay={400}>
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-xl font-black text-white">Temperament</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {(info.temperament || []).map((trait, i) => (
                <GlassTag key={i} delay={i * 50}>{trait}</GlassTag>
              ))}
            </div>
          </GlassCard>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Trainability', value: info.trainability, icon: '🎓' },
              { label: 'Good with Kids', value: info.good_with_kids, icon: '👶' },
              { label: 'Good with Pets', value: info.good_with_pets, icon: '🐕' },
              { label: 'Barking', value: info.barking_tendency, icon: '🔊' },
              { label: 'Origin', value: info.origin, icon: '🌍' },
              { label: 'Bred For', value: info.bred_for, icon: '🎯' }
            ].map((item, idx) => (
              <GlassCard key={item.label} className="p-4" delay={idx * 80}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="text-xs text-white/60 font-bold uppercase tracking-wider">{item.label}</div>
                </div>
                <div className="text-base font-bold text-white pl-1">{item.value}</div>
              </GlassCard>
            ))}
          </div>
        </div>
      );
    }

    if (tab === 'care') {
      return (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              { title: 'Exercise', icon: '🏃', gradient: 'from-orange-500 to-red-600', data: [
                { label: 'Needs', value: info.exercise_needs },
                { label: 'Energy Level', value: info.energy_level },
                { label: 'Mental Stimulation', value: info.mental_stimulation_needs },
                { label: 'Playfulness', value: info.playfulness }
              ]},
              { title: 'Grooming', icon: '✂️', gradient: 'from-pink-500 to-rose-600', data: [
                { label: 'Grooming Needs', value: info.grooming_needs },
                { label: 'Brushing', value: info.brushing_frequency },
                { label: 'Shedding', value: info.shedding_level }
              ]},
              { title: 'Nutrition', icon: '🍖', gradient: 'from-green-500 to-emerald-600', data: [
                { label: 'Daily Food', value: info.daily_food_amount },
                { label: 'Calories', value: info.calorie_requirements },
                { label: 'Feeding Schedule', value: info.feeding_schedule },
                { label: 'Food Type', value: info.food_type_preferences },
                { label: 'Weight Management', value: info.weight_management }
              ]},
              { title: 'Training', icon: '🎓', gradient: 'from-blue-500 to-indigo-600', data: [
                { label: 'Trainability', value: info.trainability },
                { label: 'Prey Drive', value: info.prey_drive },
                { label: 'Independence', value: info.independence_level }
              ]}
            ].map((section, idx) => (
              <GlassCard key={section.title} delay={idx * 100}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">{section.icon}</div>
                  <h3 className={`text-xl font-black bg-gradient-to-r ${section.gradient} bg-clip-text text-transparent`}>{section.title}</h3>
                </div>
                <div className="space-y-2">
                  {section.data.map((item, i) => (
                    <div key={item.label} className="flex justify-between items-center py-2 px-3 rounded-lg bg-white/5 transition-colors duration-300">
                      <span className="text-sm text-white/70 font-semibold flex items-center gap-1">
                        <ChevronRight className="w-3 h-3 text-white/40" />
                        {item.label}
                      </span>
                      <span className="text-sm font-bold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>

          {info.exercise_preferences && info.exercise_preferences.length > 0 && (
            <GlassCard delay={400}>
              <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                <span className="text-3xl">🎯</span>
                Exercise Preferences
              </h3>
              <div className="flex flex-wrap gap-2">
                {info.exercise_preferences.map((pref, i) => (
                  <GlassTag key={i} delay={i * 50}>{pref}</GlassTag>
                ))}
              </div>
            </GlassCard>
          )}

          {info.treats_guidelines && (
            <GlassCard delay={500}>
              <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                <span className="text-3xl">🦴</span>
                Treats Guidelines
              </h3>
              <p className="text-white/90 text-sm leading-relaxed">{info.treats_guidelines}</p>
            </GlassCard>
          )}
        </div>
      );
    }

    if (tab === 'health') {
      return (
        <div className="space-y-6 animate-fade-in">
          <GlassCard>
            <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
              <span className="text-3xl">💊</span>
              Health Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Life Span', value: info.life_span, icon: '⏰' },
                { label: 'Height Range', value: info.height_range, icon: '📏' },
                { label: 'Weight Range', value: info.weight_range, icon: '⚖️' },
                { label: 'Hypoallergenic', value: info.hypoallergenic ? 'Yes' : 'No', icon: '🤧' }
              ].map((item, i) => (
                <div key={item.label} className="health-item-simple" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-sm text-white/70 font-semibold">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {info.common_health_issues && info.common_health_issues.length > 0 && (
            <div className="glass-card-gradient red" style={{ animationDelay: '200ms' }}>
              <h3 className="text-xl font-black text-red-200 flex items-center gap-3 mb-4">
                <span className="text-3xl">🏥</span>
                Common Health Issues
              </h3>
              <div className="flex flex-wrap gap-2">
                {info.common_health_issues.map((issue, i) => (
                  <span key={i} className="badge-simple red" style={{ animationDelay: `${i * 50}ms` }}>{issue}</span>
                ))}
              </div>
            </div>
          )}

          {info.special_nutritional_needs && info.special_nutritional_needs.length > 0 && (
            <div className="glass-card-gradient cyan" style={{ animationDelay: '400ms' }}>
              <h3 className="text-xl font-black text-cyan-200 flex items-center gap-3 mb-4">
                <span className="text-3xl">💊</span>
                Special Nutritional Needs
              </h3>
              <div className="flex flex-wrap gap-2">
                {info.special_nutritional_needs.map((need, i) => (
                  <span key={i} className="badge-simple cyan" style={{ animationDelay: `${i * 50}ms` }}>{need}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (tab === 'behavior') {
      return (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard>
              <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                <span className="text-3xl">🐾</span>
                Social Traits
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Social Needs', value: info.social_needs, icon: '👥' },
                  { label: 'Stranger Friendliness', value: info.stranger_friendliness, icon: '👋' },
                  { label: 'Protective Instincts', value: info.protective_instincts, icon: '🛡️' },
                  { label: 'Sensitivity Level', value: info.sensitivity_level, icon: '💫' },
                  { label: 'Noise Sensitivity', value: info.noise_sensitivity, icon: '🔔' }
                ].map((item, i) => (
                  <div key={item.label} className="behavior-item-simple" style={{ animationDelay: `${i * 100}ms` }}>
                    <span className="text-sm text-white/70 font-semibold flex items-center gap-2">
                      <span className="text-xl">{item.icon}</span>
                      {item.label}
                    </span>
                    <span className="text-sm font-bold text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard delay={100}>
              <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                <span className="text-3xl">🧠</span>
                Behavior Patterns
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Wanderlust', value: info.wanderlust_potential, icon: '🗺️' },
                  { label: 'Adaptability', value: info.adaptability_level, icon: '🔄' },
                  { label: 'Car Travel', value: info.car_travel_adaptability, icon: '🚗' },
                  { label: 'Independence', value: info.independence_level, icon: '🦅' },
                  { label: 'Watch Dog Ability', value: info.watch_dog_ability, icon: '👁️' },
                  { label: 'Territorial Behavior', value: info.territorial_behavior, icon: '🏠' }
                ].map((item, i) => (
                  <div key={item.label} className="behavior-item-simple" style={{ animationDelay: `${i * 100}ms` }}>
                    <span className="text-sm text-white/70 font-semibold flex items-center gap-2">
                      <span className="text-xl">{item.icon}</span>
                      {item.label}
                    </span>
                    <span className="text-sm font-bold text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {info.similar_breeds && info.similar_breeds.length > 0 && (
            <div className="glass-card-gradient purple" style={{ animationDelay: '200ms' }}>
              <h3 className="text-xl font-black text-purple-200 flex items-center gap-3 mb-4">
                <span className="text-3xl">🔄</span>
                Similar Breeds
              </h3>
              <div className="flex flex-wrap gap-2">
                {info.similar_breeds.map((breed, i) => (
                  <span key={i} className="badge-simple purple" style={{ animationDelay: `${i * 50}ms` }}>{breed}</span>
                ))}
              </div>
            </div>
          )}

          {info.common_names && info.common_names.length > 0 && (
            <div className="glass-card-gradient cyan" style={{ animationDelay: '300ms' }}>
              <h3 className="text-xl font-black text-cyan-200 flex items-center gap-3 mb-4">
                <span className="text-3xl">🏷️</span>
                Common Names
              </h3>
              <div className="flex flex-wrap gap-2">
                {info.common_names.map((name, i) => (
                  <span key={i} className="badge-simple cyan" style={{ animationDelay: `${i * 50}ms` }}>{name}</span>
                ))}
              </div>
            </div>
          )}

          {info.adoption_considerations && (
            <div className="glass-card-gradient amber" style={{ animationDelay: '400ms' }}>
              <h3 className="text-xl font-black text-amber-200 flex items-center gap-3 mb-4">
                <span className="text-3xl">💡</span>
                Adoption Considerations
              </h3>
              <div className="space-y-2">
                {info.adoption_considerations.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 px-3 rounded-lg bg-white/5 transition-all duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                    <ChevronRight className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-amber-100 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (tab === 'living') {
      return (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard>
              <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                <span className="text-3xl">🏡</span>
                Living Requirements
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Apartment Friendly', value: info.apartment_friendly ? 'Yes' : 'No', icon: '🏢' },
                  { label: 'Space Requirements', value: info.space_requirements, icon: '📐' },
                  { label: 'Novice Owner Friendly', value: info.novice_owner_friendly ? 'Yes' : 'No', icon: '👤' },
                  { label: 'Alone Time Tolerance', value: info.alone_time_tolerance, icon: '⏱️' },
                  { label: 'Cold Tolerance', value: info.cold_tolerance, icon: '❄️' },
                  { label: 'Heat Tolerance', value: info.heat_tolerance, icon: '☀️' }
                ].map((item, i) => (
                  <div key={item.label} className="behavior-item-simple" style={{ animationDelay: `${i * 100}ms` }}>
                    <span className="text-sm text-white/70 font-semibold flex items-center gap-2">
                      <span className="text-xl">{item.icon}</span>
                      {item.label}
                    </span>
                    <span className="text-sm font-bold text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard delay={100}>
              <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                <span className="text-3xl">💰</span>
                Cost & Maintenance
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Cost Range', value: info.cost_range, icon: '💵' },
                  { label: 'Maturity Age', value: info.maturity_age, icon: '📅' },
                  { label: 'Gender Size Differences', value: info.gender_size_differences, icon: '⚖️' }
                ].map((item, i) => (
                  <div key={item.label} className="behavior-item-simple" style={{ animationDelay: `${i * 100}ms` }}>
                    <span className="text-sm text-white/70 font-semibold flex items-center gap-2">
                      <span className="text-xl">{item.icon}</span>
                      {item.label}
                    </span>
                    <span className="text-sm font-bold text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          <GlassCard delay={200}>
            <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
              <span className="text-3xl">💧</span>
              Water & Activity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="behavior-item-simple">
                <span className="text-sm text-white/70 font-semibold flex items-center gap-2">
                  <span className="text-xl">🏊</span>
                  Water Affinity
                </span>
                <span className="text-sm font-bold text-white">{info.water_affinity}</span>
              </div>
              <div className="behavior-item-simple">
                <span className="text-sm text-white/70 font-semibold flex items-center gap-2">
                  <span className="text-xl">🎾</span>
                  Playfulness
                </span>
                <span className="text-sm font-bold text-white">{info.playfulness}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      );
    }

    if (tab === 'appearance') {
      return (
        <div className="space-y-6 animate-fade-in">
          <GlassCard>
            <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
              <span className="text-3xl">🎨</span>
              Coat & Appearance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Coat Type', value: info.coat_type, icon: '🧥' },
                { label: 'Shedding Level', value: info.shedding_level, icon: '🌪️' },
                { label: 'Drool Amount', value: info.drool_amount, icon: '💧' }
              ].map((item, i) => (
                <div key={item.label} className="behavior-item-simple" style={{ animationDelay: `${i * 100}ms` }}>
                  <span className="text-sm text-white/70 font-semibold flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>{item.label}
                  </span>
                  <span className="text-sm font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {info.colors && info.colors.length > 0 && (
            <div className="glass-card-gradient purple" style={{ animationDelay: '100ms' }}>
              <h3 className="text-xl font-black text-purple-200 flex items-center gap-3 mb-4">
                <span className="text-3xl">🌈</span>
                Available Colors
              </h3>
              <div className="flex flex-wrap gap-2">
                {info.colors.map((color, i) => (
                  <span key={i} className="badge-simple purple" style={{ animationDelay: `${i * 50}ms` }}>{color}</span>
                ))}
              </div>
            </div>
          )}

          <GlassCard delay={200}>
            <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
              <span className="text-3xl">✂️</span>
              Grooming Schedule
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Professional Grooming', value: info.professional_grooming_frequency, icon: '💈' },
                { label: 'Brushing', value: info.brushing_frequency, icon: '🪮' },
                { label: 'Bathing', value: info.bathing_frequency, icon: '🛁' },
                { label: 'Nail Trimming', value: info.nail_trimming_frequency, icon: '💅' }
              ].map((item, i) => (
                <div key={item.label} className="behavior-item-simple" style={{ animationDelay: `${i * 100}ms` }}>
                  <span className="text-sm text-white/70 font-semibold flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    {item.label}
                  </span>
                  <span className="text-sm font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      );
    }
  };

  // Check if confidence is low
  const isLowConfidence = result && parseFloat(result.prediction.percentage) < CONFIDENCE_THRESHOLD;

  const bgClass = isDarkMode
    ? 'bg-gradient-to-br from-gray-900 via-slate-800 to-black'
    : 'bg-gradient-to-br from-indigo-400 to-purple-700';

  // --- Simplified Styles ---
  return (
    <div ref={containerRef} className={`min-h-screen ${bgClass} py-20 px-4 relative overflow-hidden`}>
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .animate-fade-in { animation: fade-in 0.6s ease-out backwards; }
        
        .glass-card-simple, .glass-card-small {
          position: relative;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 20px;
          transition: all 0.3s ease;
          animation: fade-in 0.5s ease-out backwards;
          overflow: hidden;
        }
        
        .glass-card-simple:hover, .glass-card-small:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-4px);
          box-shadow: 0 10px 30px rgba(139, 92, 246, 0.15);
        }
        
        .glass-tag-simple {
          display: inline-block;
          padding: 8px 16px;
          background: rgba(139, 92, 246, 0.1);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 9999px;
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.3s ease;
          animation: fade-in 0.5s ease-out backwards;
        }
        
        .glass-tag-simple:hover {
          background: rgba(139, 92, 246, 0.2);
          transform: scale(1.05);
        }
        
        .glass-card-gradient {
          position: relative;
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 20px;
          transition: all 0.3s ease;
          animation: fade-in 0.5s ease-out backwards;
          overflow: hidden;
        }
        
        .glass-card-gradient.red { background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05)); border: 1px solid rgba(239, 68, 68, 0.2); }
        .glass-card-gradient.cyan { background: linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(14, 165, 233, 0.05)); border: 1px solid rgba(56, 189, 248, 0.2); }
        .glass-card-gradient.purple { background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(147, 51, 234, 0.05)); border: 1px solid rgba(168, 85, 247, 0.2); }
        .glass-card-gradient.amber { background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05)); border: 1px solid rgba(251, 191, 36, 0.2); }
        .glass-card-gradient.orange { background: linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(234, 88, 12, 0.05)); border: 1px solid rgba(249, 115, 22, 0.2); }
        
        .badge-simple {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
          backdrop-filter: blur(4px);
          transition: all 0.3s ease;
          animation: fade-in 0.5s ease-out backwards;
        }
        
        .badge-simple.red { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: rgb(254, 202, 202); }
        .badge-simple.cyan { background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.2); color: rgb(207, 250, 254); }
        .badge-simple.purple { background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.2); color: rgb(233, 213, 255); }
        
        .badge-simple:hover { transform: scale(1.05); }
        
        .health-item-simple, .behavior-item-simple {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
          animation: fade-in 0.5s ease-out backwards;
        }
        
        .health-item-simple:hover, .behavior-item-simple:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateX(4px);
        }
        
        .history-item-card {
          position: relative;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 16px;
          transition: all 0.3s ease;
          cursor: pointer;
          animation: fade-in 0.5s ease-out backwards;
        }
        
        .history-item-card:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(139, 92, 246, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.2);
        }
        
        .delete-btn {
          opacity: 0;
          transition: all 0.3s ease;
        }
        
        .history-item-card:hover .delete-btn {
          opacity: 1;
        }
        
        @keyframes pulse-simple { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
      `}</style>
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ background: 'radial-gradient(circle 800px at 50% 50%, rgba(139, 92, 246, 0.2), transparent 70%)' }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-3 backdrop-blur-xl bg-white/10 border border-white/20 px-6 py-2 rounded-full mb-6 mt-4 transition-transform duration-300 shadow-xl">
            {backendStatus === 'online' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span className="text-white text-xs font-bold tracking-wide">
              {backendStatus === 'online' ? 'SYSTEM READY' : 'BACKEND OFFLINE'}
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tighter leading-none">
            Paw{' '}
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">dentify</span>
            </span>
          </h1>
          <p className="text-white/80 text-lg font-medium">Because Every Dog Deserves to Be Recognized</p>
        </div>

        {/* --- Main Content Area --- */}
        {!result ? (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 animate-fade-in">
            {/* Login Required Notice */}
            {!isSignedIn && (
              <div className="mb-6 bg-red-500/10 backdrop-blur-xl border-2 border-red-500/50 rounded-2xl p-5 text-red-200 flex items-center gap-4">
                <Lock className="w-7 h-7 flex-shrink-0" />
                <span className="font-semibold text-lg">
                  Login Required: Please sign in to use the predictor.
                </span>
              </div>
            )}
            
            <div
              className={`backdrop-blur-xl bg-white/5 border-2 ${dragging ? 'border-purple-400 bg-purple-500/10' : 'border-white/20'} rounded-2xl p-12 text-center cursor-pointer transition-all duration-300`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => !loading && isSignedIn && fileInput.current?.click()}
            >
              <input ref={fileInput} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files[0])} className="hidden" />

              {!preview ? (
                <div className="space-y-4">
                  <Upload className="w-16 h-16 mx-auto text-white/60" />
                  <h3 className="text-2xl font-black text-white mb-1">{dragging ? 'Release to Upload' : 'Upload Image'}</h3>
                  <p className="text-white/70 text-base">Drag & drop or click to select</p>
                  <div className="flex gap-3 justify-center flex-wrap pt-4">
                    {['JPG', 'PNG', 'WebP'].map((f, i) => (
                      <span key={f} className="backdrop-blur-xl bg-white/10 border border-white/20 px-4 py-2 rounded-xl text-white text-sm font-bold">{f}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img src={preview} alt="Preview" className="max-w-full max-h-[400px] mx-auto rounded-2xl shadow-xl transition-transform duration-300" />
                  <button onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="absolute -top-3 -right-3 p-3 bg-red-500 hover:bg-red-600 rounded-full text-white transition-all duration-300 shadow-lg">
                    <X className="w-5 h-5" />
                  </button>
                  <div className="mt-6 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-3 inline-block">
                    <p className="text-white font-bold text-sm">{file.name}</p>
                    <p className="text-white/70 text-xs mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-6 bg-red-500/10 backdrop-blur-xl border-2 border-red-500/50 rounded-2xl p-4 text-red-200 flex items-center gap-3 animate-fade-in">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <span className="font-semibold text-base">{error}</span>
              </div>
            )}

            {file && !loading && isSignedIn && (
              <button onClick={predict} disabled={backendStatus === 'offline'}
                className="w-full mt-8 relative group/btn overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed animate-fade-in">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl blur opacity-30 group-hover/btn:opacity-60 transition duration-300"></div>
                <div className="relative backdrop-blur-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-black py-4 rounded-xl text-xl flex items-center justify-center gap-3 transition-all duration-300 group-hover/btn:scale-[1.01]">
                  <Camera className="w-6 h-6" />
                  Identify Breed
                </div>
              </button>
            )}

            {/* View History Button */}
            {isSignedIn && (
              <div className="flex justify-center mt-6 animate-fade-in">
                <button
                  onClick={fetchHistory}
                  className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:opacity-90 transition-all duration-300 flex items-center gap-2 shadow-lg"
                >
                  <RefreshCw className="w-5 h-5" />
                  View Prediction History
                </button>
              </div>
            )}

            {/* Enhanced Display Recent Predictions */}
            {showHistory && (
              <div className="mt-8 max-w-4xl mx-auto backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-bold text-2xl flex items-center gap-2">
                    <RefreshCw className="w-6 h-6 text-purple-400" />
                    Recent Predictions
                  </h3>
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {history.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🐕</div>
                    <p className="text-white/70 text-lg">No previous predictions found.</p>
                    <p className="text-white/50 text-sm mt-2">Start by uploading your first dog image!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {history.map((h, idx) => (
                      <div
                        key={h.id}
                        className="history-item-card"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div className="flex gap-4">
                          {/* Thumbnail */}
                          {h.imageURL && (
                            <div className="flex-shrink-0">
                              <img 
                                src={h.imageURL} 
                                alt={h.prediction.breed}
                                className="w-24 h-24 rounded-lg object-cover border-2 border-white/10"
                              />
                            </div>
                          )}
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0" onClick={() => viewHistoryResult(h)}>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="text-white font-bold text-lg truncate">
                                {h.prediction.breed}
                              </h4>
                              <span className="flex-shrink-0 text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full font-bold border border-green-500/30">
                                {h.prediction.percentage}%
                              </span>
                            </div>
                            
                            <p className="text-white/60 text-sm mb-3">
                              {new Date(h.timestamp.seconds * 1000).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => viewHistoryResult(h)}
                                className="flex items-center gap-1 text-purple-300 hover:text-purple-200 text-sm font-semibold transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                            </div>
                          </div>
                          
                          {/* Delete Button */}
                          <button
                            onClick={(e) => deleteHistoryItem(h.id, e)}
                            disabled={deletingId === h.id}
                            className="delete-btn flex-shrink-0 p-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingId === h.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {file && !isSignedIn && (
              <div className="w-full mt-8 relative bg-gray-500/30 text-white font-black py-4 rounded-xl text-xl flex items-center justify-center gap-3 opacity-60 cursor-not-allowed">
                <Lock className="w-6 h-6" />
                Please Log In to Predict
              </div>
            )}

            {loading && (
              <div className="mt-8 text-center py-10 animate-fade-in">
                <Loader2 className="w-12 h-12 mx-auto text-purple-400 animate-spin mb-4" />
                <p className="text-white text-xl font-black mb-2">Analyzing...</p>
                <p className="text-white/70 text-sm">Processing with neural network</p>
              </div>
            )}
          </div>
        ) : isLowConfidence ? (
          // LOW CONFIDENCE SCREEN
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl animate-fade-in overflow-hidden">
            <div className="p-10 text-center border-b border-white/10 bg-gradient-to-br from-orange-500/20 to-red-500/10">
              <img src={preview} alt="Dog" className="w-32 h-32 mx-auto rounded-2xl object-cover shadow-xl mb-6 opacity-80" />
              <AlertTriangle className="w-16 h-16 mx-auto text-orange-400 mb-4" />
              <h2 className="text-4xl font-black text-orange-300 mb-3">Low Confidence Detection</h2>
              <div className="inline-flex items-center gap-3 backdrop-blur-xl bg-orange-500/30 border border-orange-400/50 rounded-full px-6 py-3 shadow-lg">
                <HelpCircle className="w-5 h-5 text-orange-300" />
                <span className="text-orange-200 font-black text-xl">
                  {result.prediction.percentage}% Confidence
                </span>
              </div>
            </div>

            <div className="p-8 space-y-5">
              <div className="glass-card-gradient orange">
                <div className="flex items-start gap-4 mb-4">
                  <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-orange-200 mb-2">Unable to Identify Breed with Confidence</h3>
                    <p className="text-orange-100 text-sm leading-relaxed">
                      The AI model's confidence level is below the acceptable threshold ({CONFIDENCE_THRESHOLD}%). The prediction may not be accurate.
                    </p>
                  </div>
                </div>
              </div>

              <GlassCard>
                <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                  <span className="text-2xl">🤔</span>
                  Possible Reasons
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: '📸', title: 'Image Quality Issues', desc: 'Poor lighting, blurry photo, or unusual angle' },
                    { icon: '🐶', title: 'Mixed Breed Dog', desc: 'The dog may have features from multiple breeds' },
                    { icon: '🔍', title: 'Partial View', desc: 'Important identifying features may not be visible' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 py-3 px-4 rounded-lg bg-white/5 border border-white/10 transition-all duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                      <span className="text-2xl flex-shrink-0">{item.icon}</span>
                      <div>
                        <h4 className="text-white font-bold text-base mb-0.5">{item.title}</h4>
                        <p className="text-white/70 text-xs">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

            <div className="p-8 border-t border-white/10 flex gap-4 justify-center bg-white/5">
              <button onClick={reset}
                className="backdrop-blur-xl bg-gradient-to-r from-indigo-500 to-purple-500 border-2 border-white/30 px-8 py-4 text-white font-black rounded-xl hover:scale-[1.02] transition-all duration-300 text-base flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Try Another Photo
              </button>
            </div>
          </div>
        ) : (
          // HIGH CONFIDENCE SCREEN
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl animate-fade-in">
            <div className="p-10 text-center border-b border-white/10 bg-white/5">
              <img src={preview} alt="Dog" className="w-32 h-32 mx-auto rounded-2xl object-cover shadow-xl mb-6 transition-transform duration-300" />
              <h2 className="text-4xl font-black text-white mb-4">{result.prediction.breed}</h2>
              <div className="inline-flex items-center gap-3 backdrop-blur-xl bg-white/10 border-white/20 border rounded-full px-6 py-3 transition-all duration-300 shadow-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-300 font-black text-xl">
                  {result.prediction.percentage}% Match
                </span>
              </div>
            </div>

            <div className="relative px-8 py-8 border-b border-white/10 overflow-hidden">
              <div className="relative flex justify-center gap-4 flex-wrap">
                {TABS.map((t, idx) => {
                  const isActive = tab === t;
                  const tabIcons = { overview: '📊', care: '💚', health: '🏥', behavior: '🐾', living: '🏡', appearance: '🎨' };
                  
                  return (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`relative flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 
                        ${isActive
                          ? `backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 text-white border-2 border-white/60 shadow-xl scale-105`
                          : 'backdrop-blur-xl bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/90 hover:border-white/30'
                        }`}
                    >
                      <span className="text-xl">{tabIcons[t]}</span>
                      <span className="relative tracking-wide">
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-8">{renderInfo()}</div>

            <div className="p-8 border-t border-white/10 flex gap-4 justify-center bg-white/5">
              <button onClick={reset}
                className="backdrop-blur-xl bg-white/10 border border-white/20 px-8 py-4 text-white font-black rounded-xl hover:scale-[1.02] hover:bg-white/20 transition-all duration-300 text-base shadow-lg">
                Try Another Photo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DogBreedPredictor;