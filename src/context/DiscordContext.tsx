import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import {
  User,
  Server,
  Channel,
  Message,
  Friend,
  VoiceState,
  MusicTrack,
  UserStatus,
  Reaction,
} from '../types';
import {
  CURRENT_USER,
  INITIAL_SERVERS,
  INITIAL_FRIENDS,
  INITIAL_MESSAGES,
  POPULAR_TRACKS,
} from '../data/initialData';
import { soundEffects } from '../utils/audio';

interface DiscordContextType {
  currentUser: User;
  updateCurrentUser: (updates: Partial<User>) => void;
  setUserStatus: (status: UserStatus, customStatus?: string) => void;

  servers: Server[];
  activeServerId: string | null; // null represents DMs / Home / Friends view
  activeServer: Server | null;
  setActiveServerId: (id: string | null) => void;

  activeChannelId: string | null;
  activeChannel: Channel | null;
  setActiveChannelId: (id: string | null) => void;

  friends: Friend[];
  activeDmFriendId: string | null;
  activeDmFriend: Friend | null;
  setActiveDmFriendId: (friendId: string | null) => void;
  addFriend: (usernameWithTag: string) => { success: boolean; message: string };
  removeFriend: (friendId: string) => void;

  messages: Record<string, Message[]>;
  currentMessages: Message[];
  sendMessage: (content: string, attachments?: any[], replyTo?: Message['replyTo']) => void;
  addReaction: (messageId: string, emoji: string) => void;
  togglePinMessage: (messageId: string) => void;
  deleteMessage: (messageId: string) => void;

  voiceState: VoiceState;
  joinVoiceChannel: (serverId: string, channelId: string) => void;
  leaveVoiceChannel: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  toggleScreenShare: () => void;
  toggleVideo: () => void;

  musicPlayer: {
    currentTrack: MusicTrack | null;
    isPlaying: boolean;
    volume: number;
    playlist: MusicTrack[];
    playTrack: (track: MusicTrack) => void;
    togglePlay: () => void;
    setVolume: (v: number) => void;
    nextTrack: () => void;
  };

  // Modals & UI Toggles
  isMemberListOpen: boolean;
  toggleMemberList: () => void;
  isUserSettingsOpen: boolean;
  setIsUserSettingsOpen: (open: boolean) => void;
  isCreateServerOpen: boolean;
  setIsCreateServerOpen: (open: boolean) => void;
  isCreateChannelOpen: boolean;
  setIsCreateChannelOpen: (open: boolean) => void;
  isInviteModalOpen: boolean;
  setIsInviteModalOpen: (open: boolean) => void;
  activeProfileUser: User | null;
  setActiveProfileUser: (user: User | null) => void;
  activeLightboxImage: string | null;
  setActiveLightboxImage: (url: string | null) => void;
  soundEnabled: boolean;
  toggleSoundEnabled: () => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  mobileMembersOpen: boolean;
  setMobileMembersOpen: (open: boolean) => void;

  // Server & Channel Management
  createServer: (name: string, iconUrl?: string) => Server;
  createChannel: (serverId: string, categoryId: string, name: string, type: 'text' | 'voice') => void;
  deleteChannel: (serverId: string, channelId: string) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // DMs: id of the friend user who is currently "typing" a simulated reply
  dmTypingUserId: string | null;
}

const DiscordContext = createContext<DiscordContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'discord_openchat_user',
  SERVERS: 'discord_openchat_servers',
  MESSAGES: 'discord_openchat_messages',
  FRIENDS: 'discord_openchat_friends',
  ACTIVE_SERVER: 'discord_openchat_active_server',
  ACTIVE_CHANNEL: 'discord_openchat_active_channel',
  ACTIVE_DM: 'discord_openchat_active_dm',
  SOUND_ENABLED: 'discord_openchat_sound',
};

export const DiscordProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Current User
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : CURRENT_USER;
    } catch {
      return CURRENT_USER;
    }
  });

  // 2. Servers
  const [servers, setServers] = useState<Server[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SERVERS);
      return saved ? JSON.parse(saved) : INITIAL_SERVERS;
    } catch {
      return INITIAL_SERVERS;
    }
  });

  // 3. Navigation
  const [activeServerId, setActiveServerId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_SERVER);
      return saved !== null ? saved : null;
    } catch {
      return null;
    }
  });

  const [activeChannelId, setActiveChannelId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_CHANNEL);
      return saved !== null ? saved : null;
    } catch {
      return null;
    }
  });

  const [activeDmFriendId, setActiveDmFriendId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_DM) || null;
    } catch {
      return null;
    }
  });

  // 4. Friends
  const [friends, setFriends] = useState<Friend[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FRIENDS);
      return saved ? JSON.parse(saved) : INITIAL_FRIENDS;
    } catch {
      return INITIAL_FRIENDS;
    }
  });

  // 5. Messages
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  // 6. Voice State
  const [voiceState, setVoiceState] = useState<VoiceState>({
    channelId: null,
    serverId: null,
    isMuted: false,
    isDeafened: false,
    isScreenSharing: false,
    isVideoEnabled: false,
    isSpeaking: false,
    latencyMs: 18,
  });

  // 7. Music Player
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(POPULAR_TRACKS[0] ?? null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.7);

  // 8. UI Modals
  const [isMemberListOpen, setIsMemberListOpen] = useState<boolean>(true);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState<boolean>(false);
  const [isCreateServerOpen, setIsCreateServerOpen] = useState<boolean>(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState<boolean>(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [activeProfileUser, setActiveProfileUser] = useState<User | null>(null);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const s = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
    return s !== 'false';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [mobileMembersOpen, setMobileMembersOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dmTypingUserId, setDmTypingUserId] = useState<string | null>(null);

  // ---- Server state sync (all data flows through /api/state) ----
  const syncPulledRef = useRef(false);
  const syncTimerRef = useRef<number | null>(null);

  // Pull authoritative state from server on mount
  useEffect(() => {
    const token = localStorage.getItem('openchat_token');
    if (!token) {
      syncPulledRef.current = true; // no backend login → local-only mode, pushes are skipped anyway
      return;
    }
    fetch('/api/state', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const state = data?.state;
        if (state) {
          if (Array.isArray(state.servers)) setServers(state.servers);
          if (state.messages && typeof state.messages === 'object') setMessages(state.messages);
          if (Array.isArray(state.friends)) setFriends(state.friends);
        }
        syncPulledRef.current = true;
      })
      .catch(() => {
        syncPulledRef.current = true; // offline → allow pushes to proceed (best effort)
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push state to server, debounced, after pull completes
  useEffect(() => {
    if (!syncPulledRef.current) return;
    const token = localStorage.getItem('openchat_token');
    if (!token) return;
    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(() => {
      fetch('/api/state', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          state: { servers, messages, friends, activeServerId, activeChannelId },
        }),
      }).catch(() => {});
    }, 800);
    return () => {
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    };
  }, [servers, messages, friends, activeServerId, activeChannelId]);

  // Sync sound utility
  useEffect(() => {
    soundEffects.setEnabled(soundEnabled);
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(soundEnabled));
  }, [soundEnabled]);

  // Persist essentials
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } catch (e) {
      console.warn('Failed to save user', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVERS, JSON.stringify(servers));
    } catch (e) {
      console.warn('Failed to save servers', e);
    }
  }, [servers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save messages', e);
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(friends));
    } catch (e) {
      console.warn('Failed to save friends', e);
    }
  }, [friends]);

  useEffect(() => {
    if (activeServerId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SERVER, activeServerId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SERVER);
    }
  }, [activeServerId]);

  useEffect(() => {
    if (activeChannelId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CHANNEL, activeChannelId);
    }
  }, [activeChannelId]);

  useEffect(() => {
    if (activeDmFriendId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_DM, activeDmFriendId);
    }
  }, [activeDmFriendId]);

  // Derived Active Server & Channel
  const activeServer = useMemo(() => {
    if (!activeServerId) return null;
    return servers.find((s) => s.id === activeServerId) || null;
  }, [servers, activeServerId]);

  const activeChannel = useMemo(() => {
    if (!activeServer) return null;
    for (const cat of activeServer.categories) {
      const found = cat.channels.find((c) => c.id === activeChannelId);
      if (found) return found;
    }
    // Default to first channel if not found
    return activeServer.categories[0]?.channels[0] || null;
  }, [activeServer, activeChannelId]);

  const activeDmFriend = useMemo(() => {
    return friends.find((f) => f.id === activeDmFriendId) || null;
  }, [friends, activeDmFriendId]);

  // Active messages
  const activeMessageKey = useMemo(() => {
    if (activeServerId) {
      return activeChannelId || '';
    }
    if (activeDmFriend) {
      return `dm-${activeDmFriend.user.id}`;
    }
    return '';
  }, [activeServerId, activeChannelId, activeDmFriend]);

  const currentMessages = useMemo(() => {
    if (!activeMessageKey) return [];
    return messages[activeMessageKey] || [];
  }, [messages, activeMessageKey]);

  // User Actions
  const updateCurrentUser = (updates: Partial<User>) => {
    setCurrentUser((prev) => ({ ...prev, ...updates }));
  };

  const setUserStatus = (status: UserStatus, customStatus?: string) => {
    setCurrentUser((prev) => ({
      ...prev,
      status,
      customStatus: customStatus !== undefined ? customStatus : prev.customStatus,
    }));
  };

  // Chat Actions
  const sendMessage = (content: string, attachments?: any[], replyTo?: Message['replyTo']) => {
    if (!activeMessageKey) return;
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      channelId: activeMessageKey,
      author: currentUser,
      content: content.trim(),
      timestamp: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments,
      replyTo,
      reactions: [],
    };

    setMessages((prev) => ({
      ...prev,
      [activeMessageKey]: [...(prev[activeMessageKey] || []), newMessage],
    }));

    soundEffects.play('messageSent');

    // Simulate occasional friendly bot or friend response in DMs or general
    if (!activeServerId && activeDmFriend) {
      setDmTypingUserId(activeDmFriend.user.id);
      setTimeout(() => {
        setDmTypingUserId(null);
        const replies = [
          "That's awesome! Discord UI is so much smoother now.",
          "Totally agree! Have you tested the voice channels yet?",
          "Looks great on my end! 🔥",
          "Working on a couple of design tweaks, will share in a bit!",
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const replyMsg: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          channelId: activeMessageKey,
          author: activeDmFriend.user,
          content: randomReply,
          timestamp: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reactions: [],
        };
        setMessages((prev) => ({
          ...prev,
          [activeMessageKey]: [...(prev[activeMessageKey] || []), replyMsg],
        }));
        soundEffects.play('messageReceived');
      }, 1400);
    }
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (!activeMessageKey) return;
    setMessages((prev) => {
      const channelMsgs = prev[activeMessageKey] || [];
      const updated = channelMsgs.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = m.reactions ? [...m.reactions] : [];
        const existingIdx = reactions.findIndex((r) => r.emoji === emoji);

        if (existingIdx >= 0) {
          const r = reactions[existingIdx];
          const hasReacted = r.users.includes(currentUser.id);
          if (hasReacted) {
            // Remove user reaction
            const newUsers = r.users.filter((u) => u !== currentUser.id);
            if (newUsers.length === 0) {
              reactions.splice(existingIdx, 1);
            } else {
              reactions[existingIdx] = { ...r, count: r.count - 1, users: newUsers };
            }
          } else {
            // Add user reaction
            reactions[existingIdx] = {
              ...r,
              count: r.count + 1,
              users: [...r.users, currentUser.id],
            };
          }
        } else {
          // New emoji reaction
          reactions.push({
            emoji,
            count: 1,
            users: [currentUser.id],
          });
        }
        return { ...m, reactions };
      });
      return { ...prev, [activeMessageKey]: updated };
    });
    soundEffects.play('click');
  };

  const togglePinMessage = (messageId: string) => {
    if (!activeMessageKey) return;
    setMessages((prev) => {
      const channelMsgs = prev[activeMessageKey] || [];
      const updated = channelMsgs.map((m) => {
        if (m.id !== messageId) return m;
        return { ...m, pinned: !m.pinned };
      });
      return { ...prev, [activeMessageKey]: updated };
    });
  };

  const deleteMessage = (messageId: string) => {
    if (!activeMessageKey) return;
    setMessages((prev) => {
      const channelMsgs = prev[activeMessageKey] || [];
      return {
        ...prev,
        [activeMessageKey]: channelMsgs.filter((m) => m.id !== messageId),
      };
    });
  };

  // Voice Channel Actions
  const joinVoiceChannel = (serverId: string, channelId: string) => {
    // If already in this channel, don't re-join
    if (voiceState.channelId === channelId) return;

    soundEffects.play('joinVoice');

    // Update server participant list
    setServers((prevServers) =>
      prevServers.map((server) => {
        const updatedCats = server.categories.map((cat) => ({
          ...cat,
          channels: cat.channels.map((chan) => {
            // Remove from any prior voice channel
            let parts = chan.participants?.filter((p) => p.user.id !== currentUser.id) || [];
            // If this is the joined channel, add current user
            if (chan.id === channelId) {
              parts = [
                ...parts,
                {
                  user: currentUser,
                  isMuted: voiceState.isMuted,
                  isDeafened: voiceState.isDeafened,
                  isSpeaking: false,
                  isScreenSharing: false,
                  joinedAt: Date.now(),
                },
              ];
            }
            return { ...chan, participants: parts };
          }),
        }));
        return { ...server, categories: updatedCats };
      })
    );

    setVoiceState((prev) => ({
      ...prev,
      channelId,
      serverId,
      isSpeaking: false,
    }));
  };

  const leaveVoiceChannel = () => {
    if (!voiceState.channelId) return;
    soundEffects.play('leaveVoice');

    // Remove user from channel participants
    setServers((prevServers) =>
      prevServers.map((server) => {
        const updatedCats = server.categories.map((cat) => ({
          ...cat,
          channels: cat.channels.map((chan) => {
            if (chan.id === voiceState.channelId) {
              return {
                ...chan,
                participants: chan.participants?.filter((p) => p.user.id !== currentUser.id) || [],
              };
            }
            return chan;
          }),
        }));
        return { ...server, categories: updatedCats };
      })
    );

    setVoiceState((prev) => ({
      ...prev,
      channelId: null,
      serverId: null,
      isScreenSharing: false,
      isVideoEnabled: false,
      isSpeaking: false,
    }));
  };

  const toggleMute = () => {
    setVoiceState((prev) => {
      const nextMute = !prev.isMuted;
      if (nextMute) {
        soundEffects.play('mute');
      } else {
        soundEffects.play('unmute');
      }
      return { ...prev, isMuted: nextMute };
    });
  };

  const toggleDeafen = () => {
    setVoiceState((prev) => {
      const nextDeafen = !prev.isDeafened;
      if (nextDeafen) {
        soundEffects.play('mute');
      } else {
        soundEffects.play('unmute');
      }
      return {
        ...prev,
        isDeafened: nextDeafen,
        isMuted: nextDeafen ? true : prev.isMuted,
      };
    });
  };

  const toggleScreenShare = () => {
    setVoiceState((prev) => ({ ...prev, isScreenSharing: !prev.isScreenSharing }));
    soundEffects.play('click');
  };

  const toggleVideo = () => {
    setVoiceState((prev) => ({ ...prev, isVideoEnabled: !prev.isVideoEnabled }));
    soundEffects.play('click');
  };

  // Music Player
  const playTrack = (track: MusicTrack) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    soundEffects.play('click');
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
    soundEffects.play('click');
  };

  const nextTrack = () => {
    if (!currentTrack) return;
    if (POPULAR_TRACKS.length === 0) return;
    const idx = POPULAR_TRACKS.findIndex((t) => t.id === currentTrack.id);
    const next = POPULAR_TRACKS[(idx + 1) % POPULAR_TRACKS.length];
    setCurrentTrack(next);
  };

  // Friends Hub
  const addFriend = (usernameWithTag: string): { success: boolean; message: string } => {
    const trimmed = usernameWithTag.trim();
    if (!trimmed) {
      return { success: false, message: 'Please enter a valid username.' };
    }

    // Check if already friends
    const exists = friends.some(
      (f) =>
        f.user.username.toLowerCase() === trimmed.toLowerCase() ||
        `${f.user.username}#${f.user.discriminator}`.toLowerCase() === trimmed.toLowerCase()
    );

    if (exists) {
      return { success: false, message: 'You are already friends with that user!' };
    }

    // Create new friend
    const cleanName = trimmed.split('#')[0];
    const newFriendUser: User = {
      id: `user-${Date.now()}`,
      username: cleanName,
      discriminator: Math.floor(1000 + Math.random() * 9000).toString(),
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      status: 'online',
      customStatus: 'Just joined OpenChat!',
      bio: 'New member connected via Friends Hub.',
      bannerColor: '#5865F2',
      joinedAt: 'Today',
      badges: [],
    };

    const newFriend: Friend = {
      id: `friend-${Date.now()}`,
      user: newFriendUser,
      status: 'friend',
      unreadCount: 0,
      lastInteraction: 'Just now',
    };

    setFriends((prev) => [newFriend, ...prev]);
    soundEffects.play('messageReceived');
    return { success: true, message: `Friend request sent to ${trimmed}!` };
  };

  const removeFriend = (friendId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
    if (activeDmFriendId === friendId) {
      setActiveDmFriendId(null);
    }
  };

  // Server & Channel Management
  const createServer = (name: string, iconUrl?: string): Server => {
    const newServer: Server = {
      id: `server-${Date.now()}`,
      name: name.trim() || 'My Community',
      icon: iconUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=128&auto=format&fit=crop&q=80',
      description: 'A cozy new server created on OpenChat.',
      ownerId: currentUser.id,
      categories: [
        {
          id: `cat-${Date.now()}-1`,
          name: 'TEXT CHANNELS',
          channels: [
            {
              id: `chan-${Date.now()}-general`,
              name: 'general',
              type: 'text',
              topic: 'Welcome to your brand new server!',
              unreadCount: 0,
            },
          ],
        },
        {
          id: `cat-${Date.now()}-2`,
          name: 'VOICE CHANNELS',
          channels: [
            {
              id: `chan-${Date.now()}-voice`,
              name: 'General Lounge',
              type: 'voice',
              participants: [],
            },
          ],
        },
      ],
      members: [
        {
          user: currentUser,
          roles: ['Owner', 'Admin'],
          joinedAt: 'Today',
          isOwner: true,
        },
      ],
    };

    setServers((prev) => [...prev, newServer]);
    setActiveServerId(newServer.id);
    setActiveChannelId(newServer.categories[0].channels[0].id);
    soundEffects.play('joinVoice');
    return newServer;
  };

  const createChannel = (
    serverId: string,
    categoryId: string,
    name: string,
    type: 'text' | 'voice'
  ) => {
    const cleanName = name.toLowerCase().replace(/\s+/g, '-');
    const newChan: Channel = {
      id: `chan-${Date.now()}-${cleanName}`,
      name: cleanName,
      type,
      topic: `Discussion in #${cleanName}`,
      unreadCount: 0,
      participants: type === 'voice' ? [] : undefined,
    };

    setServers((prevServers) =>
      prevServers.map((srv) => {
        if (srv.id !== serverId) return srv;
        const newCats = srv.categories.map((cat) => {
          if (cat.id !== categoryId) return cat;
          return {
            ...cat,
            channels: [...cat.channels, newChan],
          };
        });
        return { ...srv, categories: newCats };
      })
    );

    setActiveChannelId(newChan.id);
    soundEffects.play('click');
  };

  const deleteChannel = (serverId: string, channelId: string) => {
    setServers((prevServers) =>
      prevServers.map((srv) => {
        if (srv.id !== serverId) return srv;
        const newCats = srv.categories.map((cat) => ({
          ...cat,
          channels: cat.channels.filter((c) => c.id !== channelId),
        }));
        return { ...srv, categories: newCats };
      })
    );

    if (activeChannelId === channelId) {
      // Pick first channel in first category
      const target = servers.find((s) => s.id === serverId);
      if (target && target.categories[0]?.channels[0]) {
        setActiveChannelId(target.categories[0].channels[0].id);
      }
    }
  };

  const toggleMemberList = () => {
    setIsMemberListOpen((prev) => !prev);
  };

  const toggleSoundEnabled = () => {
    setSoundEnabled((prev) => !prev);
  };

  return (
    <DiscordContext.Provider
      value={{
        currentUser,
        updateCurrentUser,
        setUserStatus,
        servers,
        activeServerId,
        activeServer,
        setActiveServerId,
        activeChannelId,
        activeChannel,
        setActiveChannelId,
        friends,
        activeDmFriendId,
        activeDmFriend,
        setActiveDmFriendId,
        addFriend,
        removeFriend,
        messages,
        currentMessages,
        sendMessage,
        addReaction,
        togglePinMessage,
        deleteMessage,
        voiceState,
        joinVoiceChannel,
        leaveVoiceChannel,
        toggleMute,
        toggleDeafen,
        toggleScreenShare,
        toggleVideo,
        musicPlayer: {
          currentTrack,
          isPlaying,
          volume,
          playlist: POPULAR_TRACKS,
          playTrack,
          togglePlay,
          setVolume,
          nextTrack,
        },
        isMemberListOpen,
        toggleMemberList,
        isUserSettingsOpen,
        setIsUserSettingsOpen,
        isCreateServerOpen,
        setIsCreateServerOpen,
        isCreateChannelOpen,
        setIsCreateChannelOpen,
        isInviteModalOpen,
        setIsInviteModalOpen,
        activeProfileUser,
        setActiveProfileUser,
        activeLightboxImage,
        setActiveLightboxImage,
        soundEnabled,
        toggleSoundEnabled,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        mobileMembersOpen,
        setMobileMembersOpen,
        createServer,
        createChannel,
        deleteChannel,
        searchQuery,
        setSearchQuery,
        dmTypingUserId,
      }}
    >
      {children}
    </DiscordContext.Provider>
  );
};

export const useDiscord = () => {
  const context = useContext(DiscordContext);
  if (!context) {
    throw new Error('useDiscord must be used within a DiscordProvider');
  }
  return context;
};
