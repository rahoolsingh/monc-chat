import { ChatMessage, ChatRequest, MessagePart } from "../types";
import { apiClient, ApiError } from "./api";

// Chat service for handling real-time messaging with AI personas
export class ChatService {
    private eventSource: EventSource | null = null;
    private messageQueue: ChatMessage[] = [];
    private isOnline: boolean = navigator.onLine;

    constructor() {
        // Listen for online/offline events
        window.addEventListener("online", () => {
            this.isOnline = true;
            this.processMessageQueue();
        });

        window.addEventListener("offline", () => {
            this.isOnline = false;
        });
    }

    /**
     * Send a message to a persona and receive streaming response
     */
    async sendMessage(
        personaId: string,
        message: string,
        history: ChatMessage[],
        onMessagePart: (part: MessagePart) => void,
        onComplete: () => void,
        onError: (error: ApiError) => void
    ): Promise<void> {
        try {
            // Validate inputs
            if (!personaId || !message.trim()) {
                throw new ApiError(
                    "INVALID_INPUT",
                    "Persona ID and message are required"
                );
            }

            // Check if online
            if (!this.isOnline) {
                // Queue message for later sending
                const queuedMessage: ChatMessage = {
                    id: Date.now().toString(),
                    personaId,
                    content: message.trim(),
                    timestamp: new Date().toISOString(),
                    sender: "user",
                };

                this.messageQueue.push(queuedMessage);
                throw new ApiError(
                    "OFFLINE",
                    "You are offline. Message will be sent when connection is restored."
                );
            }

            // Convert chat history to API format
            const apiHistory = history.map((msg) => ({
                role:
                    msg.sender === "user"
                        ? ("user" as const)
                        : ("assistant" as const),
                content: msg.content,
            }));

            const requestBody: ChatRequest = {
                message: message.trim(),
                history: apiHistory,
            };

            // Create EventSource for streaming response
            const url = `${
                import.meta.env.REACT_APP_API_URL || "http://localhost:3001"
            }/api/chat/${personaId}`;

            // Close existing connection if any
            this.closeEventSource();

            // Send POST request to initiate chat
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "text/event-stream",
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = {
                        error: {
                            message: `HTTP ${response.status}: ${response.statusText}`,
                        },
                    };
                }
                throw new ApiError(
                    errorData.error?.code || "HTTP_ERROR",
                    errorData.error?.message || `HTTP ${response.status}`,
                    errorData.error?.details
                );
            }

            // Handle Server-Sent Events
            this.handleStreamingResponse(
                response,
                onMessagePart,
                onComplete,
                onError
            );
        } catch (error) {
            console.error("Error sending message:", error);

            if (error instanceof ApiError) {
                onError(error);
            } else {
                onError(
                    new ApiError(
                        "SEND_MESSAGE_ERROR",
                        "Failed to send message",
                        error instanceof Error ? error.message : "Unknown error"
                    )
                );
            }
        }
    }

    /**
     * Handle streaming response from Server-Sent Events
     */
    private handleStreamingResponse(
        response: Response,
        onMessagePart: (part: MessagePart) => void,
        onComplete: () => void,
        onError: (error: ApiError) => void
    ): void {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            onError(
                new ApiError("STREAM_ERROR", "Failed to read response stream")
            );
            return;
        }

        const readStream = async () => {
            try {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        onComplete();
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
                                        onComplete();
                                        return;
                                    } else {
                                        onMessagePart(data.data);
                                    }
                                }
                            } catch (parseError) {
                                console.warn(
                                    "Failed to parse SSE data:",
                                    line
                                );
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Stream reading error:", error);
                onError(
                    new ApiError(
                        "STREAM_READ_ERROR",
                        "Failed to read message stream",
                        error instanceof Error
                            ? error.message
                            : "Unknown stream error"
                    )
                );
            } finally {
                reader.releaseLock();
            }
        };

        readStream();
    }

    /**
     * Process queued messages when coming back online
     */
    private async processMessageQueue(): Promise<void> {
        if (this.messageQueue.length === 0) return;
    }

    /**
     * Close existing EventSource connection
     */
    private closeEventSource(): void {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }

    /**
     * Check if the service is online
     */
    isServiceOnline(): boolean {
        return this.isOnline;
    }

    /**
     * Get number of queued messages
     */
    getQueuedMessageCount(): number {
        return this.messageQueue.length;
    }

    /**
     * Clear message queue
     */
    clearMessageQueue(): void {
        this.messageQueue = [];
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        this.closeEventSource();
        this.clearMessageQueue();

        window.removeEventListener("online", () => {});
        window.removeEventListener("offline", () => {});
    }
}

// Default chat service instance
export const chatService = new ChatService();
