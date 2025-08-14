import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { Chat } from '../types';

interface ChatItemProps {
  chat: Chat;
  isSelected: boolean;
  onClick: () => void;
}

export const ChatItem: React.FC<ChatItemProps> = ({ chat, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center p-4 hover:bg-[#2A3942] cursor-pointer transition-colors
        ${isSelected ? 'bg-[#2A3942]' : ''}
      `}
    >
      {/* Avatar */}
      <div className="relative mr-3">
        <img
          src={chat.contact.avatar}
          alt={chat.contact.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        {chat.contact.isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#ff5e00] rounded-full border-2 border-[#111B21]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-white font-medium truncate pr-2">{chat.contact.name}</h3>
          <span className="text-[#AEBAC1] text-xs whitespace-nowrap">{chat.lastMessageTime}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 flex-1">
            {chat.lastMessage.startsWith('You') && (
              <CheckCheck className="w-4 h-4 text-[#53BDEB] mr-1 flex-shrink-0" />
            )}
            <p className="text-[#AEBAC1] text-sm truncate">{chat.lastMessage}</p>
          </div>
          
          {chat.unreadCount > 0 && (
            <div className="ml-2 bg-[#ff5e00] text-white text-xs rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
              {chat.unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};