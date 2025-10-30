import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center',
            padding: '2rem',
            fontFamily: 'Inter, sans-serif',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Background particles */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            zIndex: 0
          }}>
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: Math.random() * 60 + 20 + 'px',
                  height: Math.random() * 60 + 20 + 'px',
                  background: `rgba(255, 255, 255, ${Math.random() * 0.1 + 0.05})`,
                  borderRadius: '50%',
                  top: Math.random() * 100 + '%',
                  left: Math.random() * 100 + '%',
                  animation: `floatRandom ${Math.random() * 10 + 15}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 5}s`
                }}
              />
            ))}
          </div>

          <div style={{ position: 'relative', zIndex: 1, animation: 'fadeInScale 0.6s ease-out' }}>
            <div style={{ 
              fontSize: '5rem', 
              marginBottom: '2rem',
              animation: 'bounce 2s ease-in-out infinite'
            }}>🚫</div>
            <h1 style={{ 
              fontSize: '2.5rem', 
              marginBottom: '1rem',
              fontWeight: '900',
              animation: 'slideInDown 0.6s ease-out'
            }}>Oops! Something went wrong</h1>
            <p style={{ 
              marginBottom: '2.5rem', 
              opacity: 0.9,
              fontSize: '1.2rem',
              animation: 'fadeIn 0.8s ease-out 0.2s both'
            }}>
              We're sorry, but something unexpected happened.
            </p>
            <div
              style={{ 
                display: 'flex', 
                gap: '1rem', 
                justifyContent: 'center',
                flexWrap: 'wrap',
                animation: 'slideInUp 0.8s ease-out 0.4s both'
              }}
            >
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                style={{
                  background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                  color: '#000',
                  border: 'none',
                  padding: '1rem 2.5rem',
                  borderRadius: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 25px rgba(255, 215, 0, 0.4)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 12px 35px rgba(255, 215, 0, 0.6)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.4)';
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.3)',
                  padding: '1rem 2.5rem',
                  borderRadius: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                }}
              >
                Reload Page
              </button>
            </div>
          </div>

          <style>{`
            @keyframes floatRandom {
              0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
              25% { transform: translate(20px, -20px) scale(1.1); opacity: 0.5; }
              50% { transform: translate(-15px, -40px) scale(0.9); opacity: 0.4; }
              75% { transform: translate(-20px, -20px) scale(1.05); opacity: 0.6; }
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-20px); }
            }
            @keyframes slideInDown {
              from { opacity: 0; transform: translateY(-30px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes slideInUp {
              from { opacity: 0; transform: translateY(30px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes fadeInScale {
              from { opacity: 0; transform: scale(0.9); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced Loading Component
const LoadingSpinner = () => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      overflow: 'hidden'
    }}
  >
    {/* Animated Background Particles */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      zIndex: 0
    }}>
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: Math.random() * 80 + 30 + 'px',
            height: Math.random() * 80 + 30 + 'px',
            background: `radial-gradient(circle, rgba(255, 255, 255, ${Math.random() * 0.15 + 0.05}), transparent)`,
            borderRadius: '50%',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            animation: `floatRandom ${Math.random() * 15 + 20}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 8}s`,
            pointerEvents: 'none'
          }}
        />
      ))}
      
      {/* Twinkling stars */}
      {[...Array(50)].map((_, i) => (
        <div
          key={`star-${i}`}
          style={{
            position: 'absolute',
            width: Math.random() * 4 + 2 + 'px',
            height: Math.random() * 4 + 2 + 'px',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '50%',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
            pointerEvents: 'none',
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
          }}
        />
      ))}
    </div>

    {/* Main Content */}
    <div style={{ 
      textAlign: 'center', 
      color: 'white', 
      position: 'relative', 
      zIndex: 1,
      animation: 'fadeInScale 0.8s ease-out'
    }}>
      {/* Animated Logo */}
      <div style={{
        marginBottom: '3rem',
        animation: 'logoEntrance 1s ease-out'
      }}>
        <div style={{
          fontSize: '6rem',
          marginBottom: '1rem',
          animation: 'bounce 2s ease-in-out infinite',
          filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3))'
        }}>
          🐕
        </div>
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: '900',
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.8) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          animation: 'glow 2s ease-in-out infinite'
        }}>
           Pawdentify
        </h1>
        <div style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.8)',
          letterSpacing: '3px',
          animation: 'fadeIn 1s ease-out 0.5s both'
        }}>
          Infosys mobilenet v2
        </div>
      </div>

      {/* Enhanced Spinner */}
      <div style={{
        position: 'relative',
        display: 'inline-block',
        marginBottom: '2.5rem'
      }}>
        {/* Outer ring */}
        <div
          style={{
            width: '100px',
            height: '100px',
            border: '6px solid rgba(255, 255, 255, 0.2)',
            borderTop: '6px solid #FFD700',
            borderRight: '6px solid #FFA500',
            borderRadius: '50%',
            animation: 'spin 1.5s cubic-bezier(0.5, 0, 0.5, 1) infinite',
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)'
          }}
        ></div>
        
        {/* Inner ring */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '70px',
            height: '70px',
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderBottom: '4px solid rgba(255, 255, 255, 0.8)',
            borderRadius: '50%',
            animation: 'spinReverse 1s linear infinite'
          }}
        ></div>

        {/* Center pulse */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '30px',
            height: '30px',
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            borderRadius: '50%',
            animation: 'pulse 2s ease-in-out infinite',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.6)'
          }}
        ></div>
      </div>

      {/* Loading Text */}
      <h2 style={{ 
        fontSize: '2rem', 
        marginBottom: '1rem',
        fontWeight: '800',
        animation: 'slideInUp 0.8s ease-out 0.3s both'
      }}>
        Loading  Pawdentify
      </h2>
      
      {/* Animated dots */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '0.5rem',
        marginBottom: '1.5rem'
      }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: '12px',
            height: '12px',
            background: 'white',
            borderRadius: '50%',
            animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`
          }}></div>
        ))}
      </div>

 

      {/* Progress bar */}
      <div style={{
        width: '300px',
        height: '6px',
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '10px',
        margin: '2rem auto 0',
        overflow: 'hidden',
        animation: 'fadeIn 1s ease-out 0.8s both'
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #FFD700, #FFA500, #FFD700)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s linear infinite',
          borderRadius: '10px',
          boxShadow: '0 0 15px rgba(255, 215, 0, 0.5)'
        }}></div>
      </div>
    </div>

    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      @keyframes spinReverse {
        to { transform: translate(-50%, -50%) rotate(-360deg); }
      }
      
      @keyframes pulse {
        0%, 100% { 
          transform: translate(-50%, -50%) scale(1); 
          opacity: 1;
        }
        50% { 
          transform: translate(-50%, -50%) scale(1.2); 
          opacity: 0.8;
        }
      }
      
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-15px); }
        60% { transform: translateY(-8px); }
      }
      
      @keyframes floatRandom {
        0%, 100% { 
          transform: translate(0, 0) scale(1); 
          opacity: 0.3;
        }
        25% { 
          transform: translate(20px, -20px) scale(1.1); 
          opacity: 0.5;
        }
        50% { 
          transform: translate(-15px, -40px) scale(0.9); 
          opacity: 0.4;
        }
        75% { 
          transform: translate(-20px, -20px) scale(1.05); 
          opacity: 0.6;
        }
      }
      
      @keyframes twinkle {
        0%, 100% { opacity: 0.2; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.3); }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes fadeInScale {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
      
      @keyframes slideInUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes glow {
        0%, 100% { 
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }
        50% { 
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.8), 0 0 30px rgba(255, 215, 0, 0.4);
        }
      }
      
      @keyframes shimmer {
        0% { background-position: 0% 50%; }
        100% { background-position: 200% 50%; }
      }
      
      @keyframes logoEntrance {
        0% { 
          opacity: 0; 
          transform: scale(0.5) rotate(-10deg); 
        }
        60% { 
          transform: scale(1.1) rotate(5deg); 
        }
        100% { 
          opacity: 1; 
          transform: scale(1) rotate(0deg); 
        }
      }
    `}</style>
  </div>
);

// App initialization
function initializeApp() {
  const container = document.getElementById('root');

  if (!container) {
    throw new Error(
      'Root element not found. Make sure you have a div with id="root" in your HTML.'
    );
  }

  const root = createRoot(container);

  // Show loading screen initially
  root.render(<LoadingSpinner />);

  // Initialize app after brief loading
  setTimeout(() => {
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  }, 2500);

  return root;
}

// Initialize the application
try {
  initializeApp();
} catch (error) {
  console.error('Failed to initialize app:', error);

  // Enhanced fallback error display
  document.getElementById('root').innerHTML = `
    <div style="
      display: flex; 
      align-items: center; 
      justify-content: center; 
      min-height: 100vh; 
      font-family: Inter, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding: 2rem;
    ">
      <div>
        <div style="font-size: 5rem; margin-bottom: 2rem; animation: bounce 2s ease-in-out infinite;">🚫</div>
        <h1 style="font-size: 2.5rem; font-weight: 900; margin-bottom: 1rem;">Application Failed to Load</h1>
        <p style="font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9;">We encountered a critical error while starting the application.</p>
        <button 
          onclick="window.location.reload()" 
          style="
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #000; 
            border: none; 
            padding: 1rem 2.5rem; 
            border-radius: 15px; 
            font-weight: 700; 
            cursor: pointer; 
            font-size: 1.1rem;
            box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4);
            transition: all 0.3s ease;
          "
          onmouseover="this.style.transform='translateY(-3px) scale(1.05)'; this.style.boxShadow='0 12px 35px rgba(255, 215, 0, 0.6)';"
          onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 8px 25px rgba(255, 215, 0, 0.4)';"
        >
          Reload Page
        </button>
      </div>
    </div>
  `;
}

// Hot module replacement for development
if (module.hot && process.env.NODE_ENV === 'development') {
  module.hot.accept('./App', () => {
    const NextApp = require('./App').default;
    const container = document.getElementById('root');
    const root = createRoot(container);

    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <NextApp />
        </ErrorBoundary>
      </React.StrictMode>
    );
  });
}