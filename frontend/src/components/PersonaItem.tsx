import React from "react";
import { Persona } from "../types";
import { getLastMessage } from "../services/localStorageService";

interface PersonaItemProps {
    persona: Persona;
    isSelected: boolean;
    onClick: () => void;
}

export const PersonaItem: React.FC<PersonaItemProps> = ({
    persona,
    isSelected,
    onClick,
}) => {
    // Get last message for preview
    const lastMessage = getLastMessage(persona.id);
    const lastMessageText = lastMessage
        ? lastMessage.content.length > 50
            ? `${lastMessage.content.substring(0, 50)}...`
            : lastMessage.content
        : "Start a conversation...";

    const lastMessageTime = lastMessage
        ? new Date(lastMessage.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
          })
        : "";

    return (
        <div
            onClick={onClick}
            className={`
                flex items-center p-3 hover:bg-[#2A3942] cursor-pointer transition-colors
                ${isSelected ? "bg-[#2A3942]" : ""}
            `}
        >
            {/* Avatar */}
            <div className="relative mr-3">
                <img
                    src={persona.profileImage}
                    alt={persona.name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                        // Fallback to a default avatar if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            persona.name
                        )}&background=ff5e00&color=fff&size=48`;
                    }}
                />
                {/* Online status indicator */}
                {persona.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#111B21]"></div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-medium truncate">
                        {persona.name}
                    </h3>
                    {lastMessageTime && (
                        <span className="text-[#8696A0] text-xs ml-2 flex-shrink-0">
                            {lastMessageTime}
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <p className="text-[#8696A0] text-sm truncate">
                        {lastMessageText}
                    </p>
                </div>
            </div>
        </div>
    );
};
