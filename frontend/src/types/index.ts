export interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastSeen: string;
  isOnline: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  delivered: boolean;
  read: boolean;
  type: 'text' | 'link' | 'image';
  linkPreview?: {
    url: string;
    title: string;
    description: string;
  };
}

export interface Chat {
  id: string;
  contact: Contact;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
  isFeatured: boolean;
}