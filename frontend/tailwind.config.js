/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    
    extend: {
      // 🔥 Animations
      animation: {
        // Your Dog AI Animations
        dogAiBadgePulse: "dogAiBadgePulse 2s ease-in-out infinite",
        dogAiBadgeIconRotate: "dogAiBadgeIconRotate 3s linear infinite",
        dogAiHeroTitle: "dogAiHeroTitle 0.8s ease-out both",
        dogAiGradientShift: "dogAiGradientShift 3s ease-in-out infinite",
        dogAiFadeInUp: "dogAiFadeInUp 0.8s ease-out both",
        dogAiFadeInRight: "dogAiFadeInRight 1s ease-out both",
        dogAiFloatCard1: "dogAiFloatCard1 8s ease-in-out infinite, dogAiRotateCard 20s linear infinite",
        dogAiFloatCard2: "dogAiFloatCard2 10s ease-in-out infinite, dogAiRotateCard 25s linear infinite reverse",
        dogAiFloatCard3: "dogAiFloatCard3 9s ease-in-out infinite, dogAiRotateCard 22s linear infinite",
        dogAiEmojiPulse: "dogAiEmojiPulse 2s ease-in-out infinite",
        dogAiParticleFloat: "dogAiParticleFloat 20s linear forwards",
        dogAiStatPulse: "dogAiStatPulse 3s ease-in-out infinite",

        // Generic Animations
        'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
        'gradient-x': 'gradient-x 3s ease infinite',
        'bounce-custom': 'bounce-custom 2s infinite',
        'float-random': 'floatRandom var(--duration,20s) ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 3s ease infinite',
        'progress-bar': 'progressBar 1.5s cubic-bezier(0.4,0,0.2,1)',

        // Glow & Neon
        'glow': 'glow 2s ease-in-out infinite',
        'neon-pulse': 'neonPulse 1.5s ease-in-out infinite',

        // Morphing
        'morph-bounce': 'morphBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'blob': 'blob 7s ease-in-out infinite',

        // 3D Effects
        'flip-3d': 'flip3D 1s ease-in-out',
        'tilt-3d': 'tilt3D 2s ease-in-out infinite',

        // Interactive
        'heartbeat': 'heartbeat 1.3s ease-in-out infinite',
        'shake': 'shake 0.5s linear',
        'rubber-band': 'rubberBand 1s',

        // Loading
        'dots': 'dots 1.4s infinite ease-in-out',
        'progress': 'progress 2s ease-in-out',
        'skeleton': 'skeleton 1.2s ease-in-out infinite',

        // Text
        'typewriter': 'typewriter 3s steps(40, end)',
        'text-glow': 'textGlow 2s ease-in-out infinite',

        // Background
        'aurora': 'aurora 8s ease-in-out infinite',

        // Scroll Reveals
        'slide-in-up': 'slideInUp 0.8s ease-out',
        'slide-in-down': 'slideInDown 0.8s ease-out',
        'slide-in-left': 'slideInLeft 0.8s ease-out',
        'slide-in-right': 'slideInRight 0.8s ease-out',
        'zoom-in': 'zoomIn 0.6s ease-out',

        // Hover
        'wiggle': 'wiggle 0.15s ease-in-out infinite',
        'jiggle': 'jiggle 0.6s',

        // With delays
        'glow-delay-1': 'glow 2s ease-in-out infinite 0.5s',
        'glow-delay-2': 'glow 2s ease-in-out infinite 1s',
        'slide-in-up-delay-1': 'slideInUp 0.8s ease-out 0.2s both',
        'slide-in-up-delay-2': 'slideInUp 0.8s ease-out 0.4s both',
        'slide-in-up-delay-3': 'slideInUp 0.8s ease-out 0.6s both',
      },

      // 🔥 Keyframes
      keyframes: {
        // Dog AI Animations
        dogAiBadgePulse: {
          "0%,100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(255,255,255,0.4)" },
          "50%": { transform: "scale(1.05)", boxShadow: "0 0 20px 10px rgba(255,255,255,0)" },
        },
        dogAiBadgeIconRotate: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        dogAiHeroTitle: {
          from: { opacity: "0", transform: "translateY(30px) scale(0.9)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        dogAiGradientShift: {
          "0%,100%": { backgroundPosition: "0% 50%", transform: "scale(1)" },
          "50%": { backgroundPosition: "100% 50%", transform: "scale(1.05)" },
        },
        dogAiFadeInUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        dogAiFadeInRight: {
          from: { opacity: "0", transform: "translateX(50px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        dogAiFloatCard1: {
          "0%,100%": { transform: "translate(0,0)" },
          "25%": { transform: "translate(20px,-30px)" },
          "50%": { transform: "translate(-10px,-50px)" },
          "75%": { transform: "translate(-30px,-20px)" },
        },
        dogAiFloatCard2: {
          "0%,100%": { transform: "translate(0,0)" },
          "25%": { transform: "translate(-30px,20px)" },
          "50%": { transform: "translate(10px,40px)" },
          "75%": { transform: "translate(20px,10px)" },
        },
        dogAiFloatCard3: {
          "0%,100%": { transform: "translate(0,0)" },
          "33%": { transform: "translate(40px,-20px)" },
          "66%": { transform: "translate(-20px,-40px)" },
        },
        dogAiRotateCard: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        dogAiEmojiPulse: {
          "0%,100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.2)" },
        },
        dogAiParticleFloat: {
          "0%": { transform: "translate(0,100vh) scale(0)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translate(100vw,-100vh) scale(1)", opacity: "0" },
        },
        dogAiStatPulse: {
          "0%,100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
        },

        // ✨ Generic Keyframes (fade, glow, morph, etc.)
        'fade-in-up': { "0%": { opacity: "0", transform: "translateY(30px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        glow: { "0%,100%": { boxShadow: "0 0 5px currentColor" }, "50%": { boxShadow: "0 0 20px currentColor" } },
        neonPulse: { "0%": { boxShadow: "0 0 5px #00ffff" }, "50%": { boxShadow: "0 0 30px #00ffff" }, "100%": { boxShadow: "0 0 5px #00ffff" } },
        morphBounce: { "0%": { transform: "scale(1)" }, "50%": { transform: "scale(1.2)" }, "100%": { transform: "scale(1)" } },
        blob: { "0%": { borderRadius: "60% 40%" }, "50%": { borderRadius: "30% 70%" }, "100%": { borderRadius: "60% 40%" } },
        flip3D: { "0%": { transform: "perspective(400px) rotateY(0)" }, "100%": { transform: "perspective(400px) rotateY(360deg)" } },
        tilt3D: { "0%,100%": { transform: "rotateY(0)" }, "50%": { transform: "rotateY(15deg)" } },
        heartbeat: { "0%,100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.3)" } },
        shake: { "0%,100%": { transform: "translateX(0)" }, "50%": { transform: "translateX(-2px)" } },
        rubberBand: { "0%": { transform: "scale(1)" }, "50%": { transform: "scale(1.25,0.75)" }, "100%": { transform: "scale(1)" } },
        dots: { "0%,100%": { opacity: "0" }, "50%": { opacity: "1" } },
        progress: { "0%": { width: "0%" }, "100%": { width: "100%" } },
        skeleton: { "0%": { backgroundPosition: "-200px 0" }, "100%": { backgroundPosition: "200px 0" } },
        typewriter: { "0%": { width: "0" }, "100%": { width: "100%" } },
        textGlow: { "0%,100%": { textShadow: "0 0 5px currentColor" }, "50%": { textShadow: "0 0 20px currentColor" } },
        gradientShift: { "0%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" }, "100%": { backgroundPosition: "0% 50%" } },
        aurora: { "0%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" }, "100%": { backgroundPosition: "0% 50%" } },
        slideInUp: { "0%": { transform: "translateY(100px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        slideInDown: { "0%": { transform: "translateY(-100px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        slideInLeft: { "0%": { transform: "translateX(-100px)", opacity: "0" }, "100%": { transform: "translateX(0)", opacity: "1" } },
        slideInRight: { "0%": { transform: "translateX(100px)", opacity: "0" }, "100%": { transform: "translateX(0)", opacity: "1" } },
        zoomIn: { "0%": { transform: "scale(0.5)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        wiggle: { "0%,100%": { transform: "rotate(-3deg)" }, "50%": { transform: "rotate(3deg)" } },
        jiggle: { "0%,100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.1)" } },
        'gradient-x': { "0%,100%": { backgroundPosition: "left" }, "50%": { backgroundPosition: "right" } },
      },

      // 🎨 Extra UI settings
      backgroundImage: {
        'gradient-main': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-gold': 'linear-gradient(135deg, #FFD700, #FFA500, #FF6B6B)',
      },
      backdropBlur: { '25': '25px', '15': '15px' },
      boxShadow: {
        'button-glow': '0 15px 50px rgba(255, 215, 0, 0.5)',
        '3xl': '0 35px 60px -12px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
}
