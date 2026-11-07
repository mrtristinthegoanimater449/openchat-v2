import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useDiscord } from '../../context/DiscordContext';
import { X, Hash, Volume2 } from 'lucide-react';

export const CreateChannelModal: React.FC = () => {
  const { isCreateChannelOpen, setIsCreateChannelOpen, activeServer, createChannel } =
    useDiscord();
  const [channelType, setChannelType] = useState<'text' | 'voice'>('text');
  const [channelName, setChannelName] = useState('');

  if (!isCreateChannelOpen || !activeServer) return null;

  const targetCategory = activeServer.categories[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) return;
    createChannel(activeServer.id, targetCategory.id, channelName, channelType);
    setChannelName('');
    setIsCreateChannelOpen(false);
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
          <h2 className="text-xl font-bold text-white">Create Channel</h2>
          <button
            onClick={() => setIsCreateChannelOpen(false)}
            className="text-[#949ba4] hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-6 space-y-4">
          {/* Channel Type Selector */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-[#b5bac1] uppercase">
              Channel Type
            </label>

            <button
              type="button"
              onClick={() => setChannelType('text')}
              className={`w-full p-3 rounded-lg flex items-center gap-3 border transition-colors cursor-pointer text-left ${
                channelType === 'text'
                  ? 'bg-[#2b2d31] border-[#5865F2]'
                  : 'bg-[#2b2d31]/50 border-transparent hover:bg-[#2b2d31]'
              }`}
            >
              <Hash className="w-5 h-5 text-[#80848e] shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">Text</span>
                <span className="text-xs text-[#949ba4]">
                  Post images, stickers, opinions, and puns
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setChannelType('voice')}
              className={`w-full p-3 rounded-lg flex items-center gap-3 border transition-colors cursor-pointer text-left ${
                channelType === 'voice'
                  ? 'bg-[#2b2d31] border-[#5865F2]'
                  : 'bg-[#2b2d31]/50 border-transparent hover:bg-[#2b2d31]'
              }`}
            >
              <Volume2 className="w-5 h-5 text-[#80848e] shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">Voice</span>
                <span className="text-xs text-[#949ba4]">
                  Hang out together with voice, video, and screen share
                </span>
              </div>
            </button>
          </div>

          {/* Channel Name */}
          <div>
            <label className="block text-[11px] font-bold text-[#b5bac1] uppercase mb-1.5">
              Channel Name
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[#949ba4] font-bold text-sm">
                {channelType === 'text' ? '#' : '🔊'}
              </span>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="new-channel"
                required
                className="w-full bg-[#1e1f22] border border-[#111214] rounded-md py-2.5 pl-8 pr-3 text-sm text-white focus:outline-none focus:border-[#5865F2]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setIsCreateChannelOpen(false)}
              className="text-xs font-semibold text-white hover:underline cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!channelName.trim()}
              className="px-6 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white text-sm font-bold rounded transition-colors cursor-pointer disabled:opacity-50"
            >
              Create Channel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
