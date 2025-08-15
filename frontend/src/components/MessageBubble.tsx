import React from "react";
import { Check, CheckCheck } from "lucide-react";
import { Message } from "../types";

interface MessageBubbleProps {
    message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const isMe = message.senderId === "me";

    const formatTime = (timestamp: string) => {
        return timestamp;
    };

    const renderMessageContent = () => {
        if (message.type === "link") {
            return (
                <div className="space-y-2">
                    <p
                        className={`text-sm ${
                            isMe ? "text-[#D1F4CC]" : "text-[#008cff]"
                        }`}
                    >
                        {message.content}
                    </p>
                </div>
            );
        }

        return (
            <p className={isMe ? "text-white" : "text-[#E9EDEF]"}>
                {message.content}
            </p>
        );
    };

    return (
        <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
            <div
                className={`
        max-w-lg px-3 py-2 rounded-lg relative
        ${isMe ? "bg-[#903500] ml-8" : "bg-[#202C33] mr-8"}
      `}
            >
                {/* Message content */}
                <div className="pb-2">{renderMessageContent()}</div>

                {/* Timestamp and status */}
                <div
                    className={`
          flex items-center justify-end space-x-1 text-xs mt-1
          ${isMe ? "text-[#cba38e]" : "text-[#ffd7d7]"}
        `}
                >
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
            </div>
        </div>
    );
};
