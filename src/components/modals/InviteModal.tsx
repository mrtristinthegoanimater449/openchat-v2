import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useDiscord } from '../../context/DiscordContext';
import { AvatarWithStatus } from '../common/AvatarWithStatus';
import { X, Check, Copy, Link, Search } from 'lucide-react';

export const InviteModal: React.FC = () => {
  const { isInviteModalOpen, setIsInviteModalOpen, activeServer, friends } = useDiscord();
  const [copied, setCopied] = useState(false);
  const [invitedFriends, setInvitedFriends] = useState<Record<string, boolean>>({});

  if (!isInviteModalOpen || !activeServer) return null;

  const inviteCode = `https://openchat.app/invite-${activeServer.id.slice(7)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteFriend = (friendId: string) => {
    setInvitedFriends((prev) => ({ ...prev, [friendId]: true }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="bg-[#313338] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-[#232428]"
      >
        <div className="p-6 pb-2 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Invite friends to {activeServer.name}</h2>
            <p className="text-xs text-[#949ba4] mt-0.5">#welcome-and-rules</p>
          </div>
          <button
            onClick={() => setIsInviteModalOpen(false)}
            className="text-[#949ba4] hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Friend list */}
        <div className="px-6 py-3 max-h-60 overflow-y-auto no-scrollbar space-y-2">
          {friends.map((friend) => {
            const isInvited = invitedFriends[friend.id];
            return (
              <div
                key={friend.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[#2b2d31] transition-colors"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <AvatarWithStatus
                    src={friend.user.avatar}
                    alt={friend.user.username}
                    size="sm"
                    status={friend.user.status}
                  />
                  <span className="text-sm font-semibold text-white truncate">
                    {friend.user.username}
                  </span>
                </div>

                <button
                  onClick={() => handleInviteFriend(friend.id)}
                  disabled={isInvited}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    isInvited
                      ? 'border border-[#23a559] text-[#23a559]'
                      : 'border border-[#5865F2] text-[#5865F2] hover:bg-[#5865F2] hover:text-white'
                  }`}
                >
                  {isInvited ? 'Sent' : 'Invite'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Share Link Box */}
        <div className="p-6 bg-[#2b2d31] space-y-2">
          <label className="block text-[11px] font-bold text-[#b5bac1] uppercase">
            Or, send a server invite link to a friend
          </label>
          <div className="flex items-center bg-[#1e1f22] rounded-md border border-[#111214] p-1.5 pl-3">
            <span className="text-xs text-white truncate flex-1 font-mono">{inviteCode}</span>
            <button
              onClick={handleCopy}
              className={`px-4 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                copied
                  ? 'bg-[#23a559] text-white'
                  : 'bg-[#5865F2] hover:bg-[#4752c4] text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-[11px] text-[#949ba4]">Your invite link will not expire.</p>
        </div>
      </motion.div>
    </motion.div>
  );
};
