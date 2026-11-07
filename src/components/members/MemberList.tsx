import React from 'react';
import { useDiscord } from '../../context/DiscordContext';
import { AvatarWithStatus } from '../common/AvatarWithStatus';
import { Crown, Bot, Sparkles, X } from 'lucide-react';

export const MemberList: React.FC = () => {
  const {
    activeServer,
    setActiveProfileUser,
    isMemberListOpen,
    mobileMembersOpen,
    setMobileMembersOpen,
  } = useDiscord();

  if (!activeServer) return null;

  const members = activeServer.members;

  // Group members into online vs offline vs bots
  const bots = members.filter((m) => m.roles.includes('Bot'));
  const onlineMembers = members.filter(
    (m) => !m.roles.includes('Bot') && m.user.status !== 'offline'
  );
  const offlineMembers = members.filter(
    (m) => !m.roles.includes('Bot') && m.user.status === 'offline'
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileMembersOpen && (
        <div
          onClick={() => setMobileMembersOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`w-60 bg-[#2b2d31] flex flex-col h-full shrink-0 select-none z-40 border-l border-[#1f2023] ${
          mobileMembersOpen
            ? 'fixed right-0 top-0 bottom-0 shadow-2xl flex'
            : isMemberListOpen
            ? 'hidden lg:flex'
            : 'hidden'
        }`}
      >
        {/* Mobile Header */}
        <div className="lg:hidden h-12 px-4 border-b border-[#1f2023] flex items-center justify-between text-white font-bold">
          <span>Server Members</span>
          <button
            onClick={() => setMobileMembersOpen(false)}
            className="p-1 hover:bg-[#35373c] rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 no-scrollbar">
          {/* Online Section */}
          {onlineMembers.length > 0 && (
            <div className="space-y-1">
              <h3 className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider px-2">
                Online — {onlineMembers.length}
              </h3>
              {onlineMembers.map(({ user, isOwner, roles }) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setActiveProfileUser(user);
                    setMobileMembersOpen(false);
                  }}
                  className="w-full px-2 py-1.5 rounded-md flex items-center gap-2.5 hover:bg-[#35373c]/60 transition-colors group text-left cursor-pointer"
                >
                  <AvatarWithStatus
                    src={user.avatar}
                    alt={user.username}
                    size="sm"
                    status={user.status}
                  />

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1 truncate">
                      <span
                        className={`text-sm font-semibold truncate ${
                          isOwner ? 'text-[#f0b232]' : 'text-[#dbdee1]'
                        }`}
                      >
                        {user.username}
                      </span>
                      {isOwner && (
                        <Crown className="w-3.5 h-3.5 text-[#f0b232] shrink-0 fill-current" />
                      )}
                    </div>

                    {user.activity ? (
                      <span className="text-[11px] text-[#949ba4] truncate">
                        {user.activity.type === 'listening'
                          ? `Listening to ${user.activity.name}`
                          : `Playing ${user.activity.name}`}
                      </span>
                    ) : user.customStatus ? (
                      <span className="text-[11px] text-[#949ba4] truncate">
                        {user.customStatus}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Bots Section */}
          {bots.length > 0 && (
            <div className="space-y-1">
              <h3 className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider px-2">
                Bots — {bots.length}
              </h3>
              {bots.map(({ user }) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setActiveProfileUser(user);
                    setMobileMembersOpen(false);
                  }}
                  className="w-full px-2 py-1.5 rounded-md flex items-center gap-2.5 hover:bg-[#35373c]/60 transition-colors group text-left cursor-pointer"
                >
                  <AvatarWithStatus
                    src={user.avatar}
                    alt={user.username}
                    size="sm"
                    status={user.status}
                  />

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-sm font-semibold text-[#5865F2] truncate">
                        {user.username}
                      </span>
                      <span className="bg-[#5865F2] text-white text-[9px] font-bold px-1 rounded uppercase">
                        BOT
                      </span>
                    </div>
                    {user.activity && (
                      <span className="text-[11px] text-[#949ba4] truncate">
                        {user.activity.name}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Offline Section */}
          {offlineMembers.length > 0 && (
            <div className="space-y-1 opacity-70">
              <h3 className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider px-2">
                Offline — {offlineMembers.length}
              </h3>
              {offlineMembers.map(({ user, isOwner }) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setActiveProfileUser(user);
                    setMobileMembersOpen(false);
                  }}
                  className="w-full px-2 py-1.5 rounded-md flex items-center gap-2.5 hover:bg-[#35373c]/60 transition-colors group text-left cursor-pointer"
                >
                  <AvatarWithStatus
                    src={user.avatar}
                    alt={user.username}
                    size="sm"
                    status="offline"
                  />

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1 truncate">
                      <span className="text-sm font-semibold text-[#80848e] truncate">
                        {user.username}
                      </span>
                      {isOwner && <Crown className="w-3.5 h-3.5 text-[#f0b232] shrink-0" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
