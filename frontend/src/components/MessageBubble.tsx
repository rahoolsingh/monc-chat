import React, { useState } from "react";
import { Check, CheckCheck, Copy, Download } from "lucide-react";
import { ChatMessage } from "../types";

interface ChatMessageBubbleProps {
    message: ChatMessage;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
    message,
}) => {
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const isMe = message.sender === "user";

    const formatTime = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
        } catch {
            return timestamp;
        }
    };

    // Parse message content to detect code blocks and links
    const parseMessageContent = (content: string) => {
        const parts: Array<{
            type: "text" | "code" | "link";
            content: string;
            language?: string;
        }> = [];

        // Handle different code block patterns
        const patterns = [
            // Standard markdown: ```language\ncode```
            /```(\w+)?\s*\n([\s\S]*?)```/g,
            // Inline code with language: ```language code```
            /```(\w+)\s+([\s\S]*?)```/g,
            // Simple code blocks: ```code```
            /```([\s\S]*?)```/g,
        ];

        let processed = false;

        for (const pattern of patterns) {
            const regex = new RegExp(pattern.source, pattern.flags);
            let lastIndex = 0;
            let match;
            const tempParts: typeof parts = [];

            while ((match = regex.exec(content)) !== null) {
                // Add text before code block
                if (match.index > lastIndex) {
                    const textBefore = content.slice(lastIndex, match.index);
                    if (textBefore.trim()) {
                        tempParts.push({
                            type: "text",
                            content: textBefore.trim(),
                        });
                    }
                }

                // Determine language and code content based on match groups
                let language = "";
                let code = "";

                if (match[2]) {
                    // Pattern with language: ```language\ncode``` or ```language code```
                    language = match[1] || "text";
                    code = match[2];
                } else {
                    // Simple pattern: ```code```
                    code = match[1];
                    language = "text";
                }

                tempParts.push({
                    type: "code",
                    content: code.trim(),
                    language: language.toLowerCase(),
                });

                lastIndex = match.index + match[0].length;
            }

            // If we found matches, add remaining text and use these parts
            if (tempParts.length > 0) {
                if (lastIndex < content.length) {
                    const remainingText = content.slice(lastIndex);
                    if (remainingText.trim()) {
                        tempParts.push({
                            type: "text",
                            content: remainingText.trim(),
                        });
                    }
                }
                parts.push(...tempParts);
                processed = true;
                break;
            }
        }

        // If no code blocks found, treat entire content as text
        if (!processed) {
            parts.push({
                type: "text",
                content: content,
            });
        }

        return parts;
    };

    // Copy code to clipboard
    const copyToClipboard = async (code: string, language: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(null), 2000);
        } catch (error) {
            console.error("Failed to copy code:", error);
        }
    };

    // Download code as file
    const downloadCode = (code: string, language: string) => {
        const fileExtensions: { [key: string]: string } = {
            javascript: "js",
            typescript: "ts",
            python: "py",
            java: "java",
            cpp: "cpp",
            c: "c",
            html: "html",
            css: "css",
            sql: "sql",
            json: "json",
            xml: "xml",
            yaml: "yml",
            bash: "sh",
            shell: "sh",
            powershell: "ps1",
        };

        const extension = fileExtensions[language.toLowerCase()] || "txt";
        const blob = new Blob([code], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `code.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Render code block with syntax highlighting placeholder
    const renderCodeBlock = (code: string, language: string, index: number) => {
        const isCopied = copiedCode === code;

        return (
            <div key={index} className="my-3">
                {/* Code header */}
                <div
                    className={`
                    flex items-center justify-between px-3 py-2 text-xs
                    ${
                        isMe
                            ? "bg-[#7a2f00] text-[#D1F4CC]"
                            : "bg-[#1a252e] text-[#8696a0]"
                    } 
                    rounded-t-lg border-b border-opacity-20
                    ${isMe ? "border-[#D1F4CC]" : "border-[#8696a0]"}
                `}
                >
                    <span className="font-medium">{language || "text"}</span>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => copyToClipboard(code, language)}
                            className={`
                                p-1 rounded hover:bg-opacity-20 transition-colors
                                ${
                                    isMe
                                        ? "hover:bg-[#D1F4CC]"
                                        : "hover:bg-[#8696a0]"
                                }
                            `}
                            title="Copy code"
                        >
                            {isCopied ? (
                                <CheckCheck className="w-3 h-3" />
                            ) : (
                                <Copy className="w-3 h-3" />
                            )}
                        </button>
                        <button
                            onClick={() => downloadCode(code, language)}
                            className={`
                                p-1 rounded hover:bg-opacity-20 transition-colors
                                ${
                                    isMe
                                        ? "hover:bg-[#D1F4CC]"
                                        : "hover:bg-[#8696a0]"
                                }
                            `}
                            title="Download code"
                        >
                            <Download className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* Code content */}
                <div
                    className={`
                    ${
                        isMe
                            ? "bg-[#5d2000] text-[#f0f0f0]"
                            : "bg-[#0d1419] text-[#e6edf3]"
                    }
                    rounded-b-lg overflow-hidden
                `}
                >
                    <div className="overflow-x-auto">
                        <pre className="p-3 text-sm leading-relaxed min-w-0">
                            <code
                                className="font-mono block"
                                style={{
                                    whiteSpace: "pre",
                                    wordBreak: "normal",
                                    overflowWrap: "normal",
                                    display: "block",
                                }}
                            >
                                {code.trim()}
                            </code>
                        </pre>
                    </div>
                </div>
            </div>
        );
    };

    // Render text with link detection
    const renderTextWithLinks = (text: string, index: number) => {
        const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;
        const parts = text.split(urlRegex);

        return (
            <div key={index} className="space-y-1">
                {parts.map((part, i) => {
                    if (urlRegex.test(part)) {
                        return (
                            <a
                                key={i}
                                href={part}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`
                                    text-sm underline break-all
                                    ${
                                        isMe
                                            ? "text-[#D1F4CC]"
                                            : "text-[#53BDEB]"
                                    }
                                    hover:opacity-80 transition-opacity
                                `}
                            >
                                {part}
                            </a>
                        );
                    }
                    return (
                        <span key={i} className="whitespace-pre-wrap">
                            {part}
                        </span>
                    );
                })}
            </div>
        );
    };

    // Main content renderer
    const renderMessageContent = () => {
        // Parse content into parts
        const parts = parseMessageContent(message.content);

        return (
            <div className="space-y-1">
                {parts.map((part, index) => {
                    switch (part.type) {
                        case "code":
                            return renderCodeBlock(
                                part.content,
                                part.language || "text",
                                index
                            );
                        case "text":
                        default:
                            return (
                                <div key={index}>
                                    {renderTextWithLinks(part.content, index)}
                                </div>
                            );
                    }
                })}
            </div>
        );
    };

    // Calculate dynamic width based on content
    const getMessageWidth = () => {
        const hasCode = message.content.includes("```");
        const hasLongText = message.content.length > 100;

        if (hasCode) {
            return "max-w-full w-full sm:max-w-4xl"; // Full width on mobile, wider on desktop for code blocks
        } else if (hasLongText) {
            return "max-w-2xl"; // Medium width for long text
        }
        return "max-w-lg"; // Default width
    };

    return (
        <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}>
            <div
                className={`
                    ${getMessageWidth()} px-3 py-2 rounded-lg relative
                    ${isMe ? "bg-[#903500] ml-8" : "bg-[#202C33] mr-8"}
                `}
            >
                {/* Message content */}
                <div className="pb-2">
                    <div className={isMe ? "text-white" : "text-[#E9EDEF]"}>
                        {renderMessageContent()}
                    </div>
                </div>

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
                            {/* For user messages, we don't have read/delivered status in ChatMessage type */}
                            <Check className="w-4 h-4" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
