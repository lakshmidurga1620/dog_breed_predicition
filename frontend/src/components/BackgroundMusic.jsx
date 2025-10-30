import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import styles from './BackgroundMusic.module.css';

const BackgroundMusic = ({ 
  src = '/background-music.mp3', 
  volume = 10,
  autoStart = false 
}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Use useCallback to memoize handlePlay function
  const handlePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (audio) {
      try {
        if (isPlaying) {
          await audio.pause();
          setIsPlaying(false);
        } else {
          await audio.play();
          setIsPlaying(true);
          setHasStarted(true);
        }
      } catch (error) {
        console.warn('Audio playback failed:', error);
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      audio.loop = true;
      
      const handleCanPlay = () => {
        if (autoStart && !hasStarted) {
          handlePlay();
        }
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
      };

      audio.addEventListener('canplaythrough', handleCanPlay);
      audio.addEventListener('ended', handleEnded);
      
      return () => {
        audio.removeEventListener('canplaythrough', handleCanPlay);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [volume, autoStart, hasStarted, handlePlay]); // ✅ Added handlePlay to dependencies

  const handleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className={styles.musicController}>
      <audio
        ref={audioRef}
        preload="auto"
        playsInline
      >
        <source src={src} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      
      <button 
        onClick={handlePlay}
        className={styles.playButton}
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
      >
        {isPlaying ? <FaPause /> : <FaPlay />}
      </button>
      
      <button 
        onClick={handleMute}
        className={styles.muteButton}
        aria-label={isMuted ? 'Unmute music' : 'Mute music'}
      >
        {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
      </button>
    </div>
  );
};

export default BackgroundMusic;
