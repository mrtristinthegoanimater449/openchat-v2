import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useDiscord } from '../../context/DiscordContext';
import { AvatarWithStatus } from '../common/AvatarWithStatus';
import {
  Users,
  MessageSquare,
  MoreVertical,
  Search,
  UserCheck,
  UserPlus,
  Gamepad2,
  Music,
  Radio,
  Menu,
  Check,
  AlertCircle,
  X,
} from 'lucide-react';

export const FriendsHub: React.FC = () => {
  const {
    friends,
    setActiveDmFriendId,
    addFriend,
    removeFriend,
    setActiveProfileUser,
    setMobileSidebarOpen,
  } = useDiscord();

  const [activeTab, setActiveTab] = useState<'online' | 'all' | 'pending' | 'add'>('online');
  const [searchFilter, setSearchFilter] = useState('');
  const [newFriendInput, setNewFriendInput] = useState('');
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const onlineFriends = friends.filter((f) => f.user.status !== 'offline');

  const displayedFriends = (activeTab === 'online' ? onlineFriends : friends).filter((f) => {
    if (!searchFilter.trim()) return true;
    return (
      f.user.username.toLowerCase().includes(searchFilter.toLowerCase()) ||
      f.user.discriminator.includes(searchFilter)
    );
  });

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendInput.trim()) return;
    const res = addFriend(newFriendInput);
    setFeedback(res);
    if (res.success) {
      setNewFriendInput('');
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-[#313338] overflow-hidden select-text">
      {/* Top Header */}
      <header className="h-12 px-4 border-b border-[#1f2023] flex items-center justify-between shrink-0 shadow-sm bg-[#313338]">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-1.5 text-[#949ba4] hover:text-white rounded hover:bg-[#35373c] cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 font-bold text-white text-[15px] shrink-0">
            <Users className="w-5 h-5 text-[#80848e]" />
            <span>Friends</span>
          </div>

          <div className="w-[1px] h-4 bg-[#4e5058] shrink-0" />

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('online')}
              className={`px-2 py-1 rounded text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'online'
                  ? 'bg-[#3f4147] text-white'
                  : 'text-[#b5bac1] hover:bg-[#35373c] hover:text-[#dbdee1]'
              }`}
            >
              Online
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2 py-1 rounded text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#3f4147] text-white'
                  : 'text-[#b5bac1] hover:bg-[#35373c] hover:text-[#dbdee1]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-2 py-1 rounded text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-[#3f4147] text-white'
                  : 'text-[#b5bac1] hover:bg-[#35373c] hover:text-[#dbdee1]'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => {
                setActiveTab('add');
                setFeedback(null);
              }}
              className={`px-2.5 py-1 rounded text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'add'
                  ? 'bg-[#23a559]/20 text-[#23a559]'
                  : 'bg-[#23a559] text-white hover:bg-[#1f934e]'
              }`}
            >
              Add Friend
            </button>
          </div>
        </div>
      </header>

      {/* Main Container: Split into Friends List & Active Now Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Friends Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto no-scrollbar space-y-4">
          {activeTab === 'add' ? (
            /* Add Friend Tab */
            <div className="max-w-xl space-y-4">
              <div>
                <h2 className="text-base font-bold uppercase text-white">Add Friend</h2>
                <p className="text-xs text-[#949ba4] mt-1">
                  You can add friends with their OpenChat username or tag.
                </p>
              </div>

              <form onSubmit={handleSendRequest} className="space-y-3">
                <div className="relative flex items-center bg-[#1e1f22] rounded-lg p-3 border border-[#111214] focus-within:border-[#5865F2]">
                  <input
                    type="text"
                    value={newFriendInput}
                    onChange={(e) => setNewFriendInput(e.target.value)}
                    placeholder="You can add friends with their OpenChat Tag (e.g. Wumpus#0000)"
                    className="flex-1 bg-transparent text-sm text-white placeholder-[#80848e] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newFriendInput.trim()}
                    className={`px-4 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                      newFriendInput.trim()
                        ? 'bg-[#5865F2] text-white hover:bg-[#4752c4]'
                        : 'bg-[#35373c] text-[#80848e] cursor-not-allowed'
                    }`}
                  >
                    Send Friend Request
                  </button>
                </div>

                {feedback && (
                  <div
                    className={`flex items-center gap-2 text-xs font-medium ${
                      feedback.success ? 'text-[#23a559]' : 'text-[#f23f43]'
                    }`}
                  >
                    {feedback.success ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span>{feedback.message}</span>
                  </div>
                )}
              </form>

              <div className="h-[1px] bg-[#3f4147] my-6" />

              <div className="flex flex-col items-center justify-center text-center p-8 text-[#949ba4]">
                <UserPlus className="w-16 h-16 text-[#4e5058] mb-3" />
                <span className="text-sm font-semibold text-white">Wumpus is waiting on friends.</span>
                <span className="text-xs text-[#80848e] mt-1">
                  Connect with creators, gamers, and developers across OpenChat!
                </span>
              </div>
            </div>
          ) : (
            /* Friends List (Online / All) */
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search friends"
                  className="w-full h-9 px-3 pr-8 bg-[#1e1f22] text-sm text-white placeholder-[#80848e] rounded-md focus:outline-none"
                />
                <Search className="w-4 h-4 text-[#80848e] absolute right-3 pointer-events-none" />
              </div>

              <div className="text-[12px] font-bold text-[#949ba4] uppercase tracking-wider">
                {activeTab === 'online' ? `Online — ${onlineFriends.length}` : `All Friends — ${friends.length}`}
              </div>

              {/* Friends Cards */}
              <div className="space-y-1">
                {displayedFriends.length === 0 ? (
                  <div className="py-12 text-center text-[#949ba4] text-sm">
                    No friends found matching your search.
                  </div>
                ) : (
                  displayedFriends.map((friend, i) => (
                    <motion.div
                      key={friend.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30, delay: i * 0.04 }}
                      className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-[#35373c]/50 border-t border-[#35373c]/30 transition-colors"
                    >
                      <button
                        onClick={() => setActiveProfileUser(friend.user)}
                        className="flex items-center gap-3 text-left truncate flex-1 cursor-pointer"
                      >
                        <AvatarWithStatus
                          src={friend.user.avatar}
                          alt={friend.user.username}
                          size="md"
                          status={friend.user.status}
                        />
                        <div className="flex flex-col truncate">
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-white group-hover:underline truncate">
                              {friend.user.username}
                            </span>
                            <span className="text-xs text-[#949ba4]">
                              #{friend.user.discriminator}
                            </span>
                          </div>
                          <span className="text-xs text-[#80848e] truncate">
                            {friend.user.activity ? (
                              friend.user.activity.type === 'listening' ? (
                                `Listening to ${friend.user.activity.name}`
                              ) : (
                                `Playing ${friend.user.activity.name}`
                              )
                            ) : (
                              friend.user.customStatus || friend.user.status
                            )}
                          </span>
                        </div>
                      </button>

                      {/* Quick Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveDmFriendId(friend.id)}
                          className="w-9 h-9 rounded-full bg-[#2b2d31] hover:bg-[#111214] text-[#b5bac1] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Message"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFriend(friend.id)}
                          className="w-9 h-9 rounded-full bg-[#2b2d31] hover:bg-[#f23f43]/20 text-[#b5bac1] hover:text-[#f23f43] flex items-center justify-center transition-colors cursor-pointer"
                          title="Remove Friend"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: "Active Now" Panel */}
        <aside className="w-80 border-l border-[#1f2023] p-5 hidden xl:flex flex-col gap-4 overflow-y-auto no-scrollbar">
          <h2 className="text-lg font-bold text-white">Active Now</h2>

          <div className="space-y-3">
            {friends
              .filter((f) => f.user.activity)
              .map((f) => (
                <div
                  key={f.id}
                  onClick={() => setActiveProfileUser(f.user)}
                  className="bg-[#2b2d31] hover:bg-[#35373c] p-3 rounded-xl border border-[#1f2023] transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center gap-2.5">
                    <AvatarWithStatus
                      src={f.user.avatar}
                      alt={f.user.username}
                      size="sm"
                      status={f.user.status}
                    />
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-bold text-white truncate">
                        {f.user.username}
                      </span>
                      <span className="text-[10px] text-[#949ba4] truncate">
                        {f.user.activity?.name}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#1e1f22] p-2 rounded-lg flex items-center gap-2">
                    {f.user.activity?.type === 'listening' ? (
                      <Music className="w-4 h-4 text-[#1db954] shrink-0" />
                    ) : (
                      <Gamepad2 className="w-4 h-4 text-[#5865F2] shrink-0" />
                    )}
                    <div className="flex flex-col text-[11px] truncate">
                      <span className="font-semibold text-white truncate">
                        {f.user.activity?.name}
                      </span>
                      <span className="text-[#949ba4] truncate">
                        {f.user.activity?.details || f.user.activity?.state || 'Active Session'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </aside>
      </div>
    </main>
  );
};
