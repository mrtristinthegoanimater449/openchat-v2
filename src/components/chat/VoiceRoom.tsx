import React from 'react';
import { motion } from 'motion/react';
import { useDiscord } from '../../context/DiscordContext';
import { AvatarWithStatus } from '../common/AvatarWithStatus';
import {
  Mic,
  MicOff,
  Headphones,
  Monitor,
  Video,
  VideoOff,
  PhoneOff,
  Radio,
  Share2,
  Volume2,
  Sparkles,
} from 'lucide-react';

export const VoiceRoom: React.FC = () => {
  const {
    activeChannel,
    voiceState,
    leaveVoiceChannel,
    toggleMute,
    toggleDeafen,
    toggleScreenShare,
    toggleVideo,
    currentUser,
    setActiveProfileUser,
  } = useDiscord();

  const participants = activeChannel?.participants || [
    {
      user: currentUser,
      isMuted: voiceState.isMuted,
      isDeafened: voiceState.isDeafened,
      isSpeaking: false,
      isScreenSharing: voiceState.isScreenSharing,
      joinedAt: Date.now(),
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1f22] relative select-none">
      {/* Voice Room Top Header */}
      <header className="h-12 px-4 border-b border-[#2b2d31] flex items-center justify-between shrink-0 bg-[#2b2d31]/50 backdrop-blur">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-[#23a559]" />
          <span className="font-bold text-white text-[15px]">
            {activeChannel?.name || 'Voice Lounge'}
          </span>
          <div className="w-[1px] h-4 bg-[#4e5058] mx-2" />
          <div className="flex items-center gap-1.5 text-xs text-[#23a559]">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>RTC Connected / {voiceState.latencyMs}ms</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#949ba4]">
            {participants.length} {participants.length === 1 ? 'member' : 'members'} in room
          </span>
        </div>
      </header>

      {/* Main Grid of Participants & Video Tiles */}
      <div className="flex-1 p-6 overflow-y-auto flex items-center justify-center">
        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {participants.map((part) => {
            const isSelf = part.user.id === currentUser.id;
            const isMuted = isSelf ? voiceState.isMuted : part.isMuted;
            const isSpeaking = part.isSpeaking;

            return (
              <motion.div
                key={part.user.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                onClick={() => setActiveProfileUser(part.user)}
                className={`relative aspect-video bg-[#2b2d31] rounded-xl overflow-hidden flex flex-col items-center justify-center transition-all cursor-pointer group shadow-lg ${
                  isSpeaking
                    ? 'ring-2 ring-[#23a559] shadow-[0_0_15px_rgba(35,165,89,0.3)]'
                    : 'hover:bg-[#313338]'
                }`}
              >
                {/* Simulated Screen Share / Video background */}
                {isSelf && voiceState.isScreenSharing ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#111214] via-[#202225] to-[#2f3136] flex flex-col items-center justify-center text-center p-4">
                    <Monitor className="w-12 h-12 text-[#5865F2] mb-2 animate-bounce" />
                    <span className="text-sm font-bold text-white">You are sharing your screen</span>
                    <span className="text-xs text-[#949ba4]">1080p 60FPS Stream</span>
                  </div>
                ) : isSelf && voiceState.isVideoEnabled ? (
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900 to-purple-900 flex items-center justify-center">
                    <div className="relative">
                      <AvatarWithStatus
                        src={part.user.avatar}
                        alt={part.user.username}
                        size="xl"
                        isSpeaking={isSpeaking}
                      />
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                        Camera Live
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Standard Voice Tile with Avatar */
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <AvatarWithStatus
                        src={part.user.avatar}
                        alt={part.user.username}
                        size="xl"
                        isSpeaking={isSpeaking}
                      />
                      {isSpeaking && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#23a559] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#23a559]"></span>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Bottom Name Bar */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded-md">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-xs font-semibold text-white truncate">
                      {part.user.username} {isSelf && '(You)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[#80848e]">
                    {isMuted && (
                      <span className="bg-[#f23f43]/20 p-0.5 rounded text-[#f23f43]">
                        <MicOff className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {part.isDeafened && (
                      <span className="bg-[#f23f43]/20 p-0.5 rounded text-[#f23f43]">
                        <Headphones className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Floating Control Dock */}
      <div className="h-20 bg-[#2b2d31] border-t border-[#1f2023] flex items-center justify-center gap-3 px-6 shrink-0 z-20">
        {/* Toggle Video */}
        <button
          onClick={toggleVideo}
          className={`p-3.5 rounded-full transition-all cursor-pointer ${
            voiceState.isVideoEnabled
              ? 'bg-[#23a559] text-white hover:bg-[#1f934e]'
              : 'bg-[#35373c] text-[#dbdee1] hover:bg-[#404249] hover:text-white'
          }`}
          title={voiceState.isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {voiceState.isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Toggle Screen Share */}
        <button
          onClick={toggleScreenShare}
          className={`p-3.5 rounded-full transition-all cursor-pointer ${
            voiceState.isScreenSharing
              ? 'bg-[#23a559] text-white hover:bg-[#1f934e]'
              : 'bg-[#35373c] text-[#dbdee1] hover:bg-[#404249] hover:text-white'
          }`}
          title={voiceState.isScreenSharing ? 'Stop Streaming' : 'Share Screen'}
        >
          <Monitor className="w-5 h-5" />
        </button>

        {/* Toggle Mic Mute */}
        <button
          onClick={toggleMute}
          className={`p-3.5 rounded-full transition-all cursor-pointer ${
            voiceState.isMuted
              ? 'bg-[#f23f43] text-white hover:bg-[#da373b]'
              : 'bg-[#35373c] text-[#dbdee1] hover:bg-[#404249] hover:text-white'
          }`}
          title={voiceState.isMuted ? 'Unmute' : 'Mute'}
        >
          {voiceState.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Toggle Deafen */}
        <button
          onClick={toggleDeafen}
          className={`p-3.5 rounded-full transition-all cursor-pointer ${
            voiceState.isDeafened
              ? 'bg-[#f23f43] text-white hover:bg-[#da373b]'
              : 'bg-[#35373c] text-[#dbdee1] hover:bg-[#404249] hover:text-white'
          }`}
          title={voiceState.isDeafened ? 'Undeafen' : 'Deafen'}
        >
          <Headphones className="w-5 h-5" />
        </button>

        <div className="w-[1px] h-6 bg-[#3f4147] mx-1" />

        {/* Disconnect Button */}
        <button
          onClick={leaveVoiceChannel}
          className="px-5 py-3 rounded-full bg-[#f23f43] text-white font-bold text-sm hover:bg-[#da373b] transition-all flex items-center gap-2 cursor-pointer shadow-lg"
          title="Disconnect from Voice"
        >
          <PhoneOff className="w-4 h-4" />
          <span>Disconnect</span>
        </button>
      </div>
    </div>
  );
};
