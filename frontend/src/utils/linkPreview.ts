export interface LinkPreview {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    favicon?: string;
    type?: "website" | "article" | "video" | "image";
    error?: string;
}

// Extract URLs from text
export const extractUrls = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;
    return text.match(urlRegex) || [];
};

// CORS proxy options for different services
const CORS_PROXIES = [
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?",
    "https://cors-anywhere.herokuapp.com/",
    "https://thingproxy.freeboard.io/fetch/",
];

let currentProxyIndex = 0;

// Get next CORS proxy
const getNextProxy = (): string => {
    const proxy = CORS_PROXIES[currentProxyIndex];
    currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
    return proxy;
};

// Fetch with CORS proxy and retry logic
const fetchWithProxy = async (
    url: string,
    options: RequestInit = {}
): Promise<Response> => {
    let lastError: Error | null = null;

    for (let i = 0; i < CORS_PROXIES.length; i++) {
        try {
            const proxy = getNextProxy();
            const proxyUrl = `${proxy}${encodeURIComponent(url)}`;

            const response = await fetch(proxyUrl, {
                ...options,
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    ...options.headers,
                },
                timeout: 10000,
            });

            if (response.ok) {
                return response;
            }
        } catch (error) {
            lastError = error as Error;
            console.warn(`Failed with proxy ${i + 1}:`, error);
        }
    }

    throw lastError || new Error("All CORS proxies failed");
};

// Extract metadata from HTML
const extractMetadata = (html: string, url: string): Partial<LinkPreview> => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Helper function to get meta content
    const getMeta = (name: string): string | null => {
        // Try property first (for Open Graph)
        let element = doc.querySelector(`meta[property="${name}"]`);
        if (element) return element.getAttribute("content");

        // Try name attribute
        element = doc.querySelector(`meta[name="${name}"]`);
        if (element) return element.getAttribute("content");

        return null;
    };

    // Extract title
    let title =
        getMeta("og:title") ||
        getMeta("twitter:title") ||
        doc.querySelector("title")?.textContent?.trim() ||
        "";

    // Clean title
    title = title.substring(0, 100).trim();

    // Extract description
    let description =
        getMeta("og:description") ||
        getMeta("twitter:description") ||
        getMeta("description") ||
        "";

    // Clean description
    description = description.substring(0, 200).trim();

    // Extract image
    let image =
        getMeta("og:image") ||
        getMeta("twitter:image") ||
        getMeta("twitter:image:src") ||
        "";

    // Convert relative URLs to absolute
    if (image && !image.startsWith("http")) {
        try {
            const baseUrl = new URL(url);
            image = new URL(image, baseUrl.origin).href;
        } catch {
            image = "";
        }
    }

    // Extract site name
    let siteName = getMeta("og:site_name") || getMeta("twitter:site") || "";

    // Extract from hostname if no site name
    if (!siteName) {
        try {
            const hostname = new URL(url).hostname;
            siteName = hostname.replace("www.", "").split(".")[0];
            siteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
        } catch {
            siteName = "Website";
        }
    }

    // Generate favicon URL
    let favicon = "";
    try {
        const baseUrl = new URL(url);
        favicon = `${baseUrl.protocol}//${baseUrl.hostname}/favicon.ico`;
    } catch {
        // Ignore favicon if URL parsing fails
    }

    // Determine content type
    let type: LinkPreview["type"] = "website";
    const ogType = getMeta("og:type");
    if (ogType) {
        if (ogType.includes("article")) type = "article";
        else if (ogType.includes("video")) type = "video";
    }

    // Check if it's an image URL
    if (isImageUrl(url)) {
        type = "image";
        if (!image) image = url;
        if (!title) title = "Image";
    }

    // Check if it's a video URL
    if (isVideoUrl(url)) {
        type = "video";
    }

    return {
        title,
        description,
        image,
        siteName,
        favicon,
        type,
    };
};

// Generate link preview with real data
export const generateLinkPreview = async (
    url: string
): Promise<LinkPreview> => {
    try {
        // Validate URL
        new URL(url);

        // Special handling for known domains
        const domain = new URL(url).hostname.toLowerCase();

        // YouTube special handling
        if (domain.includes("youtube.com") || domain.includes("youtu.be")) {
            return await handleYouTubeUrl(url);
        }

        // GitHub special handling
        if (domain.includes("github.com")) {
            return await handleGitHubUrl(url);
        }

        // Twitter/X special handling
        if (domain.includes("twitter.com") || domain.includes("x.com")) {
            return await handleTwitterUrl(url);
        }

        // Generic URL handling
        const response = await fetchWithProxy(url);
        const html = await response.text();
        const metadata = extractMetadata(html, url);

        return {
            url,
            ...metadata,
            title: metadata.title || "Untitled",
            description: metadata.description || "No description available",
            siteName: metadata.siteName || "Website",
        };
    } catch (error) {
        console.error("Error generating link preview:", error);

        // Fallback to basic URL parsing
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname.replace("www.", "");

            return {
                url,
                title: domain,
                description: `Visit ${domain}`,
                siteName: domain.charAt(0).toUpperCase() + domain.slice(1),
                favicon: `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`,
                type: "website",
                error: "Could not fetch preview data",
            };
        } catch {
            return {
                url,
                title: "Invalid URL",
                description: "Unable to generate preview",
                siteName: "Unknown",
                type: "website",
                error: "Invalid URL format",
            };
        }
    }
};

// Special handler for YouTube URLs
const handleYouTubeUrl = async (url: string): Promise<LinkPreview> => {
    try {
        // Extract video ID
        const videoId = extractYouTubeId(url);
        if (!videoId) throw new Error("Invalid YouTube URL");

        // Use YouTube oEmbed API (no CORS issues)
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
            url
        )}&format=json`;
        const response = await fetch(oembedUrl);

        if (response.ok) {
            const data = await response.json();
            return {
                url,
                title: data.title || "YouTube Video",
                description: `Watch "${data.title}" on YouTube`,
                image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                siteName: "YouTube",
                favicon: "https://youtube.com/favicon.ico",
                type: "video",
            };
        }

        throw new Error("oEmbed failed");
    } catch (error) {
        // Fallback for YouTube
        const videoId = extractYouTubeId(url);
        return {
            url,
            title: "YouTube Video",
            description: "Watch this video on YouTube",
            image: videoId
                ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                : "",
            siteName: "YouTube",
            favicon: "https://youtube.com/favicon.ico",
            type: "video",
            error: "Could not fetch video details",
        };
    }
};

// Special handler for GitHub URLs
const handleGitHubUrl = async (url: string): Promise<LinkPreview> => {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split("/").filter((p) => p);

        if (pathParts.length >= 2) {
            const owner = pathParts[0];
            const repo = pathParts[1];

            // Try GitHub API (public repos only)
            try {
                const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
                const response = await fetch(apiUrl);

                if (response.ok) {
                    const data = await response.json();
                    return {
                        url,
                        title: data.full_name,
                        description: data.description || "GitHub repository",
                        image: data.owner.avatar_url,
                        siteName: "GitHub",
                        favicon: "https://github.com/favicon.ico",
                        type: "website",
                    };
                }
            } catch {
                // API failed, use fallback
            }

            return {
                url,
                title: `${owner}/${repo}`,
                description: "GitHub repository",
                siteName: "GitHub",
                favicon: "https://github.com/favicon.ico",
                type: "website",
            };
        }

        return {
            url,
            title: "GitHub",
            description: "GitHub repository hosting service",
            siteName: "GitHub",
            favicon: "https://github.com/favicon.ico",
            type: "website",
        };
    } catch (error) {
        return {
            url,
            title: "GitHub",
            description: "GitHub repository",
            siteName: "GitHub",
            favicon: "https://github.com/favicon.ico",
            type: "website",
            error: "Could not fetch repository details",
        };
    }
};

// Special handler for Twitter/X URLs
const handleTwitterUrl = async (url: string): Promise<LinkPreview> => {
    const isXDomain = url.includes("x.com");
    const siteName = isXDomain ? "X" : "Twitter";
    const favicon = isXDomain
        ? "https://x.com/favicon.ico"
        : "https://twitter.com/favicon.ico";

    return {
        url,
        title: `${siteName} Post`,
        description: `View this post on ${siteName}`,
        siteName,
        favicon,
        type: "article",
    };
};

// Extract YouTube video ID from various URL formats
const extractYouTubeId = (url: string): string | null => {
    const patterns = [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\s]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?\s]+)/,
        /(?:https?:\/\/)?youtu\.be\/([^?\s]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
};

// Batch generate previews for multiple URLs
export const generateLinkPreviews = async (
    urls: string[]
): Promise<LinkPreview[]> => {
    const previews = await Promise.allSettled(
        urls.map((url) => generateLinkPreview(url))
    );

    return previews
        .filter(
            (result): result is PromiseFulfilledResult<LinkPreview> =>
                result.status === "fulfilled"
        )
        .map((result) => result.value);
};

// Check if URL is an image
export const isImageUrl = (url: string): boolean => {
    const imageExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".svg",
        ".bmp",
        ".ico",
    ];
    const urlLower = url.toLowerCase();
    return (
        imageExtensions.some((ext) => urlLower.includes(ext)) ||
        urlLower.includes("imgur.com") ||
        urlLower.includes("cloudinary.com")
    );
};

// Check if URL is a video
export const isVideoUrl = (url: string): boolean => {
    const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi"];
    const urlLower = url.toLowerCase();
    return (
        videoExtensions.some((ext) => urlLower.includes(ext)) ||
        urlLower.includes("youtube.com/watch") ||
        urlLower.includes("youtu.be/") ||
        urlLower.includes("vimeo.com/") ||
        urlLower.includes("dailymotion.com") ||
        urlLower.includes("twitch.tv")
    );
};

// Shorten URL for display
export const shortenUrl = (url: string, maxLength: number = 50): string => {
    if (url.length <= maxLength) return url;

    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        const path = urlObj.pathname + urlObj.search;

        if (domain.length + 3 >= maxLength) {
            return domain.substring(0, maxLength - 3) + "...";
        }

        const remainingLength = maxLength - domain.length - 3;
        if (path.length > remainingLength) {
            return domain + path.substring(0, remainingLength) + "...";
        }

        return url;
    } catch {
        return url.substring(0, maxLength - 3) + "...";
    }
};

// Cache for link previews to avoid repeated requests
const previewCache = new Map<
    string,
    { data: LinkPreview; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Generate cached link preview
export const generateCachedLinkPreview = async (
    url: string
): Promise<LinkPreview> => {
    const cached = previewCache.get(url);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }

    const preview = await generateLinkPreview(url);
    previewCache.set(url, { data: preview, timestamp: now });

    // Clean old cache entries
    if (previewCache.size > 100) {
        const entries = Array.from(previewCache.entries());
        const old = entries
            .filter(([, value]) => now - value.timestamp > CACHE_DURATION)
            .slice(0, 50);

        old.forEach(([key]) => previewCache.delete(key));
    }

    return preview;
};

// Utility to preload images for better UX
export const preloadImage = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
    });
};
