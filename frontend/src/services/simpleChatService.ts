import { ChatMessage } from "../types";

const API_BASE_URL =
    import.meta.env.VITE_BACKEND_URL;

/**
 * Simple chat service that handles message sending and response splitting
 */
export const sendMessageSimple = async (
    personaId: string,
    message: string,
    history: ChatMessage[]
): Promise<string[]> => {
    try {
        // Convert chat history to API format
        const apiHistory = history.map((msg) => ({
            role:
                msg.sender === "user"
                    ? ("user" as const)
                    : ("assistant" as const),
            content: msg.content,
        }));

        const requestBody = {
            message: message.trim(),
            history: apiHistory,
        };

        const response = await fetch(`${API_BASE_URL}/api/chat/${personaId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.error?.message || `HTTP ${response.status}`
            );
        }

        // Handle Server-Sent Events response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        const responseParts: string[] = [];

        if (!reader) {
            throw new Error("Failed to read response stream");
        }

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.success && data.data) {
                                if (data.data.type === "complete") {
                                    return responseParts;
                                } else if (data.data.content) {
                                    responseParts.push(data.data.content);
                                }
                            }
                        } catch (parseError) {
                            console.warn("Failed to parse SSE data:", line);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }

        return responseParts;
    } catch (error) {
        console.error("Error in simple chat service:", error);
        throw error;
    }
};
