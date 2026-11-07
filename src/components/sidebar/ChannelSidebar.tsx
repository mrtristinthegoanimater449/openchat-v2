import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useDiscord } from '../../context/DiscordContext';
import { AvatarWithStatus } from '../common/AvatarWithStatus';
import {
  Hash,
  Volume2,
  Megaphone,
  ChevronDown,
  ChevronRight,
  Plus,
  Settings,
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  UserPlus,
  Users,
  Search,
  Radio,
  Music,
  Play,
  Pause,
  SkipForward,
  X,
  ShieldCheck,
} from 'lucide-react';

export const ChannelSidebar: React.FC = () => {
  const {
    activeServerId,
    activeServer,
    activeChannelId,
    setActiveChannelId,
    friends,
    activeDmFriendId,
    setActiveDmFriendId,
    currentUser,
    voiceState,
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMute,
    toggleDeafen,
    setIsUserSettingsOpen,
    setIsCreateChannelOpen,
    setIsInviteModalOpen,
    setActiveProfileUser,
    musicPlayer,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useDiscord();

  const [serverMenuOpen, setServerMenuOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleChannelClick = (channel: any) => {
    setActiveChannelId(channel.id);
    if (channel.type === 'voice' && activeServerId) {
      joinVoiceChannel(activeServerId, channel.id);
    }
    // Auto-close on mobile
    setMobileSidebarOpen(false);
  };

  const handleSelectDmFriend = (friendId: string) => {
    setActiveDmFriendId(friendId);
    setMobileSidebarOpen(false);
  };

  return (
    <aside
      className={`w-60 bg-[#2b2d31] flex flex-col h-full shrink-0 select-none z-20 ${
        mobileSidebarOpen ? 'fixed left-[72px] top-0 bottom-0 shadow-2xl' : 'hidden md:flex'
      }`}
    >
      {/* Top Header */}
      {activeServer ? (
        <div className="relative">
          <button
            onClick={() => setServerMenuOpen(!serverMenuOpen)}
            className="w-full h-12 px-4 flex items-center justify-between border-b border-[#1f2023] hover:bg-[#35373c]/60 transition-colors font-semibold text-white shadow-sm cursor-pointer"
          >
            <span className="truncate text-[15px] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#5865F2] shrink-0" />
              {activeServer.name}
            </span>
            {serverMenuOpen ? (
              <X className="w-4 h-4 text-[#b5bac1]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#b5bac1]" />
            )}
          </button>

          {/* Server Dropdown Menu */}
          {serverMenuOpen && (
            <div className="absolute top-13 left-2 right-2 bg-[#111214] border border-[#232428] rounded-md p-1.5 shadow-2xl z-50 flex flex-col gap-0.5">
              <button
                onClick={() => {
                  setIsInviteModalOpen(true);
                  setServerMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs text-[#5865F2] hover:bg-[#5865F2] hover:text-white rounded flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Invite People</span>
                <UserPlus className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsCreateChannelOpen(true);
                  setServerMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs text-[#dbdee1] hover:bg-[#5865F2] hover:text-white rounded flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Create Channel</span>
                <Plus className="w-4 h-4" />
              </button>
              <div className="h-[1px] bg-[#232428] my-1" />
              <button
                onClick={() => {
                  setIsUserSettingsOpen(true);
                  setServerMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs text-[#dbdee1] hover:bg-[#35373c] rounded flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Server Settings</span>
                <Settings className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Direct Messages Header */
        <div className="h-12 px-3 flex items-center border-b border-[#1f2023] shadow-sm">
          <button
            onClick={() => setActiveDmFriendId(null)}
            className="w-full h-7 px-2 bg-[#1e1f22] text-[#949ba4] hover:text-[#dbdee1] rounded flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Find or start a conversation</span>
          </button>
        </div>
      )}

      {/* Main Channel or DM List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 no-scrollbar">
        {activeServer ? (
          /* Server Categories & Channels */
          activeServer.categories.map((category) => {
            const isCollapsed = collapsedCategories[category.id];
            return (
              <div key={category.id} className="space-y-0.5">
                {/* Category Header */}
                <div className="flex items-center justify-between px-1 py-1 text-[#949ba4] hover:text-[#dbdee1] text-[11px] font-bold tracking-wider group cursor-pointer">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="flex items-center gap-1 flex-1 text-left uppercase truncate"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-3 h-3 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3 h-3 shrink-0" />
                    )}
                    <span className="truncate">{category.name}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCreateChannelOpen(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity p-0.5 rounded cursor-pointer"
                    title="Create Channel"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Channel List */}
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {category.channels.map((channel) => {
                      const isActive = activeChannelId === channel.id;
                      const isVoice = channel.type === 'voice' || channel.type === 'stage';
                      const isConnectedVoice = voiceState.channelId === channel.id;

                      return (
                        <div key={channel.id} className="space-y-0.5">
                          <motion.button
                            layout
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            onClick={() => handleChannelClick(channel)}
                            className={`w-full group px-2 py-1.5 rounded-md flex items-center justify-between text-[14px] font-medium transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-[#35373c] text-white'
                                : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              {channel.type === 'text' && (
                                <Hash className="w-4 h-4 text-[#80848e] shrink-0" />
                              )}
                              {channel.type === 'announcement' && (
                                <Megaphone className="w-4 h-4 text-[#80848e] shrink-0" />
                              )}
                              {isVoice && (
                                <Volume2
                                  className={`w-4 h-4 shrink-0 ${
                                    isConnectedVoice ? 'text-[#23a559]' : 'text-[#80848e]'
                                  }`}
                                />
                              )}
                              <span className="truncate">{channel.name}</span>
                            </div>

                            {/* Unread badge */}
                            {channel.unreadCount && channel.unreadCount > 0 ? (
                              <span className="bg-[#f23f43] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                {channel.unreadCount}
                              </span>
                            ) : null}
                          </motion.button>

                          {/* Connected Voice Participants List */}
                          {isVoice && channel.participants && channel.participants.length > 0 && (
                            <div className="pl-6 space-y-1 py-1">
                              {channel.participants.map((part) => (
                                <div
                                  key={part.user.id}
                                  onClick={() => setActiveProfileUser(part.user)}
                                  className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#35373c]/40 text-xs text-[#dbdee1] cursor-pointer group"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <AvatarWithStatus
                                      src={part.user.avatar}
                                      alt={part.user.username}
                                      size="xs"
                                      isSpeaking={part.isSpeaking}
                                    />
                                    <span className="truncate">{part.user.username}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-[#80848e]">
                                    {part.isMuted && <MicOff className="w-3 h-3 text-[#f23f43]" />}
                                    {part.isDeafened && (
                                      <Headphones className="w-3 h-3 text-[#f23f43]" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          /* Direct Messages View */
          <div className="space-y-4">
            {/* Friends Hub button */}
            <button
              onClick={() => setActiveDmFriendId(null)}
              className={`w-full px-3 py-2 rounded-md flex items-center justify-between text-sm font-medium transition-colors cursor-pointer ${
                activeDmFriendId === null
                  ? 'bg-[#35373c] text-white'
                  : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#80848e]" />
                <span>Friends</span>
              </div>
              <span className="bg-[#5865F2] text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                {friends.filter((f) => f.user.status === 'online').length}
              </span>
            </button>

            {/* DM List Header */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 text-[11px] font-bold text-[#949ba4] uppercase tracking-wider">
                <span>Direct Messages</span>
                <button
                  onClick={() => setActiveDmFriendId(null)}
                  className="hover:text-white cursor-pointer"
                  title="Create DM"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {friends.map((friend) => {
                const isActive = activeDmFriendId === friend.id;
                return (
                  <button
                    key={friend.id}
                    onClick={() => handleSelectDmFriend(friend.id)}
                    className={`w-full px-2 py-1.5 rounded-md flex items-center justify-between group transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#35373c] text-white'
                        : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <AvatarWithStatus
                        src={friend.user.avatar}
                        alt={friend.user.username}
                        size="sm"
                        status={friend.user.status}
                      />
                      <div className="flex flex-col text-left truncate">
                        <span className="text-sm font-medium leading-tight truncate">
                          {friend.user.username}
                        </span>
                        {friend.user.activity ? (
                          <span className="text-[11px] text-[#80848e] truncate">
                            {friend.user.activity.type === 'listening'
                              ? `🎵 ${friend.user.activity.name}`
                              : `🎮 ${friend.user.activity.name}`}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#80848e] truncate">
                            {friend.user.customStatus || friend.user.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {friend.unreadCount && friend.unreadCount > 0 ? (
                      <span className="bg-[#f23f43] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        {friend.unreadCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Active Voice Connection Bar (if connected to voice) */}
      {voiceState.channelId && (
        <div className="bg-[#111214] border-t border-[#1f2023] px-3 py-2 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#23a559] animate-pulse" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#23a559] leading-none">
                  Voice Connected
                </span>
                <span className="text-[11px] text-[#949ba4] leading-tight">
                  RTC Connecting / {voiceState.latencyMs}ms
                </span>
              </div>
            </div>
            <button
              onClick={leaveVoiceChannel}
              className="p-1 text-[#f23f43] hover:bg-[#f23f43]/10 rounded transition-colors cursor-pointer"
              title="Disconnect"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Music Bot Mini Player (OpenSongs feature integration) */}
      {musicPlayer.currentTrack && (
        <div className="bg-[#1e1f22] border-t border-[#1f2023] px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <div className="w-8 h-8 rounded bg-[#5865F2]/20 text-[#5865F2] flex items-center justify-center shrink-0">
              <Music className="w-4 h-4" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-white truncate">
                {musicPlayer.currentTrack.title}
              </span>
              <span className="text-[10px] text-[#949ba4] truncate">
                {musicPlayer.currentTrack.artist}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={musicPlayer.togglePlay}
              className="p-1 text-[#dbdee1] hover:text-white rounded hover:bg-[#35373c] cursor-pointer"
              title={musicPlayer.isPlaying ? 'Pause' : 'Play'}
            >
              {musicPlayer.isPlaying ? (
                <Pause className="w-4 h-4 text-[#23a559]" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={musicPlayer.nextTrack}
              className="p-1 text-[#dbdee1] hover:text-white rounded hover:bg-[#35373c] cursor-pointer"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom User Profile Bar */}
      <div className="h-14 bg-[#232428] px-2 flex items-center justify-between shrink-0">
        <button
          onClick={() => setActiveProfileUser(currentUser)}
          className="flex items-center gap-2 p-1 -ml-1 rounded-md hover:bg-[#35373c]/50 transition-colors cursor-pointer group text-left truncate"
        >
          <AvatarWithStatus
            src={currentUser.avatar}
            alt={currentUser.username}
            size="sm"
            status={currentUser.status}
          />
          <div className="flex flex-col truncate">
            <span className="text-[13px] font-bold text-white leading-tight truncate">
              {currentUser.username}
            </span>
            <span className="text-[11px] text-[#949ba4] leading-tight truncate">
              #{currentUser.discriminator}
            </span>
          </div>
        </button>

        {/* Quick Voice / Settings controls */}
        <div className="flex items-center gap-0.5 text-[#b5bac1]">
          <button
            onClick={toggleMute}
            className={`p-1.5 rounded hover:bg-[#35373c] hover:text-[#dbdee1] transition-colors cursor-pointer ${
              voiceState.isMuted ? 'text-[#f23f43]' : ''
            }`}
            title={voiceState.isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {voiceState.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleDeafen}
            className={`p-1.5 rounded hover:bg-[#35373c] hover:text-[#dbdee1] transition-colors cursor-pointer ${
              voiceState.isDeafened ? 'text-[#f23f43]' : ''
            }`}
            title={voiceState.isDeafened ? 'Undeafen' : 'Deafen'}
          >
            <Headphones
              className={`w-4 h-4 ${voiceState.isDeafened ? 'text-[#f23f43]' : ''}`}
            />
          </button>
          <button
            onClick={() => setIsUserSettingsOpen(true)}
            className="p-1.5 rounded hover:bg-[#35373c] hover:text-[#dbdee1] transition-colors cursor-pointer"
            title="User Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
