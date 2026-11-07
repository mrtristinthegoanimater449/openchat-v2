import React from 'react';
import { motion } from 'motion/react';
import { useDiscord } from '../../context/DiscordContext';
import { AvatarWithStatus } from '../common/AvatarWithStatus';
import {
  X,
  MessageSquare,
  Shield,
  Sparkles,
  Award,
  Crown,
  Calendar,
  Gamepad2,
  Music,
} from 'lucide-react';

export const UserProfilePopover: React.FC = () => {
  const {
    activeProfileUser,
    setActiveProfileUser,
    currentUser,
    setActiveDmFriendId,
    setActiveServerId,
    friends,
    addFriend,
  } = useDiscord();

  if (!activeProfileUser) return null;

  const isSelf = activeProfileUser.id === currentUser.id;
  const isFriend = friends.some((f) => f.user.id === activeProfileUser.id);

  const handleMessage = () => {
    // If friend exists, switch to DM
    const targetFriend = friends.find((f) => f.user.id === activeProfileUser.id);
    if (targetFriend) {
      setActiveServerId(null);
      setActiveDmFriendId(targetFriend.id);
      setActiveProfileUser(null);
    } else {
      // Add as friend and switch
      addFriend(`${activeProfileUser.username}#${activeProfileUser.discriminator}`);
      setActiveServerId(null);
      setActiveProfileUser(null);
    }
  };

  return (
    <motion.div
      onClick={() => setActiveProfileUser(null)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="w-full max-w-sm bg-[#232428] rounded-2xl overflow-hidden shadow-2xl border border-[#1f2023]"
      >
        {/* Banner */}
        <div
          className="h-28 w-full relative"
          style={{ backgroundColor: activeProfileUser.bannerColor || '#5865F2' }}
        >
          <button
            onClick={() => setActiveProfileUser(null)}
            className="absolute right-3 top-3 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card Body */}
        <div className="px-5 pb-5 relative">
          <div className="flex items-end justify-between -mt-12 mb-3">
            <AvatarWithStatus
              src={activeProfileUser.avatar}
              alt={activeProfileUser.username}
              size="xl"
              status={activeProfileUser.status}
              className="border-4 border-[#232428]"
            />

            {!isSelf && (
              <button
                onClick={handleMessage}
                className="px-4 py-1.5 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message</span>
              </button>
            )}
          </div>

          <div className="bg-[#111214] p-4 rounded-xl space-y-4">
            {/* Username & Badges */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-lg font-bold text-white leading-tight">
                  {activeProfileUser.username}
                </h3>
                {activeProfileUser.badges?.includes('staff') && (
                  <span title="Staff">
                    <Shield className="w-4 h-4 text-[#5865F2] fill-current" />
                  </span>
                )}
                {activeProfileUser.badges?.includes('nitro') && (
                  <span title="Subscriber">
                    <Sparkles className="w-4 h-4 text-[#eb459e] fill-current" />
                  </span>
                )}
                {activeProfileUser.badges?.includes('bot') && (
                  <span className="bg-[#5865F2] text-white text-[9px] font-bold px-1 rounded uppercase">
                    BOT
                  </span>
                )}
              </div>
              <p className="text-xs text-[#949ba4]">#{activeProfileUser.discriminator}</p>
            </div>

            {/* Custom Status */}
            {activeProfileUser.customStatus && (
              <div className="text-xs text-[#dbdee1] border-l-2 border-[#5865F2] pl-2 py-0.5 italic">
                {activeProfileUser.customStatus}
              </div>
            )}

            <div className="h-[1px] bg-[#2b2d31]" />

            {/* Activity */}
            {activeProfileUser.activity && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider">
                  Activity
                </span>
                <div className="flex items-start gap-2.5 bg-[#1e1f22] p-2.5 rounded-lg border border-[#2b2d31]">
                  {activeProfileUser.activity.type === 'listening' ? (
                    <Music className="w-6 h-6 text-[#1db954] shrink-0 mt-0.5" />
                  ) : (
                    <Gamepad2 className="w-6 h-6 text-[#5865F2] shrink-0 mt-0.5" />
                  )}
                  <div className="flex flex-col text-xs truncate">
                    <span className="font-bold text-white truncate">
                      {activeProfileUser.activity.name}
                    </span>
                    <span className="text-[#949ba4] truncate">
                      {activeProfileUser.activity.details}
                    </span>
                    {activeProfileUser.activity.state && (
                      <span className="text-[11px] text-[#80848e] truncate">
                        {activeProfileUser.activity.state}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* About Me */}
            {activeProfileUser.bio && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider">
                  About Me
                </span>
                <p className="text-xs text-[#dbdee1] leading-relaxed">
                  {activeProfileUser.bio}
                </p>
              </div>
            )}

            {/* Member Since */}
            {activeProfileUser.joinedAt && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#949ba4] pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>OpenChat Member Since {activeProfileUser.joinedAt}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
