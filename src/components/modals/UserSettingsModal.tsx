import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useDiscord } from '../../context/DiscordContext';
import { useAuth } from '../../context/AuthContext';
import { AvatarWithStatus } from '../common/AvatarWithStatus';
import { soundEffects } from '../../utils/audio';
import {
  X,
  Volume2,
  Mic,
  Camera,
  Shield,
  Palette,
  Check,
  Play,
  LogOut,
  Bell,
  Sparkles,
} from 'lucide-react';
import { UserStatus } from '../../types';

export const UserSettingsModal: React.FC = () => {
  const {
    isUserSettingsOpen,
    setIsUserSettingsOpen,
    currentUser,
    updateCurrentUser,
    setUserStatus,
    soundEnabled,
    toggleSoundEnabled,
  } = useDiscord();
  const { logOut } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'voice' | 'notifications'>('profile');
  const [username, setUsername] = useState(currentUser.username);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [customStatus, setCustomStatus] = useState(currentUser.customStatus || '');
  const [bannerColor, setBannerColor] = useState(currentUser.bannerColor || '#5865F2');
  const [savedNotice, setSavedNotice] = useState(false);
  const [micTesting, setMicTesting] = useState(false);

  if (!isUserSettingsOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUser({
      username,
      avatar,
      bio,
      customStatus,
      bannerColor,
    });
    setSavedNotice(true);
    soundEffects.play('click');
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const statusOptions: { value: UserStatus; label: string; color: string }[] = [
    { value: 'online', label: 'Online', color: 'bg-[#23a559]' },
    { value: 'idle', label: 'Idle', color: 'bg-[#f0b232]' },
    { value: 'dnd', label: 'Do Not Disturb', color: 'bg-[#f23f43]' },
    { value: 'offline', label: 'Invisible', color: 'bg-[#80848e]' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="fixed inset-0 z-50 bg-[#313338] flex overflow-hidden"
    >
      {/* Left Settings Sidebar */}
      <aside className="w-60 bg-[#2b2d31] flex flex-col justify-start items-end py-12 pr-6 shrink-0 border-r border-[#1f2023] select-none">
        <div className="w-48 space-y-4">
          <div className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider px-2">
            User Settings
          </div>
          <nav className="space-y-0.5">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'profile'
                  ? 'bg-[#3f4147] text-white'
                  : 'text-[#b5bac1] hover:bg-[#35373c] hover:text-[#dbdee1]'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Profiles</span>
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'voice'
                  ? 'bg-[#3f4147] text-white'
                  : 'text-[#b5bac1] hover:bg-[#35373c] hover:text-[#dbdee1]'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Voice & Audio</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'notifications'
                  ? 'bg-[#3f4147] text-white'
                  : 'text-[#b5bac1] hover:bg-[#35373c] hover:text-[#dbdee1]'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </button>
          </nav>
          <button
            onClick={logOut}
            className="w-full text-left px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 text-[#f23f43] hover:bg-[#f23f43]/10"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Settings Body */}
      <main className="flex-1 py-12 px-10 overflow-y-auto no-scrollbar relative max-w-4xl">
        {/* Close Button / ESC */}
        <div className="fixed right-10 top-12 flex flex-col items-center">
          <button
            onClick={() => setIsUserSettingsOpen(false)}
            className="w-9 h-9 rounded-full border-2 border-[#b5bac1] hover:border-white text-[#b5bac1] hover:text-white flex items-center justify-center transition-all cursor-pointer group"
          >
            <X className="w-5 h-5 transition-transform group-hover:scale-110" />
          </button>
          <span className="text-[11px] font-bold text-[#949ba4] mt-1 uppercase">ESC</span>
        </div>

        {/* Tab 1: Profiles */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-white">User Profile</h1>
              <p className="text-xs text-[#949ba4] mt-1">
                Customize your appearance, banner, and status across all servers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Form Controls */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-[#111214] rounded-md p-2 text-sm text-white focus:outline-none focus:border-[#5865F2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-1.5">
                    Avatar Image URL
                  </label>
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-[#111214] rounded-md p-2 text-sm text-white focus:outline-none focus:border-[#5865F2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-1.5">
                    Banner Color (Hex)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bannerColor}
                      onChange={(e) => setBannerColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border border-[#111214] bg-transparent"
                    />
                    <input
                      type="text"
                      value={bannerColor}
                      onChange={(e) => setBannerColor(e.target.value)}
                      className="flex-1 bg-[#1e1f22] border border-[#111214] rounded-md p-2 text-sm text-white focus:outline-none focus:border-[#5865F2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-1.5">
                    Custom Status
                  </label>
                  <input
                    type="text"
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    placeholder="What are you up to?"
                    className="w-full bg-[#1e1f22] border border-[#111214] rounded-md p-2 text-sm text-white focus:outline-none focus:border-[#5865F2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#b5bac1] uppercase mb-1.5">
                    About Me (Bio)
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full bg-[#1e1f22] border border-[#111214] rounded-md p-2 text-sm text-white focus:outline-none focus:border-[#5865F2] resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#23a559] hover:bg-[#1f934e] text-white font-semibold text-sm rounded transition-colors cursor-pointer shadow"
                  >
                    Save Changes
                  </button>
                  {savedNotice && (
                    <span className="flex items-center gap-1 text-xs text-[#23a559] font-semibold">
                      <Check className="w-4 h-4" /> Saved!
                    </span>
                  )}
                </div>
              </form>

              {/* Live Preview Card */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#b5bac1] uppercase">Preview</span>
                <div className="bg-[#232428] rounded-2xl overflow-hidden shadow-2xl border border-[#1f2023] max-w-sm">
                  {/* Banner */}
                  <div
                    className="h-28 w-full transition-colors"
                    style={{ backgroundColor: bannerColor }}
                  />

                  {/* Avatar & Badges */}
                  <div className="px-4 pb-4 relative">
                    <div className="absolute -top-12 left-4">
                      <AvatarWithStatus
                        src={avatar}
                        alt={username}
                        size="xl"
                        status={currentUser.status}
                      />
                    </div>

                    <div className="pt-10 space-y-3">
                      <div>
                        <h3 className="text-lg font-bold text-white leading-tight">{username}</h3>
                        <p className="text-xs text-[#949ba4]">#{currentUser.discriminator}</p>
                      </div>

                      {customStatus && (
                        <div className="text-xs text-[#dbdee1] bg-[#111214]/40 p-2 rounded-md">
                          {customStatus}
                        </div>
                      )}

                      <div className="h-[1px] bg-[#35373c]" />

                      <div>
                        <h4 className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider">
                          About Me
                        </h4>
                        <p className="text-xs text-[#dbdee1] mt-1 leading-relaxed">
                          {bio || 'No bio yet.'}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider">
                          Online Status
                        </h4>
                        <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                          {statusOptions.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setUserStatus(opt.value)}
                              className={`flex items-center gap-2 p-1.5 rounded text-xs text-left cursor-pointer transition-colors ${
                                currentUser.status === opt.value
                                  ? 'bg-[#35373c] text-white font-bold'
                                  : 'text-[#949ba4] hover:bg-[#2b2d31]'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                              <span>{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Voice & Audio */}
        {activeTab === 'voice' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h1 className="text-xl font-bold text-white">Voice & Audio Settings</h1>
              <p className="text-xs text-[#949ba4] mt-1">
                Configure your input and output audio levels and OpenChat sound effects.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#1f2023] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">OpenChat Sound Effects</h3>
                    <p className="text-xs text-[#949ba4]">
                      Plays synthesised chimes on message sent/received and voice join/mute.
                    </p>
                  </div>
                  <button
                    onClick={toggleSoundEnabled}
                    className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                      soundEnabled ? 'bg-[#23a559] text-white' : 'bg-[#35373c] text-[#80848e]'
                    }`}
                  >
                    {soundEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => soundEffects.play('messageSent')}
                    className="px-2.5 py-1 bg-[#1e1f22] hover:bg-[#35373c] rounded text-xs text-[#dbdee1] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3 h-3 text-[#5865F2]" /> Test Message Sound
                  </button>
                  <button
                    onClick={() => soundEffects.play('joinVoice')}
                    className="px-2.5 py-1 bg-[#1e1f22] hover:bg-[#35373c] rounded text-xs text-[#dbdee1] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3 h-3 text-[#23a559]" /> Test Voice Join
                  </button>
                </div>
              </div>

              {/* Mic Test */}
              <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#1f2023] space-y-3">
                <h3 className="text-sm font-semibold text-white">Mic Test</h3>
                <p className="text-xs text-[#949ba4]">
                  Check if your microphone audio is coming through clearly.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMicTesting(!micTesting)}
                    className={`px-4 py-2 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      micTesting
                        ? 'bg-[#f23f43] text-white'
                        : 'bg-[#5865F2] text-white hover:bg-[#4752c4]'
                    }`}
                  >
                    {micTesting ? 'Stop Testing' : "Let's Check"}
                  </button>

                  {/* Volume Level Meter Bar */}
                  <div className="flex-1 h-3 bg-[#1e1f22] rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        micTesting ? 'w-3/4 bg-[#23a559] animate-pulse' : 'w-0'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h1 className="text-xl font-bold text-white">Notifications</h1>
              <p className="text-xs text-[#949ba4] mt-1">
                Control notification sounds and badge counters.
              </p>
            </div>

            <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#1f2023] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Desktop Notifications</h3>
                  <p className="text-xs text-[#949ba4]">Show popups for incoming direct messages.</p>
                </div>
                <span className="text-xs font-semibold text-[#23a559]">Active</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </motion.div>
  );
};
