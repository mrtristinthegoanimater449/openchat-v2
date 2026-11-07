import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useDiscord } from '../../context/DiscordContext';
import { X, Camera, Sparkles, Gamepad2, GraduationCap, Users } from 'lucide-react';

export const CreateServerModal: React.FC = () => {
  const { isCreateServerOpen, setIsCreateServerOpen, createServer } = useDiscord();
  const [serverName, setServerName] = useState('');
  const [iconUrl, setIconUrl] = useState('');

  if (!isCreateServerOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName.trim()) return;
    createServer(serverName, iconUrl || undefined);
    setServerName('');
    setIconUrl('');
    setIsCreateServerOpen(false);
  };

  const templates = [
    { name: 'Gaming Lounge', icon: <Gamepad2 className="w-5 h-5 text-[#5865F2]" /> },
    { name: 'School & Study Group', icon: <GraduationCap className="w-5 h-5 text-[#23a559]" /> },
    { name: 'Friends & Family', icon: <Users className="w-5 h-5 text-[#f0b232]" /> },
  ];

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
        <div className="relative p-6 text-center space-y-2">
          <button
            onClick={() => setIsCreateServerOpen(false)}
            className="absolute right-4 top-4 text-[#949ba4] hover:text-white p-1 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-2xl font-bold text-white">Create Your Server</h2>
          <p className="text-xs text-[#949ba4]">
            Your server is where you and your friends hang out. Make yours and start talking.
          </p>
        </div>

        {/* Quick templates */}
        <div className="px-6 space-y-2">
          <span className="text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider">
            Start from a template
          </span>
          <div className="space-y-1.5">
            {templates.map((tpl) => (
              <button
                key={tpl.name}
                type="button"
                onClick={() => setServerName(tpl.name)}
                className="w-full p-2.5 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] border border-[#1f2023] flex items-center justify-between transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  {tpl.icon}
                  <span className="text-sm font-semibold text-white">{tpl.name}</span>
                </div>
                <span className="text-xs text-[#949ba4]">Use</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-[#b5bac1] uppercase mb-1.5">
              Server Name
            </label>
            <input
              type="text"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="e.g. Cyberpunk Hub, AI Creators"
              required
              className="w-full bg-[#1e1f22] border border-[#111214] rounded-md p-2.5 text-sm text-white focus:outline-none focus:border-[#5865F2]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#b5bac1] uppercase mb-1.5">
              Icon Image URL (Optional)
            </label>
            <input
              type="text"
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#1e1f22] border border-[#111214] rounded-md p-2.5 text-sm text-white focus:outline-none focus:border-[#5865F2]"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setIsCreateServerOpen(false)}
              className="text-xs font-semibold text-white hover:underline cursor-pointer"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!serverName.trim()}
              className="px-6 py-2.5 bg-[#5865F2] hover:bg-[#4752c4] text-white text-sm font-bold rounded transition-colors cursor-pointer disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
