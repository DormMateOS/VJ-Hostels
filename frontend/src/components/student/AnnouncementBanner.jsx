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
  const [direction, setDirection] = useState('next'); // 'next' or 'prev'

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

  const handleNext = () => {
    setDirection('next');
    setSlide(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
      setSlide(false);
    }, 300);
  };

  const handlePrev = () => {
    setDirection('prev');
    setSlide(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
      setSlide(false);
    }, 300);
  };

  const handleDismiss = () => setDismissed(true);

  if (loading || dismissed || announcements.length === 0) return null;

  const current = announcements[currentIndex];

  // Inline styles for sliding effect
  const slideStyle = {
    transition: 'transform 0.3s ease, opacity 0.3s ease',
    transform: slide ? (direction === 'next' ? 'translateX(100%)' : 'translateX(-100%)') : 'translateX(0)',
    opacity: slide ? 0 : 1,
    borderRadius: '8px',
  };

  const contentStyle = {
    padding: '0.5rem 1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: '6px',
  };

  const buttonStyle = {
    minWidth: '32px',
    minHeight: '32px',
    borderRadius: '50%',
    fontWeight: 'bold',
    fontSize: '1rem',
    padding: 0,
    lineHeight: 1,
  };

  return (
    <div className="position-relative mx-3 mt-3">
      <div
        className="alert alert-primary d-flex align-items-start mb-0 shadow-sm"
        style={slideStyle}
      >
        {/* Icon */}
        <Megaphone size={20} className="text-primary me-3 mt-1 flex-shrink-0" />

        {/* Announcement Content */}
        <div className="flex-grow-1" style={contentStyle}>
          <h6 className="mb-1 fw-semibold text-dark">{current.title}</h6>
          <p className="mb-0 text-muted small">{current.description}</p>
        </div>

        {/* Dismiss */}
        <button
          className="btn btn-sm btn-link text-muted ms-2 p-0"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>
      </div>

      {/* Slide Controls */}
      {announcements.length > 1 && (
        <div className="position-absolute top-50 start-0 translate-middle-y w-100 d-flex justify-content-between px-2">
          <button
            className="btn btn-light border shadow-sm"
            onClick={handlePrev}
            style={buttonStyle}
            aria-label="Previous"
          >
            &lt;
          </button>
          <button
            className="btn btn-light border shadow-sm"
            onClick={handleNext}
            style={buttonStyle}
            aria-label="Next"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
};

export default AnnouncementBanner;