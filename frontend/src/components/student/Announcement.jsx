import { useState } from 'react';
import { Megaphone, CalendarDays, ArrowRight } from 'lucide-react';
import TodayAnnouncements from './TodayAnnouncements';
import AllAnnouncements from './AllAnnouncements';

const Announcement = () => {
    const [activeTab, setActiveTab] = useState('today'); // Default to today's announcements

    return (
        <div className="announcement-container">
            <div className="announcement-header">
                <h2 className="announcement-title">
                    <Megaphone size={32} className="announcement-icon" />
                    <span>Announcements</span>
                </h2>
            </div>

            {/* Tab Headers */}
            <div className="announcement-tabs">
                <div
                    className={`announcement-tab ${activeTab === 'today' ? 'active' : ''}`}
                    onClick={() => setActiveTab('today')}
                >
                    <CalendarDays size={20} className="tab-icon" />
                    <span className="tab-text">Today's Announcements</span>
                </div>
                <div
                    className={`announcement-tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    <ArrowRight size={20} className="tab-icon" />
                    <span className="tab-text">All Announcements</span>
                </div>
            </div>

            {/* Content based on active tab */}
            <div className="announcement-content">
                {activeTab === 'today' ? <TodayAnnouncements /> : <AllAnnouncements />}
            </div>
        </div>
    );
};

export default Announcement;