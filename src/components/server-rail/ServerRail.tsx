import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDiscord } from '../../context/DiscordContext';
import { Plus, Compass, Volume2, VolumeX, MessageSquare, Flame } from 'lucide-react';

export const ServerRail: React.FC = () => {
  const {
    servers,
    activeServerId,
    setActiveServerId,
    setActiveChannelId,
    friends,
    setIsCreateServerOpen,
    soundEnabled,
    toggleSoundEnabled,
  } = useDiscord();

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Calculate unread DMs
  const totalUnreadDms = friends.reduce((acc, f) => acc + (f.unreadCount || 0), 0);

  const handleSelectHome = () => {
    setActiveServerId(null);
  };

  const handleSelectServer = (serverId: string) => {
    setActiveServerId(serverId);
    const targetServer = servers.find((s) => s.id === serverId);
    if (targetServer && targetServer.categories[0]?.channels[0]) {
      setActiveChannelId(targetServer.categories[0].channels[0].id);
    }
  };

  return (
    <nav
      className="w-[72px] h-full bg-[#1e1f22] flex flex-col items-center py-3 select-none shrink-0 z-30 overflow-y-auto no-scrollbar justify-between"
      aria-label="Servers navigation"
    >
      <div className="flex flex-col items-center w-full gap-2">
        {/* Direct Messages / Home button */}
        <div className="relative group w-full flex items-center justify-center">
          {/* Active / Hover Pill on left */}
          <div
            className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${
              activeServerId === null
                ? 'h-10 opacity-100'
                : hoveredId === 'home'
                ? 'h-5 opacity-100'
                : totalUnreadDms > 0
                ? 'h-2 opacity-100'
                : 'h-0 opacity-0'
            }`}
          />

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            onClick={handleSelectHome}
            onMouseEnter={() => setHoveredId('home')}
            onMouseLeave={() => setHoveredId(null)}
            className={`relative w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer ${
              activeServerId === null
                ? 'bg-[#5865F2] rounded-[16px] text-white'
                : 'bg-[#313338] text-[#dbdee1] hover:bg-[#5865F2] hover:text-white rounded-[24px] hover:rounded-[16px]'
            }`}
            title="Direct Messages"
          >
            {/* OpenChat V2 Original Brand Logo */}
            <svg
              className="w-7 h-7"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 4C2.89543 4 2 4.89543 2 6V15C2 16.1046 2.89543 17 4 17H6V20.5L10.5 17H20C21.1046 17 22 16.1046 22 15V6C22 4.89543 21.1046 4 20 4H4Z"
                fill="currentColor"
              />
              <path
                d="M13 7.5L8.5 12.5H12L11 15.5L15.5 10.5H12L13 7.5Z"
                className={activeServerId === null ? "fill-[#5865F2]" : "fill-[#313338] group-hover:fill-[#5865F2]"}
              />
            </svg>

            {/* Unread badge */}
            {totalUnreadDms > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#f23f43] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full border-[3px] border-[#1e1f22] shadow">
                {totalUnreadDms}
              </span>
            )}
          </motion.button>

          {/* Discord Tooltip */}
          {hoveredId === 'home' && (
            <div className="absolute left-[80px] bg-[#111214] text-[#dbdee1] text-sm font-semibold py-1.5 px-3 rounded-md shadow-xl whitespace-nowrap z-50 pointer-events-none flex items-center">
              Direct Messages
              <div className="absolute -left-1.5 w-3 h-3 bg-[#111214] rotate-45" />
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="w-8 h-[2px] bg-[#35363c] rounded-full mx-auto my-0.5" />

        {/* Server List */}
        {servers.map((server) => {
          const isActive = activeServerId === server.id;
          const isHovered = hoveredId === server.id;

          // Check if server has unread messages
          const serverUnreads = server.categories.reduce(
            (acc, cat) => acc + cat.channels.reduce((cAcc, chan) => cAcc + (chan.unreadCount || 0), 0),
            0
          );

          // Get initials fallback
          const initials = server.name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 3)
            .join('');

          return (
            <div key={server.id} className="relative group w-full flex items-center justify-center">
              {/* Left Pill */}
              <div
                className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${
                  isActive
                    ? 'h-10 opacity-100'
                    : isHovered
                    ? 'h-5 opacity-100'
                    : serverUnreads > 0
                    ? 'h-2 opacity-100'
                    : 'h-0 opacity-0'
                }`}
              />

              <motion.button
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.88 }}
                onClick={() => handleSelectServer(server.id)}
                onMouseEnter={() => setHoveredId(server.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`relative w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer overflow-hidden ${
                  isActive
                    ? 'rounded-[16px] ring-2 ring-[#5865F2]'
                    : isHovered
                    ? 'rounded-[16px] bg-[#5865F2]'
                    : 'rounded-[24px] bg-[#313338]'
                }`}
                aria-label={server.name}
              >
                {server.icon ? (
                  <img
                    src={server.icon}
                    alt={server.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-semibold text-sm text-[#dbdee1] uppercase">
                    {initials}
                  </span>
                )}

                {/* Unread dot or count */}
                {serverUnreads > 0 && !isActive && (
                  <span className="absolute -top-1 -right-1 bg-[#f23f43] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full border-2 border-[#1e1f22]">
                    {serverUnreads}
                  </span>
                )}
              </motion.button>

              {/* Tooltip */}
              {isHovered && (
                <div className="absolute left-[80px] bg-[#111214] text-[#dbdee1] text-sm font-semibold py-1.5 px-3 rounded-md shadow-xl whitespace-nowrap z-50 pointer-events-none flex items-center">
                  {server.name}
                  <div className="absolute -left-1.5 w-3 h-3 bg-[#111214] rotate-45" />
                </div>
              )}
            </div>
          );
        })}

        {/* Add Server Button */}
        <div className="relative group w-full flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={() => setIsCreateServerOpen(true)}
            onMouseEnter={() => setHoveredId('add-server')}
            onMouseLeave={() => setHoveredId(null)}
            className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#313338] text-[#23a559] hover:bg-[#23a559] hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer group"
            title="Add a Server"
          >
            <Plus className="w-6 h-6 transition-transform group-hover:rotate-90 duration-200" />
          </motion.button>

          {hoveredId === 'add-server' && (
            <div className="absolute left-[80px] bg-[#111214] text-[#dbdee1] text-sm font-semibold py-1.5 px-3 rounded-md shadow-xl whitespace-nowrap z-50 pointer-events-none flex items-center">
              Add a Server
              <div className="absolute -left-1.5 w-3 h-3 bg-[#111214] rotate-45" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom utilities */}
      <div className="flex flex-col items-center w-full gap-2 pt-2 border-t border-[#232428]">
        {/* Sound toggle button */}
        <div className="relative group w-full flex items-center justify-center">
          <button
            onClick={toggleSoundEnabled}
            onMouseEnter={() => setHoveredId('sound')}
            onMouseLeave={() => setHoveredId(null)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              soundEnabled
                ? 'text-[#949ba4] hover:text-white hover:bg-[#35373c]'
                : 'text-[#f23f43] bg-[#f23f43]/10 hover:bg-[#f23f43]/20'
            }`}
            title={soundEnabled ? 'Mute OpenChat Sounds' : 'Unmute OpenChat Sounds'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {hoveredId === 'sound' && (
            <div className="absolute left-[80px] bg-[#111214] text-[#dbdee1] text-xs font-semibold py-1 px-2.5 rounded-md shadow-xl whitespace-nowrap z-50 pointer-events-none flex items-center">
              {soundEnabled ? 'OpenChat Sound Effects (Active)' : 'OpenChat Sound Effects (Muted)'}
              <div className="absolute -left-1 w-2 h-2 bg-[#111214] rotate-45" />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
