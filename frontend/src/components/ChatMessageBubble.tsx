import React, { useState, useEffect } from "react";
import { ChatMessage } from "../types";
import { ExternalLink, Copy, Check, Image, Play } from "lucide-react";
import { 
    LinkPreview, 
    extractUrls, 
    generateLinkPreviews, 
    isImageUrl, 
    isVideoUrl,
    shortenUrl 
} from "../utils/linkPreview";
import { highlightCode } from "../utils/syntaxHighlight";

interface ChatMessageBubbleProps {
    message: ChatMessage;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message }) => {
    const isUser = message.sender === 'user';
    const [linkPreviews, setLinkPreviews] = useState<LinkPreview[]>([]);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    
    const time = new Date(message.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    // Generate link previews
    useEffect(() => {
        const urls = extractUrls(message.content);
        if (urls.length > 0) {
            generateLinkPreviews(urls).then(setLinkPreviews);
        }
    }, [message.content]);

    // Format text with WhatsApp-style formatting
    const formatText = (text: string): React.ReactNode => {
        // Split text by code blocks first
        const codeBlockRegex = /```([\s\S]*?)```/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = codeBlockRegex.exec(text)) !== null) {
            // Add text before code block
            if (match.index > lastIndex) {
                const beforeText = text.slice(lastIndex, match.index);
                parts.push(formatInlineText(beforeText));
            }

            // Add code block
            const codeContent = match[1].trim();
            const codeId = `code-${Date.now()}-${Math.random()}`;
            
            // Extract language from first line if specified (e.g., ```javascript)
            const lines = codeContent.split('\n');
            let language = '';
            let actualCode = codeContent;
            
            if (lines[0] && lines[0].match(/^[a-zA-Z]+$/)) {
                language = lines[0];
                actualCode = lines.slice(1).join('\n');
            }
            
            const highlightedCode = highlightCode(actualCode, language);
            
            parts.push(
                <div key={codeId} className="my-2 relative">
                    <div className="bg-[#1E1E1E] rounded-lg overflow-hidden">
                        {/* Language label */}
                        {language && (
                            <div className="bg-[#2D2D2D] px-3 py-1 text-xs text-[#8696A0] border-b border-[#374248]">
                                {language}
                            </div>
                        )}
                        
                        <div className="p-3 font-mono text-sm overflow-x-auto relative">
                            <button
                                onClick={() => copyToClipboard(actualCode, codeId)}
                                className="absolute top-2 right-2 p-1 rounded hover:bg-[#374248] transition-colors z-10"
                                title="Copy code"
                            >
                                {copiedCode === codeId ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                    <Copy className="w-4 h-4 text-[#8696A0]" />
                                )}
                            </button>
                            
                            <pre 
                                className="text-[#E5E7EB] whitespace-pre-wrap break-words pr-8"
                                dangerouslySetInnerHTML={{ __html: highlightedCode }}
                            />
                        </div>
                    </div>
                </div>
            );

            lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < text.length) {
            const remainingText = text.slice(lastIndex);
            parts.push(formatInlineText(remainingText));
        }

        return parts.length > 0 ? parts : formatInlineText(text);
    };

    // Format inline text with bold, italic, and links
    const formatInlineText = (text: string): React.ReactNode => {
        // Process in order: links, bold, italic, inline code
        let processed = text;
        const elements: React.ReactNode[] = [];
        let key = 0;

        // Split by segments and process each
        const segments = processed.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|https?:\/\/[^\s]+)/g);
        
        return segments.map((segment, index) => {
            // Bold text **text**
            if (segment.startsWith('**') && segment.endsWith('**') && segment.length > 4) {
                return (
                    <strong key={`bold-${index}`} className="font-bold">
                        {segment.slice(2, -2)}
                    </strong>
                );
            }
            
            // Italic text *text* (but not if it's part of **)
            if (segment.startsWith('*') && segment.endsWith('*') && segment.length > 2 && !segment.startsWith('**')) {
                return (
                    <em key={`italic-${index}`} className="italic">
                        {segment.slice(1, -1)}
                    </em>
                );
            }
            
            // Inline code `code`
            if (segment.startsWith('`') && segment.endsWith('`') && segment.length > 2) {
                return (
                    <code key={`code-${index}`} className="bg-[#374248] px-1 py-0.5 rounded text-sm font-mono">
                        {segment.slice(1, -1)}
                    </code>
                );
            }
            
            // Links
            if (segment.match(/^https?:\/\/[^\s<>"{}|\\^`[\]]+$/)) {
                const isImage = isImageUrl(segment);
                const isVideo = isVideoUrl(segment);
                const displayUrl = shortenUrl(segment, 40);
                
                return (
                    <a
                        key={`link-${index}`}
                        href={segment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#53BDEB] hover:underline inline-flex items-center gap-1"
                    >
                        {isImage && <Image className="w-3 h-3" />}
                        {isVideo && <Play className="w-3 h-3" />}
                        {displayUrl}
                        <ExternalLink className="w-3 h-3" />
                    </a>
                );
            }
            
            // Regular text
            return segment;
        });
    };

    // Copy code to clipboard
    const copyToClipboard = async (text: string, codeId: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedCode(codeId);
            setTimeout(() => setCopiedCode(null), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
            <div
                className={`
                    max-w-xs lg:max-w-md rounded-lg overflow-hidden
                    ${isUser 
                        ? 'bg-[#005C4B] text-white' 
                        : 'bg-[#202C33] text-white'
                    }
                `}
            >
                {/* Link Previews */}
                {linkPreviews.length > 0 && (
                    <div className="border-b border-[#374248]">
                        {linkPreviews.map((preview, index) => (
                            <div key={index} className="p-3 hover:bg-[#374248] transition-colors">
                                <a
                                    href={preview.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                >
                                    {preview.image && (
                                        <img
                                            src={preview.image}
                                            alt={preview.title}
                                            className="w-full h-32 object-cover rounded mb-2"
                                        />
                                    )}
                                    <div className="space-y-1">
                                        {preview.siteName && (
                                            <p className="text-xs text-[#8696A0] uppercase tracking-wide">
                                                {preview.siteName}
                                            </p>
                                        )}
                                        {preview.title && (
                                            <p className="text-sm font-medium text-white">
                                                {preview.title}
                                            </p>
                                        )}
                                        {preview.description && (
                                            <p className="text-xs text-[#AEBAC1]">
                                                {preview.description}
                                            </p>
                                        )}
                                        <p className="text-xs text-[#53BDEB] flex items-center gap-1">
                                            {shortenUrl(preview.url, 35)}
                                            <ExternalLink className="w-3 h-3" />
                                        </p>
                                    </div>
                                </a>
                            </div>
                        ))}
                    </div>
                )}

                {/* Message Content */}
                <div className="px-4 py-2">
                    <div className="text-sm whitespace-pre-wrap break-words">
                        {formatText(message.content)}
                    </div>
                    
                    {/* Timestamp and Status */}
                    <div className={`flex items-center justify-end mt-1 space-x-1`}>
                        <span className="text-xs text-[#8696A0]">
                            {time}
                        </span>
                        {isUser && (
                            <div className="flex space-x-1">
                                {/* Single check mark for sent */}
                                <svg className="w-3 h-3 text-[#8696A0]" viewBox="0 0 16 15" fill="currentColor">
                                    <path d="M10.91 3.2L5.5 8.61 3.09 6.2A1 1 0 1 0 1.68 7.61l3.83 3.83a1 1 0 0 0 1.42 0l6.83-6.83a1 1 0 0 0-1.42-1.42z"/>
                                </svg>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};