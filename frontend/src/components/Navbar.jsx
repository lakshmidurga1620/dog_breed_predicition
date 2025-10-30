import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
} from '@clerk/clerk-react';
import SimpleLanguageSwitcher from './SimpleLanguageSwitcher';

const Navbar = () => {
  // Hardcoded to true, all theme-related state and functions removed.
  const isDarkMode = true; 
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('/');
  const navigate = useNavigate();
  const location = useLocation();

  // Theme-related useEffects are removed as theme is fixed.
  // We manually set the dark class on the component mount just in case.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location]);

  const navLinks = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/predict', label: 'Predict', icon: '🔮' },
    { path: '/breeds', label: 'Breeds', icon: '🐕' },
    { path: '/about', label: 'About', icon: 'ℹ️' },
    { path: '/history', label: 'History', icon: '📜' }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };
  
  // toggleDarkMode function removed as theme is fixed.

  return (
    // Fixed to dark mode background classes
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 dark ${ // Added 'dark' class
        isScrolled
          ? 'bg-gray-900/80 backdrop-blur-xl shadow-lg shadow-purple-500/5' // Dark scrolled state
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleNavigation('/')}
          >
            <div className="relative">
              <div className="text-4xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                🐾
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
            </div>
            <div className="flex flex-col">
              {/* Fixed to dark gradient text */}
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Pawdentify
              </span>
              {/* Fixed to dark text color */}
              <span className="text-xs font-semibold tracking-widest text-gray-400">
                Mind in Motion
              </span>
            </div>
          </div>

          {/* Desktop Navigation - Fixed to dark mode colors */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNavigation(link.path)}
                className={`relative px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 group ${
                  activeLink === link.path
                    ? 'text-purple-400' // Dark active color
                    : 'text-gray-300 hover:text-purple-400' // Dark default/hover color
                }`}
              >
                <span className="text-lg transform group-hover:scale-125 transition-transform duration-300">
                  {link.icon}
                </span>
                <span>{link.label}</span>
                {activeLink === link.path && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl"></div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full"></div>
              </button>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            <SimpleLanguageSwitcher />

            {/* DARK MODE TOGGLE BUTTON REMOVED FROM HERE */}

            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-400 to-purple-500 shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-300">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox:
                      'w-10 h-10 rounded-xl ring-2 ring-purple-500/20 hover:ring-purple-500/40 transition-all duration-300',
                  },
                }}
              />
            </SignedIn>
          </div>

          {/* Mobile Menu Button - Fixed to dark mode colors */}
          <button
            className="md:hidden relative w-10 h-10 flex flex-col items-center justify-center gap-1.5 group"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span
              className={`w-6 h-0.5 bg-gray-200 rounded-full transition-all duration-300 ${ // Fixed to dark color
                isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
              }`}
            ></span>
            <span
              className={`w-6 h-0.5 bg-gray-200 rounded-full transition-all duration-300 ${ // Fixed to dark color
                isMobileMenuOpen ? 'opacity-0' : ''
              }`}
            ></span>
            <span
              className={`w-6 h-0.5 bg-gray-200 rounded-full transition-all duration-300 ${ // Fixed to dark color
                isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
              }`}
            ></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu - Fixed to dark mode colors */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          isMobileMenuOpen ? 'max-h-screen' : 'max-h-0'
        }`}
      >
        <div className="px-4 pt-2 pb-4 space-y-2 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => handleNavigation(link.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeLink === link.path
                  ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-400' // Dark active color
                  : 'text-gray-300 hover:bg-gray-800' // Dark default/hover color
              }`}
            >
              <span className="text-xl">{link.icon}</span>
              <span>{link.label}</span>
            </button>
          ))}

          <div className="pt-4 space-y-2 border-t border-gray-800">
            <div className="px-4 py-2">
              <SimpleLanguageSwitcher />
            </div>

            {/* DARK MODE TOGGLE MOBILE BUTTON REMOVED FROM HERE */}
            
            <SignedOut>
              <SignInButton mode="modal">
                <button className="w-full px-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg transition-all duration-300">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center gap-3 px-4 py-3">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox:
                        'w-10 h-10 rounded-xl ring-2 ring-purple-500/20',
                    },
                  }}
                />
                <span className="text-sm text-gray-400">
                  Your Account
                </span>
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;