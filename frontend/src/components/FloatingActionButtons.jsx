import React, { useState } from 'react';
import { MessageCircle, Syringe, MessageSquare, X, Menu } from 'lucide-react';

const FloatingActionButtons = () => {
  const [isOpen, setIsOpen] = useState(false);

  const buttons = [
    {
      to: '/feedback',
      icon: MessageSquare,
      label: 'Feedback Center',
      description: 'Share your thoughts',
      gradient: 'from-purple-500 to-pink-500',
      emoji: '💭'
    },
    {
      to: '/help',
      icon: MessageCircle,
      label: 'Help & Support',
      description: 'Get instant assistance',
      gradient: 'from-blue-500 to-cyan-500',
      emoji: '💬'
    },
    {
      to: '/vaccinations',
      icon: Syringe,
      label: 'Vaccination Tracker',
      description: 'Track pet vaccinations',
      gradient: 'from-green-500 to-emerald-500',
      emoji: '💉'
    }
  ];

  const handleNavigation = (path) => {
    setIsOpen(false);
    window.location = path;
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>

      {/* Floating Action Button Container - BOTTOM LEFT */}
      <div className="fixed bottom-6 left-6 z-[9999] flex flex-col-reverse gap-3">
        
        {/* Individual Action Buttons */}
        {isOpen && buttons.map((button, index) => {
          const Icon = button.icon;
          return (
            <button
              key={button.to}
              onClick={() => handleNavigation(button.to)}
              className="group fade-in"
              style={{ animationDelay: `${index * 30}ms` }}
              title={button.label}
            >
              {/* Button Container */}
              <div className="backdrop-blur-xl bg-slate-800/95 border border-slate-700/50 rounded-xl p-3.5 shadow-lg hover:shadow-xl hover:border-slate-600 transition-all duration-200 hover:scale-[1.02] min-w-[260px]">
                <div className="flex items-center gap-3">
                  {/* Icon Container */}
                  <div className={`flex-shrink-0 p-2.5 bg-gradient-to-br ${button.gradient} rounded-lg`}>
                    <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  
                  {/* Text Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-white font-semibold text-sm mb-0.5">
                      {button.label}
                    </div>
                    <div className="text-slate-400 text-xs">
                      {button.description}
                    </div>
                  </div>

                  {/* Emoji */}
                  <span className="text-xl flex-shrink-0">
                    {button.emoji}
                  </span>
                </div>
              </div>
            </button>
          );
        })}

        {/* Main Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative"
          aria-label={isOpen ? "Close Menu" : "Open Menu"}
        >
          {/* Glow Effect (subtle) */}
          <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
          
          {/* Button Body */}
          <div className={`relative bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center transition-all duration-200 group-hover:scale-105 border border-white/10 ${isOpen ? 'rotate-90' : ''}`}>
            {isOpen ? (
              <X className="w-6 h-6 text-white" strokeWidth={2.5} />
            ) : (
              <Menu className="w-6 h-6 text-white" strokeWidth={2.5} />
            )}
          </div>

          {/* Notification Badge */}
          {!isOpen && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-slate-900 shadow-md">
              {buttons.length}
            </div>
          )}

          {/* Tooltip - Shows on hover when closed */}
          {!isOpen && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="backdrop-blur-xl bg-slate-800/95 border border-slate-700 rounded-lg px-3 py-1.5 shadow-lg whitespace-nowrap">
                <span className="text-white text-sm font-medium">Quick Actions</span>
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Backdrop - Simple */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default FloatingActionButtons;