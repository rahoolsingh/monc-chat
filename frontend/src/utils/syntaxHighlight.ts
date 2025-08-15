// Simple syntax highlighting for common languages
export const highlightCode = (code: string, language?: string): string => {
    // If no language specified, try to detect
    if (!language) {
        language = detectLanguage(code);
    }

    switch (language?.toLowerCase()) {
        case 'javascript':
        case 'js':
            return highlightJavaScript(code);
        case 'typescript':
        case 'ts':
            return highlightTypeScript(code);
        case 'python':
        case 'py':
            return highlightPython(code);
        case 'html':
            return highlightHTML(code);
        case 'css':
            return highlightCSS(code);
        case 'json':
            return highlightJSON(code);
        case 'bash':
        case 'shell':
        case 'sh':
            return highlightBash(code);
        default:
            return escapeHtml(code);
    }
};

// Detect programming language from code content
const detectLanguage = (code: string): string => {
    const trimmed = code.trim();
    
    // JSON detection
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
            JSON.parse(trimmed);
            return 'json';
        } catch {}
    }
    
    // HTML detection
    if (trimmed.includes('<') && trimmed.includes('>') && 
        (trimmed.includes('<!DOCTYPE') || trimmed.includes('<html') || 
         trimmed.includes('<div') || trimmed.includes('<span'))) {
        return 'html';
    }
    
    // CSS detection
    if (trimmed.includes('{') && trimmed.includes('}') && 
        (trimmed.includes(':') && trimmed.includes(';'))) {
        return 'css';
    }
    
    // Python detection
    if (trimmed.includes('def ') || trimmed.includes('import ') || 
        trimmed.includes('from ') || trimmed.includes('print(')) {
        return 'python';
    }
    
    // JavaScript/TypeScript detection
    if (trimmed.includes('function') || trimmed.includes('=>') || 
        trimmed.includes('const ') || trimmed.includes('let ') || 
        trimmed.includes('var ') || trimmed.includes('console.log')) {
        if (trimmed.includes(': string') || trimmed.includes(': number') || 
            trimmed.includes('interface ') || trimmed.includes('type ')) {
            return 'typescript';
        }
        return 'javascript';
    }
    
    // Bash detection
    if (trimmed.startsWith('#!') || trimmed.includes('#!/bin/bash') || 
        trimmed.includes('echo ') || trimmed.includes('cd ') || 
        trimmed.includes('ls ') || trimmed.includes('mkdir ')) {
        return 'bash';
    }
    
    return 'text';
};

// Escape HTML characters
const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

// JavaScript syntax highlighting
const highlightJavaScript = (code: string): string => {
    let highlighted = escapeHtml(code);
    
    // Keywords
    const keywords = [
        'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 
        'do', 'break', 'continue', 'switch', 'case', 'default', 'try', 'catch', 
        'finally', 'throw', 'new', 'this', 'super', 'class', 'extends', 'import', 
        'export', 'from', 'as', 'async', 'await', 'true', 'false', 'null', 'undefined'
    ];
    
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
        highlighted = highlighted.replace(regex, '<span class="text-[#C792EA]">$1</span>');
    });
    
    // Strings
    highlighted = highlighted.replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, 
        '<span class="text-[#C3E88D]">$1$2$1</span>');
    
    // Comments
    highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="text-[#546E7A]">$1</span>');
    highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-[#546E7A]">$1</span>');
    
    // Numbers
    highlighted = highlighted.replace(/\b(\d+\.?\d*)\b/g, '<span class="text-[#F78C6C]">$1</span>');
    
    return highlighted;
};

// TypeScript syntax highlighting (extends JavaScript)
const highlightTypeScript = (code: string): string => {
    let highlighted = highlightJavaScript(code);
    
    // TypeScript specific keywords
    const tsKeywords = ['interface', 'type', 'enum', 'namespace', 'declare', 'abstract', 'readonly'];
    
    tsKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
        highlighted = highlighted.replace(regex, '<span class="text-[#C792EA]">$1</span>');
    });
    
    // Type annotations
    highlighted = highlighted.replace(/:\s*([A-Za-z_][A-Za-z0-9_]*)/g, 
        ': <span class="text-[#82AAFF]">$1</span>');
    
    return highlighted;
};

// Python syntax highlighting
const highlightPython = (code: string): string => {
    let highlighted = escapeHtml(code);
    
    // Keywords
    const keywords = [
        'def', 'class', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 
        'finally', 'with', 'as', 'import', 'from', 'return', 'yield', 'break', 
        'continue', 'pass', 'lambda', 'and', 'or', 'not', 'in', 'is', 'True', 
        'False', 'None', 'self', 'super'
    ];
    
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
        highlighted = highlighted.replace(regex, '<span class="text-[#C792EA]">$1</span>');
    });
    
    // Strings
    highlighted = highlighted.replace(/(["'])((?:\\.|(?!\1)[^\\])*?)\1/g, 
        '<span class="text-[#C3E88D]">$1$2$1</span>');
    
    // Comments
    highlighted = highlighted.replace(/(#.*$)/gm, '<span class="text-[#546E7A]">$1</span>');
    
    // Numbers
    highlighted = highlighted.replace(/\b(\d+\.?\d*)\b/g, '<span class="text-[#F78C6C]">$1</span>');
    
    return highlighted;
};

// HTML syntax highlighting
const highlightHTML = (code: string): string => {
    let highlighted = escapeHtml(code);
    
    // Tags
    highlighted = highlighted.replace(/(&lt;\/?)([a-zA-Z][a-zA-Z0-9]*)(.*?)(&gt;)/g, 
        '$1<span class="text-[#F07178]">$2</span><span class="text-[#C792EA]">$3</span>$4');
    
    // Attributes
    highlighted = highlighted.replace(/(\w+)(=)(&quot;[^&]*&quot;)/g, 
        '<span class="text-[#FFCB6B]">$1</span>$2<span class="text-[#C3E88D]">$3</span>');
    
    return highlighted;
};

// CSS syntax highlighting
const highlightCSS = (code: string): string => {
    let highlighted = escapeHtml(code);
    
    // Selectors
    highlighted = highlighted.replace(/^([^{]+)(?=\s*{)/gm, 
        '<span class="text-[#FFCB6B]">$1</span>');
    
    // Properties
    highlighted = highlighted.replace(/(\w+)(\s*:)/g, 
        '<span class="text-[#82AAFF]">$1</span>$2');
    
    // Values
    highlighted = highlighted.replace(/(:\s*)([^;]+)(;)/g, 
        '$1<span class="text-[#C3E88D]">$2</span>$3');
    
    return highlighted;
};

// JSON syntax highlighting
const highlightJSON = (code: string): string => {
    let highlighted = escapeHtml(code);
    
    // Strings (keys and values)
    highlighted = highlighted.replace(/(&quot;[^&]*&quot;)(\s*:)/g, 
        '<span class="text-[#FFCB6B]">$1</span>$2');
    highlighted = highlighted.replace(/(:\s*)(&quot;[^&]*&quot;)/g, 
        '$1<span class="text-[#C3E88D]">$2</span>');
    
    // Numbers
    highlighted = highlighted.replace(/:\s*(-?\d+\.?\d*)/g, 
        ': <span class="text-[#F78C6C]">$1</span>');
    
    // Booleans and null
    highlighted = highlighted.replace(/:\s*(true|false|null)/g, 
        ': <span class="text-[#C792EA]">$1</span>');
    
    return highlighted;
};

// Bash syntax highlighting
const highlightBash = (code: string): string => {
    let highlighted = escapeHtml(code);
    
    // Commands
    const commands = [
        'ls', 'cd', 'pwd', 'mkdir', 'rmdir', 'rm', 'cp', 'mv', 'cat', 'less', 
        'more', 'head', 'tail', 'grep', 'find', 'chmod', 'chown', 'ps', 'kill', 
        'top', 'df', 'du', 'free', 'uname', 'whoami', 'date', 'echo', 'printf', 
        'export', 'source', 'bash', 'sh', 'curl', 'wget', 'git', 'npm', 'node'
    ];
    
    commands.forEach(cmd => {
        const regex = new RegExp(`\\b(${cmd})\\b`, 'g');
        highlighted = highlighted.replace(regex, '<span class="text-[#C792EA]">$1</span>');
    });
    
    // Strings
    highlighted = highlighted.replace(/(["'])((?:\\.|(?!\1)[^\\])*?)\1/g, 
        '<span class="text-[#C3E88D]">$1$2$1</span>');
    
    // Comments
    highlighted = highlighted.replace(/(#.*$)/gm, '<span class="text-[#546E7A]">$1</span>');
    
    // Variables
    highlighted = highlighted.replace(/(\$\w+)/g, '<span class="text-[#FFCB6B]">$1</span>');
    
    return highlighted;
};