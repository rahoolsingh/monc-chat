import { ChatMessage, ChatHistory } from "../types";

// Storage keys
const STORAGE_KEYS = {
    CHAT_HISTORY: "monc_chat_history",
    USER_PREFERENCES: "monc_user_preferences",
} as const;

// Maximum number of messages to keep per persona (LRU cache)
const MAX_MESSAGES_PER_PERSONA = 1000;
const MAX_PERSONAS_TO_KEEP = 10;

/**
 * Check if localStorage is available and working
 */
const isLocalStorageAvailable = (): boolean => {
    try {
        const testKey = "__localStorage_test__";
        localStorage.setItem(testKey, "test");
        localStorage.removeItem(testKey);
        return true;
    } catch (error) {
        console.warn("localStorage is not available:", error);
        return false;
    }
};

/**
 * Safely get item from localStorage with error handling
 */
const safeGetItem = (key: string): string | null => {
    if (!isLocalStorageAvailable()) return null;

    try {
        return localStorage.getItem(key);
    } catch (error) {
        console.error(`Error reading from localStorage (${key}):`, error);
        return null;
    }
};

/**
 * Safely set item in localStorage with error handling
 */
const safeSetItem = (key: string, value: string): boolean => {
    if (!isLocalStorageAvailable()) return false;

    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        console.error(`Error writing to localStorage (${key}):`, error);

        // Handle quota exceeded error
        if (error instanceof Error && error.name === "QuotaExceededError") {
            console.warn(
                "📦 localStorage quota exceeded, attempting cleanup..."
            );
            cleanupOldChatHistories();

            // Try again after cleanup
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (retryError) {
                console.error("Failed to save even after cleanup:", retryError);
                return false;
            }
        }

        return false;
    }
};

/**
 * Get all chat histories from localStorage
 */
const getAllChatHistories = (): Record<string, ChatHistory> => {
    const data = safeGetItem(STORAGE_KEYS.CHAT_HISTORY);
    if (!data) return {};

    try {
        return JSON.parse(data);
    } catch (error) {
        console.error("Error parsing chat histories:", error);
        return {};
    }
};

/**
 * Save all chat histories to localStorage
 */
const saveAllChatHistories = (
    histories: Record<string, ChatHistory>
): boolean => {
    try {
        const data = JSON.stringify(histories);
        return safeSetItem(STORAGE_KEYS.CHAT_HISTORY, data);
    } catch (error) {
        console.error("Error stringifying chat histories:", error);
        return false;
    }
};

/**
 * Clean up old chat histories to free up space (LRU)
 */
const cleanupOldChatHistories = (): void => {
    try {
        const histories = getAllChatHistories();
        const personaIds = Object.keys(histories);

        if (personaIds.length <= MAX_PERSONAS_TO_KEEP) return;

        // Sort by lastUpdated timestamp (oldest first)
        const sortedPersonas = personaIds
            .map((id) => ({
                id,
                lastUpdated: new Date(histories[id].lastUpdated).getTime(),
            }))
            .sort((a, b) => a.lastUpdated - b.lastUpdated);

        // Remove oldest personas
        const toRemove = sortedPersonas.slice(
            0,
            personaIds.length - MAX_PERSONAS_TO_KEEP
        );

        toRemove.forEach(({ id }) => {
            delete histories[id];
        });

        saveAllChatHistories(histories);
    } catch (error) {
        console.error("Error during cleanup:", error);
    }
};

/**
 * Trim messages for a persona if it exceeds the limit
 */
const trimMessages = (messages: ChatMessage[]): ChatMessage[] => {
    if (messages.length <= MAX_MESSAGES_PER_PERSONA) return messages;

    // Keep the most recent messages
    const trimmed = messages.slice(-MAX_MESSAGES_PER_PERSONA);
    return trimmed;
};

/**
 * Get chat history for a specific persona
 */
export const getChatHistory = (personaId: string): ChatMessage[] => {
    try {
        const histories = getAllChatHistories();
        const history = histories[personaId];

        if (!history) {
            return [];
        }

        return history.messages;
    } catch (error) {
        console.error(`Error getting chat history for ${personaId}:`, error);
        return [];
    }
};

/**
 * Save complete chat history for a persona
 */
export const saveChatHistory = (
    personaId: string,
    messages: ChatMessage[]
): boolean => {
    try {
        const histories = getAllChatHistories();
        const trimmedMessages = trimMessages(messages);

        histories[personaId] = {
            personaId,
            messages: trimmedMessages,
            lastUpdated: new Date().toISOString(),
        };

        const success = saveAllChatHistories(histories);

        if (!success) {
            console.error(
                `Failed to save chat history for persona: ${personaId}`
            );
        }

        return success;
    } catch (error) {
        console.error(`Error saving chat history for ${personaId}:`, error);
        return false;
    }
};

/**
 * Add a single message to chat history
 */
export const addMessage = (
    personaId: string,
    message: ChatMessage
): boolean => {
    try {
        const existingMessages = getChatHistory(personaId);
        const updatedMessages = [...existingMessages, message];

        return saveChatHistory(personaId, updatedMessages);
    } catch (error) {
        console.error(`Error adding message for ${personaId}:`, error);
        return false;
    }
};

/**
 * Clear chat history for a specific persona
 */
export const clearChatHistory = (personaId: string): boolean => {
    try {
        const histories = getAllChatHistories();

        if (histories[personaId]) {
            delete histories[personaId];
            const success = saveAllChatHistories(histories);

            return success;
        }

        return true; // Already cleared
    } catch (error) {
        console.error(`Error clearing chat history for ${personaId}:`, error);
        return false;
    }
};

/**
 * Get the last message for a persona (for chat list preview)
 */
export const getLastMessage = (personaId: string): ChatMessage | null => {
    try {
        const messages = getChatHistory(personaId);
        return messages.length > 0 ? messages[messages.length - 1] : null;
    } catch (error) {
        console.error(`Error getting last message for ${personaId}:`, error);
        return null;
    }
};

/**
 * Clear all chat data (for reset/logout)
 */
export const clearAllChatData = (): boolean => {
    try {
        if (!isLocalStorageAvailable()) return false;

        localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);

        return true;
    } catch (error) {
        console.error("Error clearing all chat data:", error);
        return false;
    }
};

/**
 * Get storage usage statistics
 */
export const getStorageStats = (): { used: number; available: boolean } => {
    if (!isLocalStorageAvailable()) {
        return { used: 0, available: false };
    }

    try {
        const data = safeGetItem(STORAGE_KEYS.CHAT_HISTORY) || "";
        const used = new Blob([data]).size;

        return { used, available: true };
    } catch (error) {
        console.error("Error calculating storage stats:", error);
        return { used: 0, available: false };
    }
};
