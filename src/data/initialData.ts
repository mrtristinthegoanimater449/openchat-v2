import { Server, User, Friend, MusicTrack, Message } from '../types';

// Current user identity (kept — the app needs a local identity).
export const CURRENT_USER: User = {
  id: 'user-me',
  username: 'MrTristin',
  discriminator: '0001',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  status: 'online',
  customStatus: '',
  bio: '',
  bannerColor: '#5865F2',
  joinedAt: 'Today',
  badges: [],
};

// Mock/seed data removed — the app starts empty.
export const MOCK_USERS: Record<string, User> = {};
export const INITIAL_FRIENDS: Friend[] = [];
export const INITIAL_SERVERS: Server[] = [];
export const INITIAL_MESSAGES: Record<string, Message[]> = {};
export const POPULAR_TRACKS: MusicTrack[] = [];
