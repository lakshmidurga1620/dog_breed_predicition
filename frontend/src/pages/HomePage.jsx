import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";


const HomePage = () => {
  const particlesRef = useRef(null);
  // Theme is permanently set to dark mode
  const isDarkMode = true; 

  useEffect(() => {
    // Removed system theme detection as it's now dark-mode exclusive

    const createParticle = () => {
      if (!particlesRef.current) return;

      const particle = document.createElement("div");
      // Only using the dark mode particle class
      particle.className = `absolute rounded-full pointer-events-none bg-purple-300/20 animate-dogAiParticleFloat`;
      
      const size = Math.random() * 60 + 20;
      particle.style.width = size + "px";
      particle.style.height = size + "px";
      particle.style.left = Math.random() * -100 + "px";
      particle.style.top = Math.random() * window.innerHeight + "px";

      particlesRef.current.appendChild(particle);

      setTimeout(() => {
        particle.remove();
      }, 20000);
    };

    const interval = setInterval(createParticle, 500);
    for (let i = 0; i < 10; i++) {
      setTimeout(createParticle, i * 200);
    }

    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const hero = document.querySelector(".hero");
      if (hero) {
        // Applying parallax effect
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
      }
    };

    window.addEventListener("scroll", handleScroll);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("scroll", handleScroll);
      // Removed media query listener cleanup
    };
  }, []); // isDarkMode is no longer a dependency

  return (
    // Only using the dark mode background gradient
    <div className={`font-sans overflow-x-hidden min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black`}>
      <section className="hero relative flex items-center min-h-screen px-10 py-20 overflow-hidden">
        {/* particles */}
        <div ref={particlesRef} className="absolute inset-0 z-0"></div>

        <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 gap-16 items-center relative z-10">
          {/* left content */}
          <div>
            {/* Dark mode styling applied directly */}
            <div className={`inline-flex items-center gap-2 backdrop-blur-md px-6 py-3 rounded-full border-2 mb-8 animate-dogAiBadgePulse bg-gray-800/60 border-gray-600/40`}>
              <span className="animate-dogAiBadgeIconRotate">🧠</span>
              {/* Dark mode text color applied directly */}
              <span className={`uppercase text-sm tracking-widest font-bold text-gray-200`}>
                Mind in Motion
              </span>
            </div>

            {/* Dark mode text color applied directly */}
            <h1 className={`font-extrabold text-5xl leading-tight mb-6 animate-dogAiHeroTitle text-gray-100`}>
              Identify Your Dog's Breed
              <br />
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 bg-clip-text text-transparent inline-block animate-dogAiGradientShift">
                Instantly
              </span>
            </h1>

            {/* Dark mode text color applied directly */}
            <p className={`text-lg mb-10 animate-dogAiFadeInUp leading-relaxed text-gray-300`}>
Upload a photo of your dog and get instant, accurate breed identification powered by advanced AI technology.
Discover detailed breed characteristics, temperament insights, and personalized care tips — all crafted to help you understand your furry friend better.
            </p>

            <div className="flex flex-wrap gap-4 animate-dogAiFadeInUp">
              <Link
                to="/predict"
                className="px-8 py-4 rounded-full font-bold text-lg bg-gradient-to-r from-yellow-400 to-orange-400 text-black shadow-xl hover:scale-105 transition"
              >
                📷 Start Identifying
              </Link>
              <Link
                to="/about"
                // Dark mode styling applied directly
                className={`px-8 py-4 rounded-full font-bold text-lg border-2 backdrop-blur hover:scale-105 transition border-gray-500/50 text-gray-200 bg-gray-800/30 hover:bg-gray-700/40`}
              >
                📖 Learn More
              </Link>
            </div>
          </div>

          {/* right floating cards */}
          <div className="relative h-[500px] animate-dogAiFadeInRight">
            {/* Dark mode styling applied directly */}
            <div className={`absolute top-[10%] left-[5%] animate-dogAiFloatCard1 backdrop-blur-lg p-6 rounded-2xl shadow-xl border text-center font-bold bg-gray-800/80 border-gray-600/30 text-gray-200`}>
              <div className="text-6xl animate-dogAiEmojiPulse">🐕‍🦺</div>
              German Shepherd
            </div>
            {/* Dark mode styling applied directly */}
            <div className={`absolute top-[45%] right-[10%] animate-dogAiFloatCard2 backdrop-blur-lg p-6 rounded-2xl shadow-xl border text-center font-bold bg-gray-800/80 border-gray-600/30 text-gray-200`}>
              <div className="text-6xl animate-dogAiEmojiPulse">🐕</div>
              Golden Retriever
            </div>
            {/* Dark mode styling applied directly */}
            <div className={`absolute bottom-[10%] left-[30%] animate-dogAiFloatCard3 backdrop-blur-lg p-6 rounded-2xl shadow-xl border text-center font-bold bg-gray-800/80 border-gray-600/30 text-gray-200`}>
              <div className="text-6xl animate-dogAiEmojiPulse">🐶</div>
              French Bulldog
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      {/* Only using the dark mode background color */}
      <section className={`relative py-20 px-10 bg-gray-900`}>
        <div className="max-w-[1400px] mx-auto relative z-10">
          {/* Heading - Only using the dark mode gradient */}
          <h2 className={`text-4xl font-extrabold text-center mb-16 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent`}>
                Why Choose Us?
          </h2>

          {/* Cards Grid */}
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            
            {/* Card 1 */}
            {/* Dark mode styling applied directly */}
            <div className={`p-8 rounded-2xl shadow-xl text-center hover:scale-105 transition bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/30`}>
              <div className="text-5xl mb-4 animate-dogAiEmojiPulse">🧠</div>
              {/* Dark mode text color applied directly */}
              <h3 className={`text-xl font-bold mb-2 text-gray-100`}>
                Advanced AI Model
              </h3>
              {/* Dark mode text color applied directly */}
              <p className={'text-gray-300'}>
                Uses EfficientNetV2-B2 architecture trained on thousands of dog
                images for accurate breed identification.
              </p>
            </div>

            {/* Card 2 */}
            {/* Dark mode styling applied directly */}
            <div className={`p-8 rounded-2xl shadow-xl text-center hover:scale-105 transition bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/30`}>
              <div className="text-5xl mb-4 animate-dogAiEmojiPulse">⚡</div>
              {/* Dark mode text color applied directly */}
              <h3 className={`text-xl font-bold mb-2 text-gray-100`}>
                Instant Results
              </h3>
              {/* Dark mode text color applied directly */}
              <p className={'text-gray-300'}>
                Get breed predictions in seconds with confidence scores and
                detailed breed information.
              </p>
            </div>

            {/* Card 3 */}
            {/* Dark mode styling applied directly */}
            <div className={`p-8 rounded-2xl shadow-xl text-center hover:scale-105 transition bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/30`}>
              <div className="text-5xl mb-4 animate-dogAiEmojiPulse">📚</div>
              {/* Dark mode text color applied directly */}
              <h3 className={`text-xl font-bold mb-2 text-gray-100`}>
                Breed Details
              </h3>
              {/* Dark mode text color applied directly */}
              <p className={'text-gray-300'}>
                Learn about your dog's characteristics, temperament, size,
                energy level, and care requirements.
              </p>
            </div>

            {/* Card 4 */}
            {/* Dark mode styling applied directly */}
            <div className={`p-8 rounded-2xl shadow-xl text-center hover:scale-105 transition bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/30`}>
              <div className="text-5xl mb-4 animate-dogAiEmojiPulse">📱</div>
              {/* Dark mode text color applied directly */}
              <h3 className={`text-xl font-bold mb-2 text-gray-100`}>
                Mobile Friendly
              </h3>
              {/* Dark mode text color applied directly */}
              <p className={'text-gray-300'}>
                Works perfectly on all devices - desktop, tablet, and mobile
                with responsive design.
              </p>
            </div>

          </div>
        </div>
      </section>
        
      {/* Stats */}
      {/* Only using the dark mode background gradient */}
      <section className={`py-20 px-10 bg-gradient-to-br from-gray-800 via-slate-800 to-gray-900`}>
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-4 gap-10 text-center text-white">
          <div className="cursor-pointer hover:scale-110 transition">
            <div className="text-5xl font-extrabold mb-2 animate-dogAiStatPulse">
              120+
            </div>
            <div className="uppercase tracking-wide font-semibold">
              Dog Breeds
            </div>
          </div>
          <div className="cursor-pointer hover:scale-110 transition">
            <div className="text-5xl font-extrabold mb-2 animate-dogAiStatPulse">
              86%
            </div>
            <div className="uppercase tracking-wide font-semibold">
              Accuracy Rate
            </div>
          </div>
          <div className="cursor-pointer hover:scale-110 transition">
            <div className="text-5xl font-extrabold mb-2 animate-dogAiStatPulse">
              20K+
            </div>
            <div className="uppercase tracking-wide font-semibold">
              Photos Analyzed
            </div>
          </div>
          <div className="cursor-pointer hover:scale-110 transition">
            <div className="text-5xl font-extrabold mb-2 animate-dogAiStatPulse">
              &lt;3s
            </div>
            <div className="uppercase tracking-wide font-semibold">
              Processing Time
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;