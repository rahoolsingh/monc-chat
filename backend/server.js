import "dotenv/config";
import express from "express";
import cors from "cors";
import { OpenAI } from "openai";
import personaData from "./personaData.js";

// Initialize OpenAI client
const openai = new OpenAI();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
    cors({
        origin: [
            process.env.FRONTEND_URL || "http://localhost:3000",
            "http://localhost:5173", // Vite dev server
        ],
        credentials: true,
    })
);

app.use(express.json({ limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Error:", err);

    // Handle different types of errors
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            error: {
                code: "INVALID_JSON",
                message: "Invalid JSON in request body",
                details: err.message,
            },
        });
    }

    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
            success: false,
            error: {
                code: "PAYLOAD_TOO_LARGE",
                message: "Request payload too large",
                details: "Maximum size is 10MB",
            },
        });
    }

    // Generic error response
    res.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected error occurred",
            details:
                process.env.NODE_ENV === "development"
                    ? err.message
                    : "Please try again later",
        },
    });
});

// Personas API endpoints
app.get("/api/personas", (req, res) => {
    try {
        // Transform personaData into API response format
        const personas = Object.entries(personaData).map(([id, data]) => ({
            id,
            name: data.name,
            profileImage: data.profileImage,
            description: `Chat with ${data.name}`, // Simple description
            isOnline: true,
            filterTags: data.filterTags,
        }));

        res.json({
            success: true,
            data: personas,
        });
    } catch (error) {
        console.error("Error fetching personas:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "PERSONAS_FETCH_ERROR",
                message: "Failed to fetch personas",
                details: error.message,
            },
        });
    }
});

app.get("/api/personas/:id", (req, res) => {
    try {
        const { id } = req.params;

        // Validate persona ID
        if (!personaData[id]) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "PERSONA_NOT_FOUND",
                    message: `Persona with ID '${id}' not found`,
                    details: `Available personas: ${Object.keys(
                        personaData
                    ).join(", ")}`,
                },
            });
        }

        const persona = personaData[id];

        // Return persona details including system prompt
        res.json({
            success: true,
            data: {
                id,
                name: persona.name,
                profileImage: persona.profileImage,
                description: `Chat with ${persona.name}`,
                isOnline: Math.random() > 0.3, // Random online status for demo
                systemPrompt: persona.persona, // Include system prompt for AI context
            },
        });
    } catch (error) {
        console.error("Error fetching persona:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "PERSONA_FETCH_ERROR",
                message: "Failed to fetch persona details",
                details: error.message,
            },
        });
    }
});

// Chat API endpoint
app.post("/api/chat/:personaId", async (req, res) => {
    try {
        const { personaId } = req.params;
        const { message, history } = req.body;

        // Validate persona ID
        if (!personaData[personaId]) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "PERSONA_NOT_FOUND",
                    message: `Persona with ID '${personaId}' not found`,
                    details: `Available personas: ${Object.keys(
                        personaData
                    ).join(", ")}`,
                },
            });
        }

        // Validate message content
        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_MESSAGE",
                    message: "Message content is required",
                    details: "Message must be a non-empty string",
                },
            });
        }

        // Validate history format
        if (history && !Array.isArray(history)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_HISTORY",
                    message: "History must be an array",
                    details: "History should be an array of message objects",
                },
            });
        }

        const persona = personaData[personaId];

        // Build messages array for OpenAI
        const messages = [
            {
                role: "system",
                content: persona.persona,
            },
        ];

        // Add chat history if provided
        if (history && history.length > 0) {
            // Limit history to last 20 messages to avoid token limits
            const recentHistory = history.slice(-20);
            messages.push(...recentHistory);
        }

        // Add current user message
        messages.push({
            role: "user",
            content: message.trim(),
        });

        // Call OpenAI API
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7,
        });

        const aiResponse = response.choices[0].message.content;

        // Split response by newlines for natural conversation flow
        const responseParts = aiResponse
            .split("\n")
            .filter((part) => part.trim().length > 0)
            .map((part, index, array) => ({
                id: `${Date.now()}_${index}`,
                content: part.trim(),
                isComplete: index === array.length - 1,
                partIndex: index,
                totalParts: array.length,
            }));

        // Set up Server-Sent Events for streaming response
        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
        });

        // Send each part with a delay for natural conversation flow
        for (let i = 0; i < responseParts.length; i++) {
            const part = responseParts[i];

            // Add delay between parts (500ms to 1500ms)
            if (i > 0) {
                await new Promise((resolve) =>
                    setTimeout(resolve, 500 + Math.random() * 1000)
                );
            }

            // Send the message part
            res.write(
                `data: ${JSON.stringify({
                    success: true,
                    data: part,
                })}\n\n`
            );
        }

        // Send completion signal
        res.write(
            `data: ${JSON.stringify({
                success: true,
                data: { type: "complete" },
            })}\n\n`
        );

        res.end();
    } catch (error) {
        console.error("Error in chat endpoint:", error);

        // Handle OpenAI specific errors
        if (error.code === "insufficient_quota") {
            return res.status(429).json({
                success: false,
                error: {
                    code: "OPENAI_QUOTA_EXCEEDED",
                    message: "OpenAI API quota exceeded",
                    details: "Please check your OpenAI account billing",
                },
            });
        }

        if (error.code === "rate_limit_exceeded") {
            return res.status(429).json({
                success: false,
                error: {
                    code: "OPENAI_RATE_LIMIT",
                    message: "OpenAI API rate limit exceeded",
                    details: "Please try again in a moment",
                },
            });
        }

        // Generic error response
        res.status(500).json({
            success: false,
            error: {
                code: "CHAT_PROCESSING_ERROR",
                message: "Failed to process chat message",
                details:
                    process.env.NODE_ENV === "development"
                        ? error.message
                        : "Please try again later",
            },
        });
    }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        data: {
            status: "healthy",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
        },
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
