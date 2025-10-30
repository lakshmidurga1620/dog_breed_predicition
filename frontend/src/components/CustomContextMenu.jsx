// CustomContextMenu.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const CustomContextMenu = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [animation, setAnimation] = useState('');
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const menuItems = [
    { 
      icon: '🏠', 
      label: 'Home', 
      action: () => navigate('/'),
      shortcut: 'H'
    },
    { 
      icon: '🔮', 
      label: 'Predict', 
      action: () => navigate('/predict'),
      shortcut: 'P'
    },
    { 
      icon: 'ℹ️', 
      label: 'About', 
      action: () => navigate('/about'),
      shortcut: 'A'
    },
    { type: 'divider' },
    { 
      icon: '🔄', 
      label: 'Reload Page', 
      action: () => window.location.reload(),
      shortcut: 'R'
    },
    { 
      icon: '🔙', 
      label: 'Go Back', 
      action: () => window.history.back(),
      shortcut: 'B'
    },
    { type: 'divider' },
    { 
      icon: '📋', 
      label: 'Copy URL', 
      action: () => {
        navigator.clipboard.writeText(window.location.href);
      },
      shortcut: 'C'
    },
    { 
      icon: '🔗', 
      label: 'Share', 
      action: () => {
        if (navigator.share) {
          navigator.share({
            title: 'PawPredict',
            url: window.location.href
          });
        }
      },
      shortcut: 'S'
    },
    
  ];

  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      
      const menuWidth = 250;
      const menuHeight = 450; // Approximate menu height
      
      // Smart horizontal positioning
      let x = e.clientX;
      if (x + menuWidth > window.innerWidth) {
        x = window.innerWidth - menuWidth - 10;
      }
      
      // Smart vertical positioning - flip if not enough space below
      let y = e.clientY;
      const spaceBelow = window.innerHeight - e.clientY;
      const spaceAbove = e.clientY;
      
      if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        // Show above cursor if more space above
        y = Math.max(10, e.clientY - menuHeight);
      } else {
        // Show below cursor
        y = Math.min(e.clientY, window.innerHeight - menuHeight - 10);
      }
      
      setPosition({ x, y });
      setAnimation('enter');
      setIsVisible(true);
    };

    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        closeMenu();
      }
    };

    const handleScroll = () => {
      if (isVisible) closeMenu();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isVisible) {
        closeMenu();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible]);

  const closeMenu = () => {
    setAnimation('exit');
    setTimeout(() => {
      setIsVisible(false);
    }, 200);
  };

  const handleItemClick = (action) => {
    if (action) {
      action();
    }
    closeMenu();
  };

  if (!isVisible) return null;

  return (
    <>
      <div
        ref={menuRef}
        className={`custom-context-menu ${animation}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <div className="menu-header">
          <span className="menu-title">🐾 PawPredict Menu</span>
        </div>
        
        {menuItems.map((item, index) => {
          if (item.type === 'divider') {
            return <div key={index} className="menu-divider" />;
          }
          
          return (
            <button
              key={index}
              className="menu-item"
              onClick={() => handleItemClick(item.action)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
              {item.shortcut && (
                <span className="menu-shortcut">{item.shortcut}</span>
              )}
            </button>
          );
        })}
      </div>

      <style>{`
        .custom-context-menu {
          position: fixed;
          z-index: 10000;
          background: rgba(30, 30, 40, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 8px;
          min-width: 240px;
          max-height: 90vh;
          overflow-y: auto;
          overflow-x: hidden;
          box-shadow: 
            0 10px 40px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.05);
          transform-origin: top left;
        }

        .custom-context-menu::-webkit-scrollbar {
          width: 6px;
        }

        .custom-context-menu::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .custom-context-menu::-webkit-scrollbar-thumb {
          background: rgba(147, 51, 234, 0.5);
          border-radius: 10px;
        }

        .custom-context-menu::-webkit-scrollbar-thumb:hover {
          background: rgba(147, 51, 234, 0.7);
        }

        .custom-context-menu.enter {
          animation: menuEnter 0.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .custom-context-menu.exit {
          animation: menuExit 0.2s cubic-bezier(0.55, 0, 1, 0.45) forwards;
        }

        @keyframes menuEnter {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes menuExit {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.95) translateY(-5px);
          }
        }

        .menu-header {
          padding: 12px 12px 8px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 8px;
        }

        .menu-title {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          letter-spacing: 0.5px;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .menu-item::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1));
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .menu-item:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateX(4px);
        }

        .menu-item:hover::before {
          opacity: 1;
        }

        .menu-item:active {
          transform: translateX(4px) scale(0.98);
        }

        .menu-icon {
          font-size: 18px;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }

        .menu-label {
          flex: 1;
          text-align: left;
          font-weight: 500;
          position: relative;
          z-index: 1;
        }

        .menu-shortcut {
          font-size: 11px;
          padding: 2px 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 600;
          position: relative;
          z-index: 1;
        }

        .menu-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 8px 0;
        }

        @media (max-width: 768px) {
          .custom-context-menu {
            min-width: 200px;
          }
          
          .menu-item {
            padding: 12px 10px;
          }
          
          .menu-shortcut {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

export default CustomContextMenu;