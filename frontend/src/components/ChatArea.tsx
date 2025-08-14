import React, { useState, useRef, useEffect } from 'react';
import { Search, MoreVertical, Phone, Video, Smile, Paperclip, Send, Mic } from 'lucide-react';
import { Chat, Message } from '../types';
import { MessageBubble } from './MessageBubble';

interface ChatAreaProps {
  chat: Chat | null;
  onToggleSidebar: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ chat, onToggleSidebar }) => {
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  if (!chat) {
    return (
      <div className="flex-1 bg-[#0B141A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-[#202C33] rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-12 h-12 text-[#AEBAC1]" />
          </div>
          <h2 className="text-2xl font-light text-[#E9EDEF] mb-2">WhatsApp Web</h2>
          <p className="text-[#8696A0] max-w-md">
            Send and receive messages without keeping your phone online.<br />
            Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
          </p>
        </div>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // In a real app, this would send the message
      console.log('Sending message:', messageInput);
      setMessageInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0B141A]">
      {/* Header */}
      <div className="bg-[#202C33] px-4 py-3 border-b border-[#2A3942]">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 hover:bg-[#374248] rounded-full transition-colors mr-2"
            >
              <svg className="w-6 h-6 text-[#AEBAC1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <img
              src={chat.contact.avatar}
              alt={chat.contact.name}
              className="w-10 h-10 rounded-full object-cover mr-3"
            />
            <div>
              <h3 className="text-white font-medium">{chat.contact.name}</h3>
              <p className="text-[#AEBAC1] text-sm">{chat.contact.lastSeen}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-[#374248] rounded-full transition-colors">
              <Video className="w-5 h-5 text-[#AEBAC1]" />
            </button>
            <button className="p-2 hover:bg-[#374248] rounded-full transition-colors">
              <Phone className="w-5 h-5 text-[#AEBAC1]" />
            </button>
            <button className="p-2 hover:bg-[#374248] rounded-full transition-colors">
              <Search className="w-5 h-5 text-[#AEBAC1]" />
            </button>
            <button className="p-2 hover:bg-[#374248] rounded-full transition-colors">
              <MoreVertical className="w-5 h-5 text-[#AEBAC1]" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJ3aGF0c2FwcC1iZyIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj4KICAgICAgPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzFBMjAyNyIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+CiAgICA8L3BhdHRlcm4+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjd2hhdHNhcHAtYmcpIi8+Cjwvc3ZnPgo=')] bg-repeat">
        <div className="max-w-4xl mx-auto space-y-2">
          {chat.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="bg-[#202C33] p-4">
        <div className="flex items-end space-x-3 max-w-4xl mx-auto">
          <button className="p-2 hover:bg-[#374248] rounded-full transition-colors">
            <Smile className="w-6 h-6 text-[#AEBAC1]" />
          </button>
          <button className="p-2 hover:bg-[#374248] rounded-full transition-colors">
            <Paperclip className="w-6 h-6 text-[#AEBAC1]" />
          </button>
          
          <div className="flex-1 bg-[#2A3942] rounded-lg px-4 py-2">
            <input
              type="text"
              placeholder="Type a message"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full bg-transparent text-white outline-none placeholder-[#8696A0]"
            />
          </div>
          
          {messageInput.trim() ? (
            <button
              onClick={handleSendMessage}
              className="p-2 bg-[#ff5e00] hover:bg-[#00916A] rounded-full transition-colors"
            >
              <Send className="w-6 h-6 text-white" />
            </button>
          ) : (
            <button className="p-2 hover:bg-[#374248] rounded-full transition-colors">
              <Mic className="w-6 h-6 text-[#AEBAC1]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};