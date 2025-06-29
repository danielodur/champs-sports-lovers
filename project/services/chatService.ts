interface ChatMessage {
  id: string;
  matchId: string;
  userId: string;
  username: string;
  avatar: string;
  message: string;
  timestamp: string;
  type: 'message' | 'system' | 'goal' | 'card';
}

interface ChatRoom {
  id: string;
  matchId: string;
  name: string;
  participants: number;
  isActive: boolean;
}

type ChatEventCallback = (message: ChatMessage) => void;

class ChatService {
  private subscribers = new Map<string, Set<ChatEventCallback>>();
  private rooms = new Map<string, ChatRoom>();
  private messages = new Map<string, ChatMessage[]>();
  private simulatedUsers = [
    { id: '1', name: 'SportsFan⚽', avatar: 'https://ui-avatars.com/api/?name=SportsFan&background=4CAF50&color=fff' },
    { id: '2', name: 'MatchAnalyst📊', avatar: 'https://ui-avatars.com/api/?name=MatchAnalyst&background=2196F3&color=fff' },
    { id: '3', name: 'LiveViewer👀', avatar: 'https://ui-avatars.com/api/?name=LiveViewer&background=FF9800&color=fff' },
  ];

  initializeChatRoom(matchId: string, matchName: string): ChatRoom {
    const roomId = `match_${matchId}`;
    
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId)!;
    }

    const room: ChatRoom = {
      id: roomId,
      matchId,
      name: `${matchName} Live Chat`,
      participants: Math.floor(Math.random() * 2000) + 500,
      isActive: true,
    };

    this.rooms.set(roomId, room);
    this.messages.set(roomId, []);
    
    // Start simulated chat
    this.startSimulatedChat(roomId);
    
    console.log(`💬 Initialized chat room: ${matchName}`);
    return room;
  }

  subscribeToChatRoom(roomId: string, callback: ChatEventCallback): () => void {
    if (!this.subscribers.has(roomId)) {
      this.subscribers.set(roomId, new Set());
    }
    
    this.subscribers.get(roomId)!.add(callback);
    
    // Send some initial messages
    const recentMessages = this.getRecentMessages(roomId, 10);
    recentMessages.forEach(message => callback(message));
    
    return () => {
      this.subscribers.get(roomId)?.delete(callback);
    };
  }

  sendMessage(roomId: string, userId: string, username: string, message: string): void {
    const chatMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      matchId: this.rooms.get(roomId)?.matchId || '',
      userId,
      username,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=607D8B&color=fff`,
      message,
      timestamp: new Date().toISOString(),
      type: 'message',
    };

    if (!this.messages.has(roomId)) {
      this.messages.set(roomId, []);
    }

    const roomMessages = this.messages.get(roomId)!;
    roomMessages.push(chatMessage);
    
    // Keep only last 100 messages
    if (roomMessages.length > 100) {
      roomMessages.splice(0, roomMessages.length - 100);
    }

    this.notifySubscribers(roomId, chatMessage);
  }

  getRecentMessages(roomId: string, limit: number = 50): ChatMessage[] {
    const roomMessages = this.messages.get(roomId) || [];
    return roomMessages.slice(-limit);
  }

  getChatRoom(roomId: string): ChatRoom | null {
    return this.rooms.get(roomId) || null;
  }

  private startSimulatedChat(roomId: string): void {
    // Add initial messages
    const initialMessages = [
      'Welcome to the live chat! 🎉',
      'Great match today! ⚽',
      'Who do you think will win? 🤔',
    ];

    initialMessages.forEach((msg, index) => {
      setTimeout(() => {
        const user = this.simulatedUsers[index % this.simulatedUsers.length];
        this.sendMessage(roomId, user.id, user.name, msg);
      }, (index + 1) * 1000);
    });

    // Continue adding messages periodically
    const interval = setInterval(() => {
      if (!this.rooms.get(roomId)?.isActive) {
        clearInterval(interval);
        return;
      }

      const messages = [
        'This is exciting! 🔥',
        'What a play! 💪',
        'Come on! ⚽',
        'Amazing match! 👏',
      ];

      const randomUser = this.simulatedUsers[Math.floor(Math.random() * this.simulatedUsers.length)];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      this.sendMessage(roomId, randomUser.id, randomUser.name, randomMessage);
    }, 15000 + Math.random() * 10000); // 15-25 seconds
  }

  private notifySubscribers(roomId: string, message: ChatMessage): void {
    const subscribers = this.subscribers.get(roomId);
    if (subscribers) {
      subscribers.forEach(callback => callback(message));
    }
  }
}

export const chatService = new ChatService();
export type { ChatMessage, ChatRoom, ChatEventCallback }; 