import React, { useState } from 'react';
import { Megaphone, CalendarDays, MessageSquare, Users } from 'lucide-react';
import Chat from './Chat';
import CommunityPosts from './CommunityPosts';

function Community() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="community-page">
      <div className="responsive-container">

        {/* Tab Headers */}
        <div className="community-tabs">
          <button
            className={`tab-button ${activeTab === 'chat' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={20} className="tab-icon" />
            <span className="tab-text">Chat</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'posts' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <Users size={20} className="tab-icon" />
            <span className="tab-text">Community Posts</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="community-content">
          {activeTab === 'chat' ? <Chat /> : <CommunityPosts />}
        </div>
      </div>
    </div>
  );
}

export default Community;