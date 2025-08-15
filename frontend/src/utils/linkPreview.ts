export interface LinkPreview {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    favicon?: string;
}

// Extract URLs from text
export const extractUrls = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;
    return text.match(urlRegex) || [];
};

// Generate link preview (mock implementation)
// In a real app, you'd use a service like linkpreview.net or implement server-side scraping
export const generateLinkPreview = async (url: string): Promise<LinkPreview> => {
    try {
        const domain = new URL(url).hostname;
        
        // Mock previews for common domains
        const mockPreviews: Record<string, Partial<LinkPreview>> = {
            'github.com': {
                title: 'GitHub Repository',
                description: 'Code repository and version control',
                siteName: 'GitHub',
                favicon: 'https://github.com/favicon.ico'
            },
            'youtube.com': {
                title: 'YouTube Video',
                description: 'Watch this video on YouTube',
                siteName: 'YouTube',
                favicon: 'https://youtube.com/favicon.ico'
            },
            'stackoverflow.com': {
                title: 'Stack Overflow Question',
                description: 'Programming Q&A community',
                siteName: 'Stack Overflow',
                favicon: 'https://stackoverflow.com/favicon.ico'
            },
            'medium.com': {
                title: 'Medium Article',
                description: 'Read this article on Medium',
                siteName: 'Medium',
                favicon: 'https://medium.com/favicon.ico'
            },
            'dev.to': {
                title: 'DEV Community Post',
                description: 'Developer community article',
                siteName: 'DEV Community',
                favicon: 'https://dev.to/favicon.ico'
            },
            'twitter.com': {
                title: 'Twitter Post',
                description: 'View this tweet',
                siteName: 'Twitter',
                favicon: 'https://twitter.com/favicon.ico'
            },
            'x.com': {
                title: 'X Post',
                description: 'View this post on X',
                siteName: 'X',
                favicon: 'https://x.com/favicon.ico'
            },
            'linkedin.com': {
                title: 'LinkedIn Post',
                description: 'Professional networking content',
                siteName: 'LinkedIn',
                favicon: 'https://linkedin.com/favicon.ico'
            },
            'npmjs.com': {
                title: 'NPM Package',
                description: 'Node.js package registry',
                siteName: 'npm',
                favicon: 'https://npmjs.com/favicon.ico'
            },
            'codepen.io': {
                title: 'CodePen Demo',
                description: 'Front-end code playground',
                siteName: 'CodePen',
                favicon: 'https://codepen.io/favicon.ico'
            }
        };

        const mockData = mockPreviews[domain] || {
            title: 'Link Preview',
            description: 'Click to open link',
            siteName: domain
        };

        return {
            url,
            ...mockData
        };

    } catch (error) {
        console.error('Error generating link preview:', error);
        return {
            url,
            title: 'Link',
            description: 'Click to open',
            siteName: 'External Link'
        };
    }
};

// Batch generate previews for multiple URLs
export const generateLinkPreviews = async (urls: string[]): Promise<LinkPreview[]> => {
    const previews = await Promise.allSettled(
        urls.map(url => generateLinkPreview(url))
    );

    return previews
        .filter((result): result is PromiseFulfilledResult<LinkPreview> => 
            result.status === 'fulfilled'
        )
        .map(result => result.value);
};

// Check if URL is an image
export const isImageUrl = (url: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const urlLower = url.toLowerCase();
    return imageExtensions.some(ext => urlLower.includes(ext));
};

// Check if URL is a video
export const isVideoUrl = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    const urlLower = url.toLowerCase();
    return videoExtensions.some(ext => urlLower.includes(ext)) ||
           urlLower.includes('youtube.com/watch') ||
           urlLower.includes('youtu.be/') ||
           urlLower.includes('vimeo.com/');
};

// Shorten URL for display
export const shortenUrl = (url: string, maxLength: number = 50): string => {
    if (url.length <= maxLength) return url;
    
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        const path = urlObj.pathname + urlObj.search;
        
        if (domain.length + 3 >= maxLength) {
            return domain.substring(0, maxLength - 3) + '...';
        }
        
        const remainingLength = maxLength - domain.length - 3; // 3 for "..."
        if (path.length > remainingLength) {
            return domain + path.substring(0, remainingLength) + '...';
        }
        
        return url;
    } catch {
        return url.substring(0, maxLength - 3) + '...';
    }
};