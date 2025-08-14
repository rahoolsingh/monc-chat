import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { chats } from './data/chats';

function App() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>('2'); // Default to SBU Rohit chat
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const selectedChat = selectedChatId ? chats.find(chat => chat.id === selectedChatId) : null;

  // Close sidebar when window resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-screen flex bg-[#111B21] overflow-hidden">
      <Sidebar
        selectedChatId={selectedChatId}
        onSelectChat={setSelectedChatId}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <ChatArea
        chat={selectedChat || null}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
    </div>
  );
}

export default App;