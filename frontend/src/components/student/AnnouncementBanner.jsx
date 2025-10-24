import { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [slide, setSlide] = useState(false);
  const [direction, setDirection] = useState('next');

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/student-api/announcements`
        );
        setAnnouncements(response.data || []);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setDirection('next');
      setSlide(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
        setSlide(false);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, [announcements]);

  const handleDotClick = (index) => {
    if (index === currentIndex) return;
    setDirection(index > currentIndex ? 'next' : 'prev');
    setSlide(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setSlide(false);
    }, 400);
  };

  const handleDismiss = () => setDismissed(true);

  if (loading || dismissed || announcements.length === 0) return null;

  const current = announcements[currentIndex];

  return (
    <div
      style={{
        position: 'relative',
        margin: '1rem auto',
        padding: '0.85rem 1.25rem 1.4rem',
        maxWidth: '650px',
        background: '#0a1f4f', // Dark Blue solid background
        borderRadius: '14px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Main content */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.9rem',
          flex: 1,
          transform: slide
            ? direction === 'next'
              ? 'translateX(-25px)'
              : 'translateX(25px)'
            : 'translateX(0)',
          opacity: slide ? 0 : 1,
          transition: 'transform 0.45s ease, opacity 0.45s ease',
        }}
      >
        {/* 🔊 Animated Glowing Megaphone */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(0,150,255,0.2)',
              transform: 'translate(-50%, -50%)',
              animation: 'wave 1.8s ease-out infinite',
            }}
          ></div>
          <Megaphone
            size={24}
            className="mt-1"
            style={{
              color: '#4dabf7',
              zIndex: 2,
              filter: 'drop-shadow(0 0 6px rgba(0,150,255,0.8))',
              animation: 'glow 1.6s ease-in-out infinite',
            }}
          />
        </div>

        {/* Text */}
        <div style={{ flex: 1 }}>
          <h6
            className="mb-1 fw-semibold"
            style={{
              color: '#e0f0ff',
              fontSize: '1rem',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            {current.title}
          </h6>
          <p
            className="mb-0 small"
            style={{
              color: 'rgba(224,240,255,0.85)',
              lineHeight: 1.45,
              fontSize: '0.9rem',
            }}
          >
            {current.description}
          </p>
        </div>
      </div>

      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(224,240,255,0.7)',
          padding: 0,
          marginLeft: '0.5rem',
          cursor: 'pointer',
        }}
      >
        <X size={18} />
      </button>

      {/* Dots Indicator */}
      {announcements.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px',
          }}
        >
          {announcements.map((_, index) => (
            <div
              key={index}
              onClick={() => handleDotClick(index)}
              style={{
                width: currentIndex === index ? '10px' : '8px',
                height: currentIndex === index ? '10px' : '8px',
                borderRadius: '50%',
                backgroundColor:
                  currentIndex === index ? '#4dabf7' : 'rgba(255,255,255,0.3)',
                boxShadow:
                  currentIndex === index
                    ? '0 0 8px rgba(0,150,255,0.7)'
                    : 'none',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
            ></div>
          ))}
        </div>
      )}

      {/* Keyframes for Glow & Waves */}
      <style>
        {`
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(0,150,255,0.8)); }
          50% { filter: drop-shadow(0 0 10px rgba(0,150,255,1)); }
        }

        @keyframes wave {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.6;
          }
          70% {
            transform: translate(-50%, -50%) scale(1.6);
            opacity: 0.2;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.8);
            opacity: 0;
          }
        }
        `}
      </style>
    </div>
  );
};

export default AnnouncementBanner;
