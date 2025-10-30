import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

const SimpleLanguageSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');

  // Load Google Translate only once when component mounts
  useEffect(() => {
    // Add Google Translate script to the page
    const addScript = () => {
      // Check if script already exists
      if (document.getElementById('google-translate-script')) {
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.type = 'text/javascript';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    };

    // Define the callback function that Google Translate will call
    window.googleTranslateElementInit = function() {
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,hi,es,fr,de,ja,zh-CN,ar,pt,ru',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
          }, 
          'google_translate_element'
        );
      } catch (error) {
        console.log('Translation widget initialization error:', error);
      }
    };

    addScript();
  }, []);

  const changeLanguage = (langCode) => {
    setCurrentLang(langCode);
    setIsOpen(false);

    if (langCode === 'en') {
      // Clear translation and reload page
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        if (name.trim().indexOf('googtrans') !== -1) {
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }
      }
      window.location.reload();
    } else {
      // Set language cookie
      document.cookie = `googtrans=/en/${langCode};path=/`;
      document.cookie = `googtrans=/en/${langCode};path=/;domain=` + window.location.hostname;
      
      // Try to trigger translation via the select element
      setTimeout(() => {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
          select.value = langCode;
          select.dispatchEvent(new Event('change'));
        }
        // Reload to apply translation
        window.location.reload();
      }, 100);
    }
  };

  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];

  return (
    <>
      {/* Hidden Google Translate Widget */}
      <div id="google_translate_element" style={{ display: 'none' }}></div>

      {/* Custom Language Selector */}
      <div style={{ position: 'relative', zIndex: 1000 }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontSize: '14px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Globe size={20} />
          <span style={{ fontSize: '18px' }}>{currentLanguage.flag}</span>
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setIsOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999,
              }}
            />
            {/* Dropdown */}
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                minWidth: '200px',
                overflow: 'hidden',
                animation: 'slideDown 0.2s ease',
                zIndex: 1000,
              }}
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 16px',
                    background: currentLang === lang.code ? '#e8f5e9' : 'white',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: currentLang === lang.code ? '#2e7d32' : '#333',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (currentLang !== lang.code) {
                      e.currentTarget.style.background = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentLang !== lang.code) {
                      e.currentTarget.style.background = 'white';
                    } else {
                      e.currentTarget.style.background = '#e8f5e9';
                    }
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{lang.flag}</span>
                  <span style={{ flex: 1, fontWeight: 500 }}>{lang.name}</span>
                  {currentLang === lang.code && (
                    <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Hide all Google Translate UI elements */
        .goog-te-banner-frame.skiptranslate {
          display: none !important;
        }
        
        body {
          top: 0px !important;
        }
        
        .skiptranslate {
          display: none !important;
        }

        #google_translate_element {
          display: none !important;
        }

        .goog-te-gadget {
          display: none !important;
        }

        .goog-logo-link {
          display: none !important;
        }

        .goog-te-balloon-frame {
          display: none !important;
        }

        #goog-gt-tt {
          display: none !important;
        }

        .goog-te-menu-value span {
          display: none !important;
        }
      `}</style>
    </>
  );
};

export default SimpleLanguageSwitcher;