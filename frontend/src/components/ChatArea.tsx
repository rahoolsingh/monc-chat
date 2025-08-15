import React, { useState, useRef, useEffect } from "react";
import { Sticker, Coffee, AlertCircle, Trash } from "lucide-react";
import { Persona, ChatMessage } from "../types";
import { ChatMessageBubble } from "./ChatMessageBubble";
import {
    getChatHistory,
    addMessage,
    clearChatHistory,
} from "../services/localStorageService";
import { sendMessageSimple } from "../services/simpleChatService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";

interface ChatAreaProps {
    persona: Persona | null;
    personaId: string | null;
    onToggleSidebar: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
    persona,
    personaId,
    onToggleSidebar,
}) => {
    const [messageInput, setMessageInput] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentAIMessage, setCurrentAIMessage] = useState<string>("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load chat history when persona changes
    useEffect(() => {
        if (personaId) {
            const history = getChatHistory(personaId);
            setMessages(history);
        } else {
            setMessages([]);
        }
    }, [personaId]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (!persona && !personaId) {
        return (
            <div className="flex-1 bg-[#0B141A] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-24 h-24 flex items-center justify-center mx-auto">
                        <Sticker className="w-12 h-12 text-[#AEBAC1]" />
                    </div>
                    <h2 className="text-2xl font-light text-[#E9EDEF] mb-2">
                        Monc Chat
                    </h2>
                    <p className="text-[#8696A0] max-w-md">
                        Chat with AI personas based on your favorite influencers
                        and creators!
                        <br />
                        Select a persona from the sidebar to start chatting.
                    </p>
                    <p className="text-xs text-[#8696A0] mt-4">
                        <a
                            href="https://payments.cashfree.com/forms/veer"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#AEBAC1] hover:underline"
                        >
                            Don't forget to buy me a{" "}
                            <Coffee className="inline w-4 h-4" /> if you enjoy
                            the experience!
                        </a>
                    </p>
                </div>
            </div>
        );
    }

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !personaId || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            personaId,
            content: messageInput.trim(),
            timestamp: new Date().toISOString(),
            sender: "user",
        };

        // Add user message immediately
        setMessages((prev) => [...prev, userMessage]);
        addMessage(personaId, userMessage);
        setMessageInput("");
        setIsLoading(true);
        setError(null);
        setCurrentAIMessage("");

        try {
            // Use simple chat service to get response parts
            const aiResponseParts = await sendMessageSimple(
                personaId,
                userMessage.content,
                messages
            );

            // Create separate messages for each response part
            const aiMessages: ChatMessage[] = aiResponseParts.map(
                (part, index) => ({
                    id: `${Date.now() + index + 1}`,
                    personaId,
                    content: part,
                    timestamp: new Date(Date.now() + index * 100).toISOString(), // Slight delay between parts
                    sender: "assistant" as const,
                })
            );

            // Add each AI response part as a separate message with a small delay
            for (let i = 0; i < aiMessages.length; i++) {
                const aiMessage = aiMessages[i];

                // Add delay between messages for natural conversation flow
                if (i > 0) {
                    await new Promise((resolve) =>
                        setTimeout(resolve, 800 + Math.random() * 400)
                    ); // 800-1200ms delay
                }

                setMessages((prev) => [...prev, aiMessage]);
                addMessage(personaId, aiMessage);
            }

            setIsLoading(false);
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to send message";
            setError(`Send Error: ${errorMessage}`);
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
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
                            <svg
                                className="w-6 h-6 text-[#AEBAC1]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        </button>

                        {persona ? (
                            <>
                                <img
                                    src={persona.profileImage}
                                    alt={persona.name}
                                    className="w-10 h-10 rounded-full object-cover mr-3"
                                    onError={(e) => {
                                        const target =
                                            e.target as HTMLImageElement;
                                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                            persona.name
                                        )}&background=ff5e00&color=fff&size=40`;
                                    }}
                                />
                                <div>
                                    <h3 className="text-white font-medium">
                                        {persona.name}
                                    </h3>
                                    <p className="text-[#AEBAC1] text-sm">
                                        {persona.isOnline
                                            ? "Online"
                                            : "Offline"}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-[#374248] rounded-full mr-3 flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5 text-[#8696A0]" />
                                </div>
                                <div>
                                    <h3 className="text-white font-medium">
                                        Loading...
                                    </h3>
                                    <p className="text-[#AEBAC1] text-sm">
                                        Fetching persona details
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        {/* clear history button  */}

                        <button
                            onClick={() => {
                                if (!personaId) return;
                                clearChatHistory(personaId);
                                setMessages([]);
                            }}
                            className="p-2 hover:bg-[#374248] rounded-full transition-colors"
                        >
                            <Trash className="w-5 h-5 text-[#AEBAC1]" />
                        </button>

                        {/* <button className="p-2 hover:bg-[#374248] rounded-full transition-colors">
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
                        </button> */}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJ3aGF0c2FwcC1iZyIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj4KICAgICAgPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzFBMjAyNyIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+CiAgICA8L3BhdHRlcm4+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjd2hhdHNhcHAtYmcpIi8+Cjwvc3ZnPgo=')] bg-repeat">
                <div className="max-w-4xl mx-auto space-y-2">
                    {messages.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-[#8696A0] text-sm">
                                {persona
                                    ? `Start a conversation with ${persona.name}!`
                                    : "No messages yet"}
                            </p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <ChatMessageBubble
                                key={message.id}
                                message={message}
                            />
                        ))
                    )}

                    {/* Error display */}
                    {error && (
                        <div className="flex items-center justify-center p-4">
                            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 max-w-md">
                                <div className="flex items-center text-red-400 mb-1">
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    <span className="text-sm font-medium">
                                        Error
                                    </span>
                                </div>
                                <p className="text-red-300 text-sm">{error}</p>
                                <button
                                    onClick={() => setError(null)}
                                    className="text-red-400 hover:text-red-300 text-xs mt-2 underline"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Typing indicator */}
                    {isLoading && (
                        <div className="flex items-center space-x-2 p-3">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-[#8696A0] rounded-full animate-bounce"></div>
                                <div
                                    className="w-2 h-2 bg-[#8696A0] rounded-full animate-bounce"
                                    style={{ animationDelay: "0.1s" }}
                                ></div>
                                <div
                                    className="w-2 h-2 bg-[#8696A0] rounded-full animate-bounce"
                                    style={{ animationDelay: "0.2s" }}
                                ></div>
                            </div>
                            <span className="text-[#8696A0] text-sm">
                                {persona?.name || "AI"} is typing...
                            </span>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input area */}
            <div className="bg-[#202C33] p-4">
                <div className="flex items-end space-x-3 max-w-4xl mx-auto">
                    {/* <button className="p-2 hover:bg-[#374248] rounded-full transition-colors">
                        <Smile className="w-6 h-6 text-[#AEBAC1]" />
                    </button>
                    <button className="p-2 hover:bg-[#374248] rounded-full transition-colors">
                        <Paperclip className="w-6 h-6 text-[#AEBAC1]" />
                    </button> */}

                    <div className="flex-1 bg-[#2A3942] rounded-full px-4 py-2">
                        <input
                            type="text"
                            placeholder={
                                persona
                                    ? `Message ${persona.name}...`
                                    : "Type a message"
                            }
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading || !persona}
                            className="w-full bg-transparent text-white outline-none placeholder-[#8696A0] disabled:opacity-50"
                        />
                    </div>

                    {messageInput.trim() && !isLoading ? (
                        <button
                            onClick={handleSendMessage}
                            disabled={!persona}
                            className="p-2 rounded-full transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                            <FontAwesomeIcon
                                icon={faPaperPlane}
                                className="w-6 h-6 text-[#8696A0] hover:text-[#ff5e00] rotate-45"
                            />
                        </button>
                    ) : (
                        <div className="p-2">
                            {/* Empty space to maintain layout */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
