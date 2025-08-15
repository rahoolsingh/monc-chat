import React, { useState, useRef, useEffect } from "react";
import { Coffee, AlertCircle, Trash } from "lucide-react";
import { Persona, ChatMessage } from "../types";
import { ChatMessageBubble } from "./ChatMessageBubble";
import {
    getChatHistory,
    addMessage,
    clearChatHistory,
} from "../services/localStorageService";
import { sendMessageSimple } from "../services/simpleChatService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import logo from "../assets/logo.png";

// Message grouping utility
const combineConsecutiveMessages = (messages: ChatMessage[]): ChatMessage[] => {
    if (messages.length === 0) return [];

    const combined: ChatMessage[] = [];
    let currentMessage = { ...messages[0] };

    for (let i = 1; i < messages.length; i++) {
        const nextMessage = messages[i];

        // Check if we should combine these messages
        if (shouldCombineMessages(currentMessage, nextMessage)) {
            // Combine the content with double line breaks for better separation
            currentMessage.content += "\n\n" + nextMessage.content;
            currentMessage.timestamp = nextMessage.timestamp; // Use latest timestamp
        } else {
            // Save current message and start a new one
            combined.push(currentMessage);
            currentMessage = { ...nextMessage };
        }
    }

    // Don't forget the last message
    combined.push(currentMessage);

    return combined;
};

// Logic to determine if two messages should be combined
const shouldCombineMessages = (
    current: ChatMessage,
    next: ChatMessage
): boolean => {
    // Only combine messages from the same sender
    if (current.sender !== next.sender) return false;

    // Check time threshold (within 2 minutes)
    const currentTime = new Date(current.timestamp).getTime();
    const nextTime = new Date(next.timestamp).getTime();
    const diffInMinutes = Math.abs(nextTime - currentTime) / (1000 * 60);

    if (diffInMinutes > 2) return false;

    // Don't combine if it would create weird code block combinations
    const currentHasCode = current.content.includes("```");
    const nextHasCode = next.content.includes("```");

    // Special handling for code blocks
    if (currentHasCode || nextHasCode) {
        // If current message ends with incomplete code block (just ```language)
        const currentEndsWithCodeStart = current.content
            .trim()
            .match(/```\w*$/);
        if (currentEndsWithCodeStart && !nextHasCode) {
            return true; // Combine to complete the code block
        }

        // If next message is just closing code block
        if (next.content.trim() === "```") {
            return true; // Combine to close the code block
        }

        // If current ends with ``` and next starts with content (not code)
        if (current.content.trim().endsWith("```") && !nextHasCode) {
            return true; // Continue explanation after code
        }

        // Don't combine separate complete code blocks
        const currentHasCompleteCode = current.content.match(/```[\s\S]*?```/);
        const nextHasCompleteCode = next.content.match(/```[\s\S]*?```/);
        if (currentHasCompleteCode && nextHasCompleteCode) {
            return false;
        }
    }

    return true; // Default: combine messages
};

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
    const [, setCurrentAIMessage] = useState<string>("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when persona changes or component mounts
    useEffect(() => {
        if (persona && messageInputRef.current) {
            // Small delay to ensure component is fully rendered
            setTimeout(() => {
                messageInputRef.current?.focus();
            }, 100);
        }
    }, [persona, personaId]);

    // Global keyboard listener for auto-focus
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Don't interfere with input fields, textareas, or if modifiers are pressed
            if (
                !persona ||
                !messageInputRef.current ||
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                e.target instanceof HTMLSelectElement ||
                e.ctrlKey ||
                e.metaKey ||
                e.altKey
            ) {
                return;
            }

            // Focus input for printable characters
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                messageInputRef.current?.focus();
                // Add the typed character to input
                setMessageInput((prev) => prev + e.key);
            }

            // Handle special keys
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                messageInputRef.current?.focus();
                if (messageInput.trim()) {
                    handleSendMessage();
                }
            }
        };

        // Add event listener when persona is selected
        if (persona) {
            document.addEventListener("keydown", handleGlobalKeyDown);
        }

        return () => {
            document.removeEventListener("keydown", handleGlobalKeyDown);
        };
    }, [persona, messageInput]);

    // Maintain focus on input after sending message
    const maintainInputFocus = () => {
        setTimeout(() => {
            messageInputRef.current?.focus();
        }, 50);
    };

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

    // Focus input when clicking anywhere in the chat area (but not on messages)
    const handleChatAreaClick = (e: React.MouseEvent) => {
        // Only focus if clicking on the background, not on interactive elements
        if (
            persona &&
            messageInputRef.current &&
            e.target === e.currentTarget
        ) {
            messageInputRef.current.focus();
        }
    };

    if (!persona && !personaId) {
        return (
            <div className="flex-1 flex flex-col w-full items-center justify-center">
                <div className="bg-[#202C33] px-4 py-3 border-b border-[#2A3942] w-full">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            {/* Mobile menu button */}
                            <button
                                onClick={onToggleSidebar}
                                className="md:hidden p-2 hover:bg-[#374248] rounded-full transition-colors mr-2"
                            >
                                <FontAwesomeIcon
                                    icon={faBars}
                                    className="w-6 h-6 text-[#AEBAC1]"
                                />
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex-1 bg-[#0B141A] flex items-center justify-center w-full">
                    <div className="text-center">
                        <div className="w-24 h-24 flex items-center justify-center mx-auto">
                            <img
                                src={logo}
                                alt="Monc Chat Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <h2 className="text-2xl font-light text-[#E9EDEF] mb-2">
                            Monc Chat
                        </h2>
                        <p className="text-[#8696A0] max-w-md">
                            Chat with your favourite influencers and creators!
                            <br />
                            Select any user from the sidebar to start chatting.
                        </p>
                        <p className="text-xs text-[#8696A0] mt-4">
                            <a
                                href="https://payments.cashfree.com/forms/veer"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#AEBAC1] hover:underline"
                            >
                                Don't forget to buy me a{" "}
                                <Coffee className="inline w-4 h-4" /> if you
                                enjoy the experience!
                            </a>
                        </p>
                    </div>
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

        // Maintain focus on input
        maintainInputFocus();

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
            // Maintain focus after AI response
            maintainInputFocus();
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to send message";
            setError(`Send Error: ${errorMessage}`);
            setIsLoading(false);
            // Maintain focus even on error
            maintainInputFocus();
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Combine consecutive messages for better display
    const displayMessages = combineConsecutiveMessages(messages);

    return (
        <div
            className="flex-1 flex flex-col bg-[#0B141A]"
            onClick={handleChatAreaClick}
        >
            {/* Header */}
            <div className="bg-[#202C33] px-4 py-3 border-b border-[#2A3942]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        {/* Mobile menu button */}
                        <button
                            onClick={onToggleSidebar}
                            className="md:hidden p-2 hover:bg-[#374248] rounded-full transition-colors mr-2"
                        >
                            <FontAwesomeIcon
                                icon={faBars}
                                className="w-6 h-6 text-[#AEBAC1]"
                            />
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
                                        Fetching details
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
                                // Focus input after clearing
                                maintainInputFocus();
                            }}
                            className="p-2 hover:bg-[#374248] rounded-full transition-colors"
                            title="Clear chat history"
                        >
                            <Trash className="w-5 h-5 text-[#AEBAC1]" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div
                className="flex-1 overflow-y-auto p-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJ3aGF0c2FwcC1iZyIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj4KICAgICAgPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzFBMjAyNyIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+CiAgICA8L3BhdHRlcm4+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjd2hhdHNhcHAtYmcpIi8+Cjwvc3ZnPgo=')] bg-repeat"
                onClick={handleChatAreaClick}
            >
                <div className="max-w-4xl mx-auto space-y-2">
                    {displayMessages.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-[#8696A0] text-sm">
                                {persona
                                    ? `Start a conversation with ${persona.name}!`
                                    : "No messages yet"}
                            </p>
                            <p className="text-[#8696A0] text-xs mt-2 opacity-70">
                                Start typing to begin...
                            </p>
                        </div>
                    ) : (
                        displayMessages.map((message) => (
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
                                    onClick={() => {
                                        setError(null);
                                        maintainInputFocus();
                                    }}
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
                    <div className="flex-1 bg-[#2A3942] rounded-full px-4 py-2">
                        <input
                            ref={messageInputRef}
                            type="text"
                            placeholder={
                                persona
                                    ? `Message ${persona.name}... (or just start typing)`
                                    : "Type a message"
                            }
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading || !persona}
                            className="w-full bg-transparent text-white outline-none placeholder-[#8696A0] disabled:opacity-50"
                            autoComplete="off"
                        />
                    </div>

                    {/* {messageInput.trim() && !isLoading ? ( */}
                    <button
                        onClick={handleSendMessage}
                        disabled={!persona}
                        className="p-2 rounded-full transition-colors flex items-center justify-center disabled:opacity-50 hover:bg-[#374248]"
                        title="Send message (Enter)"
                    >
                        <FontAwesomeIcon
                            icon={faPaperPlane}
                            className="w-6 h-6 text-[#8696A0] hover:text-[#ff5e00] rotate-45 transition-colors"
                        />
                    </button>
                </div>

                {/* Helpful hint */}
                {persona && (
                    <div className="text-center mt-2">
                        <p className="text-[#8696A0] text-xs opacity-60">
                            Press Enter to send • Start typing from anywhere •
                            Click to focus
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
