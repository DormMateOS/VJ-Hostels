import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const AnnouncementBanner = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [slide, setSlide] = useState(false);

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
    setSlide(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setSlide(false);
    }, 400);
  };

  const handleAnnouncementClick = () => {
    navigate('/student/announcements');
  };

  const truncateText = (text, maxLength) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
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
        width: '100%',
        maxWidth: '1400px',
        minWidth: '300px',
        height: 'auto',
        background: '#8b0000', // Dark Red solid background
        borderRadius: '14px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 6px 18px rgba(139,0,0,0.35)',
        transition: 'all 0.9s ease',
        cursor: 'pointer',
        '@media (max-width: 768px)': {
          padding: '0.75rem 1rem 1.2rem',
        },
        '@media (max-width: 480px)': {
          padding: '0.65rem 0.85rem 1rem',
        },
      }}
      onClick={handleAnnouncementClick}
      className="announcement-banner"
    >
      {/* Main content */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.9rem',
          flex: 1,
          transform: slide ? 'translateX(-25px)' : 'translateX(0)',
          opacity: slide ? 0 : 1,
          transition: 'transform 0.45s ease, opacity 0.45s ease',
        }}
      >
        {/* Text */}
        <div style={{ flex: 1 }}>
          <h6
            className="mb-1 fw-semibold"
            style={{
              color: '#ffe0e0',
              fontSize: '1rem',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            {truncateText(current.title, 35)}
          </h6>
          <p
            className="mb-0 small"
            style={{
              color: 'rgba(255,224,224,0.85)',
              lineHeight: 1.45,
              fontSize: '0.9rem',
            }}
          >
            {truncateText(current.description, 80)}
          </p>
        </div>
      </div>

      {/* Dismiss Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,224,224,0.7)',
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
              onClick={(e) => {
                e.stopPropagation();
                handleDotClick(index);
              }}
              style={{
                width: currentIndex === index ? '10px' : '8px',
                height: currentIndex === index ? '10px' : '8px',
                borderRadius: '50%',
                backgroundColor:
                  currentIndex === index ? '#ff6b6b' : 'rgba(255,255,255,0.3)',
                boxShadow:
                  currentIndex === index
                    ? '0 0 8px rgba(255,107,107,0.7)'
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
          0%, 100% { filter: drop-shadow(0 0 4px rgba(255,107,107,0.8)); }
          50% { filter: drop-shadow(0 0 10px rgba(255,107,107,1)); }
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

        @media (max-width: 768px) {
          .announcement-banner {
            width: 95% !important;
            margin: 0.75rem auto !important;
          }
        }

        @media (max-width: 480px) {
          .announcement-banner {
            width: 90% !important;
            margin: 0.5rem auto !important;
            padding: 0.65rem 0.85rem 1rem !important;
          }
          
          .announcement-banner h6 {
            font-size: 0.9rem !important;
          }
          
          .announcement-banner p {
            font-size: 0.8rem !important;
          }
        }
        `}
      </style>
    </div>
  );
};

export default AnnouncementBanner;
