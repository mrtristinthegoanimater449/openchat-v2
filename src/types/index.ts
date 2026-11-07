export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface UserActivity {
  type: 'playing' | 'listening' | 'streaming' | 'watching';
  name: string;
  details?: string;
  state?: string;
  startedAt?: number;
}

export interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  status: UserStatus;
  customStatus?: string;
  activity?: UserActivity;
  bio?: string;
  bannerColor?: string;
  joinedAt?: string;
  badges?: string[];
}

export type ChannelType = 'text' | 'voice' | 'announcement' | 'stage';

export interface VoiceParticipant {
  user: User;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
  joinedAt: number;
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  topic?: string;
  unreadCount?: number;
  userLimit?: number;
  participants?: VoiceParticipant[];
}

export interface Category {
  id: string;
  name: string;
  channels: Channel[];
}

export interface ServerMember {
  user: User;
  roles: string[];
  joinedAt: string;
  isOwner?: boolean;
}

export interface Server {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  ownerId: string;
  banner?: string;
  categories: Category[];
  members: ServerMember[];
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size?: string;
  type: 'image' | 'video' | 'audio' | 'file';
  width?: number;
  height?: number;
}

export interface Message {
  id: string;
  channelId: string;
  author: User;
  content: string;
  timestamp: string;
  pinned?: boolean;
  attachments?: Attachment[];
  reactions?: Reaction[];
  replyTo?: {
    id: string;
    author: User;
    content: string;
  };
}

export interface Friend {
  id: string;
  user: User;
  status: 'friend' | 'pending' | 'blocked';
  unreadCount?: number;
  lastInteraction?: string;
}

export interface VoiceState {
  channelId: string | null;
  serverId: string | null;
  isMuted: boolean;
  isDeafened: boolean;
  isScreenSharing: boolean;
  isVideoEnabled: boolean;
  isSpeaking: boolean;
  latencyMs: number;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  thumbnail?: string;
  audioUrl?: string;
}
