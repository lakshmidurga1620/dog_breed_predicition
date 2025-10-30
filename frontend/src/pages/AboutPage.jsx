import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ParticleBackground } from '../components/ParticlesBg';
import Floating3DElements from '../components/Floating3DElements';

// **Theme is hardcoded to Dark Mode**
const AboutPage = () => {
  const [isVisible, setIsVisible] = useState({});
  // isDarkMode is removed, and logic is hardcoded to dark theme styles
  const observerRefs = useRef([]);

  useEffect(() => {
    // Intersection Observer for animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    observerRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
      // Theme change listener removed
    };
  }, []);

  // Hardcoded dark mode styles for variables that were previously dynamic
  const darkBgGradient = 'bg-gradient-to-br from-gray-900 via-slate-800 to-black';
  const darkTextColor = 'text-gray-100';
  const darkSecondaryTextColor = 'text-gray-300';
  const darkCardBg = 'bg-gray-800 bg-opacity-50 border-gray-600 border-opacity-40';
  const darkPrivacyCardBg = 'bg-gray-800 bg-opacity-60 border-gray-600 border-opacity-30';
  const darkTechCardBg = 'bg-gray-800 bg-opacity-60 border-gray-600 border-opacity-30';

  return (
    <div className={`pt-20 min-h-screen relative overflow-hidden ${darkBgGradient}`}>
      <style>{`
        .guidelines-grid {
          display: grid;
          gap: 2.1rem;
          grid-template-columns: repeat(auto-fit,minmax(270px,1fr));
        }

        .guideline-card {
          background: rgba(30,30,30,0.85); /* Dark: 'rgba(30,30,30,0.85)' */
          border-radius: 18px;
          padding: 2.1rem 1.5rem 1.6rem 1.4rem;
          display: flex;
          align-items: flex-start;
          gap: 1.05rem;
          box-shadow: 0 6px 44px -10px #0005, 0 2px 22px 0 #ffffff15; /* Dark: '0 6px 44px -10px #0005, 0 2px 22px 0 #ffffff15' */
          border: 1.7px solid rgba(255,255,255,0.15); /* Dark: 'rgba(255,255,255,0.15)' */
          transform: translateY(40px) scale(0.97);
          opacity: 0;
          will-change: transform, opacity;
          transition: box-shadow 0.26s, border 0.23s, transform 0.3s;
          animation: fadeUp 0.62s cubic-bezier(.17,.67,.52,.96) both;
        }

        .guideline-card:hover, .guideline-card:focus {
          box-shadow: 0 12px 54px -8px #ffffff20, 0 6px 38px 0 #8f3fff40; /* Dark: '0 12px 54px -8px #ffffff20, 0 6px 38px 0 #8f3fff40' */
          border: 1.7px solid #fff176d5; /* Dark: '#fff176d5' */
          transform: scale(1.045) translateY(-8px);
        }

        .gi-icon {
          font-size: 2.4rem;
          line-height: 1.1;
          border-radius: 50%;
          background: rgba(255,255,255,0.12); /* Dark: 'rgba(255,255,255,0.12)' */
          margin-right: 0.25rem;
          margin-top: 0.07rem;
          box-shadow: 0 0 16px 2px #fffbe750; /* Dark: '0 0 16px 2px #fffbe750' */
          padding: .5rem .65rem;
          animation: bounceIn 0.74s cubic-bezier(.17,.67,.52,.96) both;
        }

        .gi-title {
          font-size: 1.21rem;
          font-weight: 700;
          color: #f3f4f6; /* Dark: '#f3f4f6' */
          margin-bottom: .33rem;
          letter-spacing: -.01em;
          text-shadow: 0 1px 6px #21212113; /* Dark: '0 1px 6px #21212113' */
        }

        .gi-desc {
          font-size: 1.08rem;
          color: rgba(255,255,255,.75); /* Dark: 'rgba(255,255,255,.75)' */
          font-weight: 400;
          line-height: 1.55;
        }

        .guideline-emoji-glow {
          filter: drop-shadow(0 0 20px #fff176) drop-shadow(0 2px 36px #ffecb3); /* Dark: 'drop-shadow(0 0 20px #fff176) drop-shadow(0 2px 36px #ffecb3)' */
          animation: pulseGlow 2.1s infinite alternate;
        }

        @keyframes pulseGlow {
          0% { filter: drop-shadow(0 0 15px #fff176) drop-shadow(0 0 16px #ffecb3); } /* Dark: 'drop-shadow(0 0 15px #fff176) drop-shadow(0 0 16px #ffecb3)' */
          100% { filter: drop-shadow(0 0 35px #fff8) drop-shadow(0 0 36px #ffd77673); } /* Dark: 'drop-shadow(0 0 35px #fff8) drop-shadow(0 0 36px #ffd77673)' */
        }

        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(40px) scale(.94);}
          65% { opacity: .94; }
          100% { opacity: 1; transform: translateY(0) scale(1);}
        }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.7);}
          to { opacity: 1; transform: scale(1);}
        }

        @keyframes bounceIn {
          0% { transform: scale(0.5) translateY(20px);}
          58% { transform: scale(1.08) translateY(-8px);}
          76% { transform: scale(0.96) translateY(4px);}
          100% { transform: scale(1) translateY(0);}
        }

        .fade-up { animation: fadeUp 0.7s both; }
        .bounce-in { animation: bounceIn 0.7s both;}

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.7);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-25px);
          }
        }

        @keyframes floatSlow {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(5deg);
          }
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.85;
          }
        }

        @keyframes elevate {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(255, 255, 255, 0.1); /* Dark: '0 4px 20px rgba(255, 255, 255, 0.1)' */
            transform: translateY(0px);
          }
          50% {
            box-shadow: 0 12px 40px rgba(255, 255, 255, 0.15); /* Dark: '0 12px 40px rgba(255, 255, 255, 0.15)' */
            transform: translateY(-4px);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        @keyframes slideInRotate {
          from {
            opacity: 0;
            transform: translateY(30px) rotate(-10deg);
          }
          to {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-20px);
          }
          60% {
            transform: translateY(-10px);
          }
        }

        @keyframes wave {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(15deg);
          }
          75% {
            transform: rotate(-15deg);
          }
        }

        @keyframes gradientMove {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes floatParticle {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          25% {
            transform: translate(30px, -30px) scale(1.2);
            opacity: 0.5;
          }
          50% {
            transform: translate(-20px, -60px) scale(0.9);
            opacity: 0.7;
          }
          75% {
            transform: translate(-40px, -30px) scale(1.1);
            opacity: 0.4;
          }
        }

        .animate-in {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-down {
          animation: fadeInDown 0.8s ease-out forwards;
        }

        .animate-left {
          animation: fadeInLeft 0.8s ease-out forwards;
        }

        .animate-right {
          animation: fadeInRight 0.8s ease-out forwards;
        }

        .animate-scale {
          animation: scaleIn 0.7s ease-out forwards;
        }

        .animate-rotate {
          animation: slideInRotate 0.9s ease-out forwards;
        }

        .card-hover {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-hover:hover {
          transform: translateY(-12px) scale(1.03) rotate(2deg);
          box-shadow: 0 25px 70px rgba(255, 255, 255, 0.1); /* Dark: '0 25px 70px rgba(255, 255, 255, 0.1)' */
        }

        .team-card-hover {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .team-card-hover:hover {
          transform: translateY(-15px) scale(1.05);
          box-shadow: 0 30px 80px rgba(255, 255, 255, 0.15); /* Dark: '0 30px 80px rgba(255, 255, 255, 0.15)' */
        }

        .floating {
          animation: float 4s ease-in-out infinite;
        }

        .floating-slow {
          animation: floatSlow 6s ease-in-out infinite;
        }

        .rotating {
          animation: rotate 20s linear infinite;
        }

        .pulsing {
          animation: pulse 2.5s ease-in-out infinite;
        }

        .elevating {
          animation: elevate 3s ease-in-out infinite;
        }

        .bouncing {
          animation: bounce 2s ease-in-out infinite;
        }

        .waving {
          animation: wave 2s ease-in-out infinite;
        }

        @media (max-width: 768px) {
          .hero-stats {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>


      {/* Hero Section */}
      <div className={`py-20 px-8 text-center relative z-10`}>
         <ParticleBackground isDarkMode={true} />
        <div className="max-w-6xl mx-auto">
          <div
            className={`animate-down inline-block backdrop-blur-lg py-3 px-8 rounded-full border-2 mb-8 bg-gray-800 bg-opacity-60 border-gray-600 border-opacity-40`}
            style={{
              animation:
                'fadeInDown 0.8s ease-out, pulse 3s ease-in-out infinite 1s',
            }}
          >
            <span className={`font-bold text-sm tracking-widest text-gray-200`}>
              Mind in Motion
            </span>
          </div>

          <h1
            className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-none mb-6 ${darkTextColor} drop-shadow-2xl`}
            style={{
              animation: 'fadeInUp 0.8s ease-out 0.2s both',
              textShadow: 'none'
            }}
          >
            About{' '}
            <span
              className="bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent"
              style={{
                backgroundSize: '200% 200%',
                animation: 'gradientMove 3s ease infinite',
              }}
            >
               Pawdentify
            </span>
          </h1>

          <p
            className={`text-xl sm:text-2xl max-w-3xl mx-auto mb-14 leading-relaxed ${darkSecondaryTextColor}`}
            style={{
              animation: 'fadeInUp 0.8s ease-out 0.4s both',
              textShadow: 'none'
            }}
          >
            Powered by cutting-edge artificial intelligence to help you
            understand your furry friend better. Experience instant breed
            identification with unmatched accuracy.
          </p>

          <div
            className="hero-stats grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto"
            style={{
              animation: 'fadeInUp 0.8s ease-out 0.6s both',
            }}
          >
            {[
              {
                number: '86%',
                label: 'Accuracy Rate',
                icon: '🎯',
                delay: '0s',
              },
              {
                number: '120+',
                label: 'Dog Breeds',
                icon: '🐕',
                delay: '0.1s',
              },
              {
                number: '<3s',
                label: 'Processing Time',
                icon: '⚡',
                delay: '0.2s',
              },
              {
                number: '20K+',
                label: 'Photos Trained',
                icon: '📊',
                delay: '0.3s',
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className={`card-hover elevating backdrop-blur-2xl py-8 px-6 rounded-3xl border-2 cursor-pointer ${darkCardBg}`}
                style={{
                  animationDelay: stat.delay,
                }}
              >
                <div
                  className="bouncing text-4xl mb-3"
                  style={{
                    animationDelay: stat.delay,
                  }}
                >
                  {stat.icon}
                </div>
                <div className={`text-3xl sm:text-4xl font-black mb-2 ${darkTextColor} drop-shadow-lg`}>
                  {stat.number}
                </div>
                <div className={`text-sm sm:text-base font-semibold tracking-wider ${darkSecondaryTextColor}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

            {/* Image Guidelines Section */}
      <div className="py-24 px-8 pb-20 w-full z-10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-16">
            <span
              className="guideline-emoji-glow text-7xl inline-block mb-4"
              style={{
                animation: 'popIn .8s cubic-bezier(.37,1.33,.58,1) backwards',
              }}
            >
              🐾
            </span>
            <h2 className={`text-5xl font-black m-0 tracking-tight drop-shadow-lg ${darkTextColor}`}>
              Perfect Dog Photo Tips
            </h2>
            <div className={`mt-4 mx-auto text-xl max-w-2xl font-normal leading-relaxed ${darkSecondaryTextColor}`}>
              For best results and AI "paw-dentification," give us a photo that
              truly shows your buddy's good side!
            </div>
          </div>

          <div className="guidelines-grid">
            <div
              className="guideline-card fade-up"
              style={{ animationDelay: '0.1s' }}
            >
              <div className="gi-icon bounce-in" style={{ color: '#43a047' }}>
                🐶
              </div>
              <div>
                <div className="gi-title">Clear Face</div>
                <div className="gi-desc">
                  Take a photo where your dog's face is unobstructed and looking
                  at the camera.
                </div>
              </div>
            </div>

            <div
              className="guideline-card fade-up"
              style={{ animationDelay: '0.22s' }}
            >
              <div className="gi-icon bounce-in" style={{ color: '#1e88e5' }}>
                💡
              </div>
              <div>
                <div className="gi-title">Bright & Natural</div>
                <div className="gi-desc">
                  Choose daylight or soft light. No harsh shadows, no flash,
                  just happy vibes!
                </div>
              </div>
            </div>

            <div
              className="guideline-card fade-up"
              style={{ animationDelay: '0.32s' }}
            >
              <div className="gi-icon bounce-in" style={{ color: '#ffd600' }}>
                🖼️
              </div>
              <div>
                <div className="gi-title">Simple Scene</div>
                <div className="gi-desc">
                  Backgrounds should be plain and uncluttered; avoid other pets
                  or people in frame.
                </div>
              </div>
            </div>

            <div
              className="guideline-card fade-up"
              style={{ animationDelay: '0.44s' }}
            >
              <div className="gi-icon bounce-in" style={{ color: '#d81b60' }}>
                📏
              </div>
              <div>
                <div className="gi-title">Full Body Shine</div>
                <div className="gi-desc">
                  Stand back to show all of your dog: head to tail, side or
                  front pose is great!
                </div>
              </div>
            </div>

            <div
              className="guideline-card fade-up"
              style={{ animationDelay: '0.56s' }}
            >
              <div className="gi-icon bounce-in" style={{ color: '#00838f' }}>
                💎
              </div>
              <div>
                <div className="gi-title">High Quality</div>
                <div className="gi-desc">
                  Crisp, hi-res images (≥1024px) work best. No blurry, tiny, or
                  cropped shots.
                </div>
              </div>
            </div>
          </div>

          
        </div>
      </div>
     

      {/* Privacy Section */}
      <div className={`py-24 px-8 backdrop-blur-2xl relative z-10 border-t-2 border-b-2 bg-gray-900 bg-opacity-30 border-gray-700 border-opacity-20`}>
        <Floating3DElements />
        <div className="max-w-7xl mx-auto">
          <div
            id="privacy-header"
            ref={(el) => (observerRefs.current[11] = el)}
            className={`${
              isVisible['privacy-header'] ? 'animate-down' : ''
            } text-center mb-16 opacity-0`}
          >
            <div className="pulsing text-7xl mb-4 filter drop-shadow-2xl">
              🔒
            </div>
            <h2 className={`text-4xl sm:text-5xl md:text-6xl font-black mb-4 drop-shadow-xl ${darkTextColor}`}>
              Privacy & Security
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${darkSecondaryTextColor}`}>
              Your data security is our highest priority
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: '🔐',
                title: 'End-to-End Encryption',
                desc: 'All uploads protected with HTTPS/TLS encryption',
                color: '#667eea',
              },
              {
                icon: '🗑️',
                title: 'Instant Deletion',
                desc: 'Images permanently deleted after processing',
                color: '#764ba2',
              },
              {
                icon: '🛡️',
                title: 'No Data Storage',
                desc: 'Zero tracking, no cookies, no personal data collection',
                color: '#f093fb',
              },
              {
                icon: '⚡',
                title: 'Real-time Processing',
                desc: 'Results generated instantly without long-term storage',
                color: '#FFA500',
              },
            ].map((privacy, idx) => (
              <div
                key={idx}
                id={`privacy-${idx}`}
                ref={(el) => (observerRefs.current[idx + 12] = el)}
                className={`card-hover ${
                  isVisible[`privacy-${idx}`] ? 'animate-scale' : ''
                } backdrop-blur-2xl p-10 rounded-3xl border-2 text-center opacity-0 ${darkPrivacyCardBg}`}
                style={{
                  animationDelay: `${idx * 0.15}s`,
                }}
              >
                <div
                  className="bouncing text-6xl mb-6"
                  style={{
                    filter: `drop-shadow(0 0 15px ${privacy.color})`,
                    animationDelay: `${idx * 0.3}s`,
                  }}
                >
                  {privacy.icon}
                </div>
                <h3 className={`text-2xl font-extrabold mb-4 ${darkTextColor}`}>
                  {privacy.title}
                </h3>
                <p className={`leading-relaxed text-lg ${darkSecondaryTextColor}`}>
                  {privacy.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
            
             {/* AI Technology Section */}
      <div className="py-24 px-8 relative z-10">
         
        <div className="max-w-7xl mx-auto">
          <div
            id="tech-header"
            ref={(el) => (observerRefs.current[6] = el)}
            className={`${
              isVisible['tech-header'] ? 'animate-in' : ''
            } text-center mb-16 opacity-0`}
          >
            <div className="waving text-6xl mb-4">🧠</div>
            <h2 className={`text-4xl sm:text-5xl md:text-6xl font-black mb-4 drop-shadow-xl ${darkTextColor}`}>
              Our AI Technology
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${darkSecondaryTextColor}`}>
              State-of-the-art deep learning architecture trained on thousands
              of dog images
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: '🔬',
                title: 'Model Architecture',
                desc: 'EfficientNetV2-B2 with transfer learning and fine-tuning for optimal performance',
                features: [
                  '7.2M Parameters',
                  'Compound Scaling',
                  'Fused-MBConv',
                ],
                color: '#667eea',
              },
              {
                icon: '📊',
                title: 'Training Dataset',
                desc: '20,000+ carefully curated high-quality images across 120+ breeds',
                features: [
                  'Balanced Classes',
                  'Quality Control',
                  'Diverse Angles',
                ],
                color: '#764ba2',
              },
              {
                icon: '🎯',
                title: 'Validation',
                desc: '86% accuracy on independent test set with rigorous cross-validation',
                features: [
                  'K-Fold Validation',
                  'Test Split 20%',
                  'Confusion Matrix',
                ],
                color: '#f093fb',
              },
              {
                icon: '⚡',
                title: 'Performance',
                desc: 'Optimized for speed with less than 3 seconds processing time per image',
                features: [
                  'GPU Acceleration',
                  'Batch Processing',
                  'Edge Optimization',
                ],
                color: '#FFA500',
              },
            ].map((tech, idx) => (
              <div
                key={idx}
                id={`tech-${idx}`}
                ref={(el) => (observerRefs.current[idx + 7] = el)}
                className={`card-hover ${
                  isVisible[`tech-${idx}`] ? 'animate-rotate' : ''
                } backdrop-blur-2xl p-10 rounded-3xl border-2 opacity-0 ${darkTechCardBg}`}
                style={{
                  animationDelay: `${idx * 0.15}s`,
                }}
              >
                <div
                  className="floating text-6xl mb-6"
                  style={{
                    filter: `drop-shadow(0 0 15px ${tech.color})`,
                    animationDelay: `${idx * 0.3}s`,
                  }}
                >
                  {tech.icon}
                </div>
                <h3 className={`text-3xl font-extrabold mb-4 ${darkTextColor}`}>
                  {tech.title}
                </h3>
                <p className={`leading-relaxed mb-6 text-lg ${darkSecondaryTextColor}`}>
                  {tech.desc}
                </p>
                <div className="flex flex-col gap-3">
                  {tech.features.map((feature, fidx) => (
                    <div
                      key={fidx}
                      className={`py-3 px-4 rounded-xl text-sm flex items-center gap-3 border transition-all duration-300 hover:translate-x-2 bg-gray-700 bg-opacity-40 text-gray-200 border-gray-600 border-opacity-20 hover:bg-gray-600 hover:bg-opacity-50`}
                    >
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ background: tech.color }}
                      />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className={`py-24 px-8 backdrop-blur-3xl relative z-10 border-t-2 overflow-hidden bg-gray-900 bg-opacity-50 border-gray-700 border-opacity-30`}>
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-15 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-36 bg-gradient-to-b from-transparent via-gray-300 to-transparent`}
              style={{
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animation: `fadeInUp ${
                  Math.random() * 3 + 2
                }s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="bouncing text-8xl mb-6 filter drop-shadow-2xl">
            🚀
          </div>

          <h2 className={`text-4xl sm:text-5xl md:text-6xl font-black mb-6 drop-shadow-xl leading-tight ${darkTextColor}`}
          style={{
            textShadow: 'none'
          }}>
            Ready to Try Our{' '}
            <span className="bg-gradient-to-br from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              website
            </span>{' '}
     
          </h2>

          <p className={`text-xl mb-12 leading-relaxed max-w-3xl mx-auto ${darkSecondaryTextColor}`}
          style={{
            textShadow: 'none'
          }}>
            Discover your dog’s breed instantly with the accuracy
          </p>

          <Link
            to="/predict"
            className="card-hover elevating inline-flex items-center gap-4 bg-gradient-to-br from-yellow-400 to-orange-400 text-black py-6 px-14 rounded-full no-underline text-xl font-extrabold shadow-2xl border-0 cursor-pointer"
          >
            <span className="waving text-3xl">📸</span>
            Start Identifying Now
          </Link>

          <p className={`mt-8 text-base font-semibold text-gray-400`}>
            ✨ 100% Free • Instant Results
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;