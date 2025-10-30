import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useAuth,
} from '@clerk/clerk-react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebase'; 
import styles from './App.module.css';
import PredictionPage from './pages/PredictionPage';
import HomePage from './pages/HomePage';
import VaccinationTracker from './pages/VaccinationTracker';
import AboutPage from './pages/AboutPage';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import HelpPage from './pages/HelpPage';
import BackgroundMusic from './components/BackgroundMusic';
import BreedsPage from './pages/BreedsDirectoryPage';
import BreedDetailPage from './pages/BreedDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import FloatingActionButtons from './components/FloatingActionButtons';
import FeedbackPage from './pages/FeedbackPage';
import PredictionHistoryPage from './pages/PredictionHistoryPage';

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing REACT_APP_CLERK_PUBLISHABLE_KEY in .env file');
}

const ProtectedRoute = ({ children }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

const PageTransition = ({ children }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('enter');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('exit');
    }
  }, [location, displayLocation]);

  const handleAnimationEnd = () => {
    if (transitionStage === 'exit') {
      setDisplayLocation(location);
      setTransitionStage('enter');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  return (
    <>
      <div
        className={`page-content ${transitionStage}`}
        onAnimationEnd={handleAnimationEnd}
      >
        <Routes location={displayLocation}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/breeds" element={<BreedsPage />} />
          <Route path="/breeds/:breedName" element={<BreedDetailPage />} />
          <Route path="/vaccinations" element={<VaccinationTracker />} />
          <Route
            path="/predict"
            element={
              <ProtectedRoute>
                <PredictionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <PredictionHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
              
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <ProtectedRoute>
                <FeedbackPage />
              </ProtectedRoute>
            }
          />
          <Route path="/help" element={<HelpPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      <style>{`
        .page-content {
          min-height: 100vh;
          position: relative;
        }
        .page-content.enter {
          animation: slideInFade 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .page-content.exit {
          animation: slideOutFade 0.4s cubic-bezier(0.55, 0, 1, 0.45) forwards;
        }
        @keyframes slideInFade {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideOutFade {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(-30px);
          }
        }
      `}</style>
    </>
  );
};

// NEW: Component to handle user settings initialization
const UserSettingsInitializer = () => {
  const { userId, isSignedIn } = useAuth();

  useEffect(() => {
    const initializeUserSettings = async () => {
      if (!isSignedIn || !userId) {
        console.log('⏳ Waiting for user authentication...');
        return;
      }

      try {
        console.log('🔍 Checking user settings for:', userId);
        
        // Check if settings already exist
        const q = query(
          collection(db, 'userSettings'),
          where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          console.log('🆕 Creating new user settings...');
          
          // Create default settings for new user
          await addDoc(collection(db, 'userSettings'), {
            userId: userId,
            historyEnabled: true,
            updatedAt: new Date(),
            createdAt: new Date()
          });
          
          console.log('✅ User settings initialized successfully!');
        } else {
          console.log('✅ User settings already exist');
        }
      } catch (error) {
        console.error('❌ Error initializing user settings:', error);
      }
    };

    initializeUserSettings();
  }, [isSignedIn, userId]);

  return null; 
};

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router>
        <UserSettingsInitializer /> 
        <Navbar />
        <FloatingActionButtons />
        <PageTransition />
        <Footer />
        <BackgroundMusic
          src="/background-music.mp3"
          volume={0.5}
          autoStart={false}
        />
      </Router>
    </ClerkProvider>
  );
}

export default App;