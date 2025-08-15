// Legacy Contact interface (keeping for backward compatibility)
export interface Contact {
    id: string;
    name: string;
    avatar: string;
    lastSeen: string;
    isOnline: boolean;
}

// New Persona interface matching backend response
export interface Persona {
    id: string;
    name: string;
    profileImage: string;
    description: string;
    isOnline: boolean;
    systemPrompt?: string; // Only included in detailed persona response
}

// Updated Message interface for backend integration
export interface ChatMessage {
    id: string;
    personaId: string;
    content: string;
    timestamp: string;
    sender: 'user' | 'assistant';
    isTyping?: boolean;
    partIndex?: number;
    totalParts?: number;
}

// Legacy Message interface (keeping for backward compatibility)
export interface Message {
    id: string;
    senderId: string;
    content: string;
    timestamp: string;
    delivered: boolean;
    read: boolean;
    type: "text" | "link" | "image";
}

// Chat history structure for localStorage
export interface ChatHistory {
    personaId: string;
    messages: ChatMessage[];
    lastUpdated: string;
}

// Legacy Chat interface (keeping for backward compatibility)
export interface Chat {
    id: string;
    contact: Contact;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    messages: Message[];
    isFeatured: boolean;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details: string;
    };
}

export interface PersonasResponse extends ApiResponse<Persona[]> {}
export interface PersonaResponse extends ApiResponse<Persona> {}

// Chat API types
export interface ChatRequest {
    message: string;
    history: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>;
}

export interface MessagePart {
    id: string;
    content: string;
    isComplete: boolean;
    partIndex: number;
    totalParts: number;
}
