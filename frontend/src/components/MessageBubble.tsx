import React from 'react';
import { Check, CheckCheck, ExternalLink } from 'lucide-react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isMe = message.senderId === 'me';
  
  const formatTime = (timestamp: string) => {
    return timestamp;
  };

  const renderMessageContent = () => {
    if (message.type === 'link' && message.linkPreview) {
      return (
        <div className="space-y-2">
          {message.linkPreview.description && (
            <p className={isMe ? 'text-white' : 'text-[#E9EDEF]'}>
              {message.linkPreview.description}
            </p>
          )}
          <div className={`border rounded-lg p-3 ${
            isMe ? 'border-[#005C4B] bg-[#005C4B]' : 'border-[#374248] bg-[#202C33]'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#ff5e00] text-sm font-medium">
                {message.linkPreview.url}
              </span>
              <ExternalLink className="w-4 h-4 text-[#8696A0]" />
            </div>
            {message.linkPreview.title && (
              <p className={`text-sm ${isMe ? 'text-[#D1F4CC]' : 'text-[#AEBAC1]'}`}>
                {message.linkPreview.title}
              </p>
            )}
          </div>
          <p className={`text-sm ${isMe ? 'text-[#D1F4CC]' : 'text-[#8696A0]'}`}>
            {message.content}
          </p>
        </div>
      );
    }

    return (
      <p className={isMe ? 'text-white' : 'text-[#E9EDEF]'}>
        {message.content}
      </p>
    );
  };

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        max-w-lg px-3 py-2 rounded-lg relative
        ${isMe 
          ? 'bg-[#005C4B] ml-8' 
          : 'bg-[#202C33] mr-8'
        }
      `}>
        {/* Message content */}
        <div className="pb-2">
          {renderMessageContent()}
        </div>
        
        {/* Timestamp and status */}
        <div className={`
          flex items-center justify-end space-x-1 text-xs mt-1
          ${isMe ? 'text-[#8ECBA5]' : 'text-[#8696A0]'}
        `}>
          <span>{formatTime(message.timestamp)}</span>
          {isMe && (
            <div className="ml-1">
              {message.read ? (
                <CheckCheck className="w-4 h-4 text-[#53BDEB]" />
              ) : message.delivered ? (
                <CheckCheck className="w-4 h-4" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </div>
          )}
        </div>

        {/* Speech bubble tail */}
        <div className={`
          absolute top-0 w-0 h-0 
          ${isMe 
            ? 'right-0 transform translate-x-full border-l-8 border-l-[#005C4B] border-t-8 border-t-transparent' 
            : 'left-0 transform -translate-x-full border-r-8 border-r-[#202C33] border-t-8 border-t-transparent'
          }
        `} />
      </div>
    </div>
  );
};