export interface Conversation {
  id: string;
  userFirstId: string;
  userSecondId: string;
  createdAt: Date;
  lastMessageAt?: Date;
}

export interface Message {
  conversationId: string;
  recipientId: string;
  senderId: string;
  content: string;
  nonce: string;
  createdAt: Date;
}
