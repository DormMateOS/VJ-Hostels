import { useState } from 'react';
import { Megaphone, CalendarDays, ArrowRight } from 'lucide-react';
// import TodayAnnouncements from './TodayAnnouncements';
// import AllAnnouncements from './AllAnnouncements';
import Outpass from './Outpass';
import OutpassList from './OutpassList';

const OutpassPage = () => {
    const [activeTab, setActiveTab] = useState('outpass'); // Default to outpass application

    return (
        <div className="outpass-container">
            <div className="outpass-header">
                <h2 className="outpass-title">
                    <Megaphone size={32} />
                    <span>OUTPASS SECTION</span>
                </h2>
            </div>

            {/* Tab Headers */}
            <div className="outpass-tabs">
                <div
                    className={`outpass-tab ${activeTab === 'outpass' ? 'active' : ''}`}
                    onClick={() => setActiveTab('outpass')}
                >
                    <CalendarDays size={20} />
                    <span>Apply For OutPass</span>
                </div>
                <div
                    className={`outpass-tab ${activeTab === 'outpassList' ? 'active' : ''}`}
                    onClick={() => setActiveTab('outpassList')}
                >
                    <ArrowRight size={20} />
                    <span>OutPass History</span>
                </div>
            </div>

            {/* Content based on active tab */}
            <div className="outpass-content">
                {activeTab === 'outpass' ? <Outpass/> : <OutpassList />}
            </div>
        </div>
    );
};

export default OutpassPage;