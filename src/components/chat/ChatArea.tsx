import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDiscord } from '../../context/DiscordContext';
import { AvatarWithStatus } from '../common/AvatarWithStatus';
import { Message } from '../../types';
import {
  Hash,
  Bell,
  Pin,
  Users,
  Search,
  PlusCircle,
  Smile,
  Send,
  Trash2,
  Reply,
  Menu,
  X,
  ExternalLink,
  Megaphone,
  Check,
} from 'lucide-react';

const COMMON_EMOJIS = ['👍', '❤️', '🔥', '🚀', '😂', '🎉', '💡', '👀', '💯', '✨', '⚡', '🎧', '🎮', '💻', '🥳'];

export const ChatArea: React.FC = () => {
  const {
    activeServer,
    activeChannel,
    activeDmFriend,
    activeServerId,
    currentMessages,
    sendMessage,
    addReaction,
    togglePinMessage,
    deleteMessage,
    toggleMemberList,
    isMemberListOpen,
    setActiveProfileUser,
    setActiveLightboxImage,
    currentUser,
    setMobileSidebarOpen,
    setMobileMembersOpen,
    searchQuery,
    setSearchQuery,
    dmTypingUserId,
  } = useDiscord();

  const [inputContent, setInputContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPinnedDrawer, setShowPinnedDrawer] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length]);

  const handleSend = () => {
    if (!inputContent.trim()) return;

    const replyData = replyingTo
      ? {
          id: replyingTo.id,
          author: replyingTo.author,
          content: replyingTo.content.slice(0, 100),
        }
      : undefined;

    sendMessage(inputContent, undefined, replyData);
    setInputContent('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Use FileReader for preview
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      sendMessage('Shared an image:', [
        {
          id: `att-${Date.now()}`,
          name: file.name,
          url: result,
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          type: 'image',
        },
      ]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Filter messages based on search query
  const filteredMessages = currentMessages.filter((msg) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      msg.content.toLowerCase().includes(query) ||
      msg.author.username.toLowerCase().includes(query)
    );
  });

  const pinnedMessages = currentMessages.filter((m) => m.pinned);

  // Simple Markdown Renderer
  const renderMessageContent = (content: string) => {
    // Code block check ```lang\ncode\n```
    if (content.includes('```')) {
      const parts = content.split('```');
      return (
        <div className="space-y-2">
          {parts.map((part, index) => {
            if (index % 2 === 1) {
              // Code snippet
              const lines = part.split('\n');
              const codeLines = lines.slice(1).join('\n') || part;
              return (
                <div
                  key={index}
                  className="bg-[#1e1f22] border border-[#2b2d31] rounded-md p-3 font-mono text-xs text-[#23a559] overflow-x-auto shadow-inner"
                >
                  <pre>{codeLines.trim()}</pre>
                </div>
              );
            }
            return <div key={index}>{renderInlineMarkdown(part)}</div>;
          })}
        </div>
      );
    }
    return renderInlineMarkdown(content);
  };

  const renderInlineMarkdown = (text: string) => {
    // Mentions @username highlight
    const mentionRegex = /(@[\w\d_-]+)/g;
    const lines = text.split('\n');

    return (
      <div className="space-y-1">
        {lines.map((line, lineIdx) => {
          // Check for bold and inline code
          const tokens = line.split(mentionRegex);
          return (
            <p key={lineIdx} className="leading-relaxed break-words">
              {tokens.map((token, tokIdx) => {
                if (token.startsWith('@')) {
                  return (
                    <span
                      key={tokIdx}
                      className="bg-[#5865F2]/20 text-[#5865F2] hover:bg-[#5865F2] hover:text-white px-1 py-0.5 rounded font-medium cursor-pointer transition-colors"
                    >
                      {token}
                    </span>
                  );
                }
                // Check bold **bold**
                if (token.includes('**')) {
                  const bParts = token.split('**');
                  return (
                    <span key={tokIdx}>
                      {bParts.map((b, bIdx) =>
                        bIdx % 2 === 1 ? <strong key={bIdx} className="font-bold text-white">{b}</strong> : b
                      )}
                    </span>
                  );
                }
                return <span key={tokIdx}>{token}</span>;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  const channelTitle = activeServerId
    ? activeChannel?.name || 'general'
    : activeDmFriend?.user.username || 'Direct Message';

  return (
    <main className="flex-1 flex flex-col h-full bg-[#313338] relative overflow-hidden select-text">
      {/* Channel Top Header Bar */}
      <header className="h-12 px-4 border-b border-[#1f2023] flex items-center justify-between shrink-0 shadow-sm z-10 bg-[#313338]">
        <div className="flex items-center gap-2 truncate">
          {/* Mobile drawer toggle */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-1.5 text-[#949ba4] hover:text-white rounded hover:bg-[#35373c] cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 font-bold text-white text-[15px] truncate">
            {activeServerId ? (
              activeChannel?.type === 'announcement' ? (
                <Megaphone className="w-5 h-5 text-[#80848e] shrink-0" />
              ) : (
                <Hash className="w-5 h-5 text-[#80848e] shrink-0" />
              )
            ) : (
              <span className="text-[#80848e] text-lg">@</span>
            )}
            <span className="truncate">{channelTitle}</span>
          </div>

          {activeChannel?.topic && (
            <>
              <div className="hidden sm:block w-[1px] h-4 bg-[#4e5058] mx-2" />
              <span className="hidden sm:block text-xs text-[#949ba4] truncate font-normal">
                {activeChannel.topic}
              </span>
            </>
          )}
        </div>

        {/* Right Header Icons */}
        <div className="flex items-center gap-2 text-[#b5bac1]">
          {/* Pinned Messages Button */}
          <div className="relative">
            <button
              onClick={() => setShowPinnedDrawer(!showPinnedDrawer)}
              className={`p-1.5 rounded hover:bg-[#35373c] hover:text-[#dbdee1] transition-colors relative cursor-pointer ${
                showPinnedDrawer ? 'text-white bg-[#35373c]' : ''
              }`}
              title="Pinned Messages"
            >
              <Pin className="w-4 h-4" />
              {pinnedMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#5865F2] text-white text-[9px] font-bold px-1 rounded-full">
                  {pinnedMessages.length}
                </span>
              )}
            </button>

            {/* Pinned Messages Popover */}
            {showPinnedDrawer && (
              <div className="absolute right-0 top-10 w-80 max-h-96 bg-[#2b2d31] border border-[#1f2023] rounded-lg shadow-2xl p-3 z-50 overflow-y-auto no-scrollbar space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#35373c]">
                  <span className="text-xs font-bold uppercase text-[#949ba4]">Pinned Messages</span>
                  <button
                    onClick={() => setShowPinnedDrawer(false)}
                    className="p-1 hover:text-white rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {pinnedMessages.length === 0 ? (
                  <p className="text-xs text-[#949ba4] text-center py-4">No pinned messages yet.</p>
                ) : (
                  pinnedMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-2 rounded bg-[#1e1f22] text-xs text-[#dbdee1] space-y-1 border border-[#35373c]/50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{msg.author.username}</span>
                        <span className="text-[10px] text-[#949ba4]">{msg.timestamp}</span>
                      </div>
                      <p className="line-clamp-3 text-[#b5bac1]">{msg.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Member List Toggle (only in servers) */}
          {activeServerId && (
            <button
              onClick={toggleMemberList}
              className={`p-1.5 rounded hover:bg-[#35373c] hover:text-[#dbdee1] transition-colors cursor-pointer hidden lg:block ${
                isMemberListOpen ? 'text-white' : 'text-[#80848e]'
              }`}
              title={isMemberListOpen ? 'Hide Member List' : 'Show Member List'}
            >
              <Users className="w-4 h-4" />
            </button>
          )}

          {/* Mobile Member drawer button */}
          {activeServerId && (
            <button
              onClick={() => setMobileMembersOpen(true)}
              className="lg:hidden p-1.5 rounded hover:bg-[#35373c] hover:text-white cursor-pointer"
              title="Members"
            >
              <Users className="w-4 h-4" />
            </button>
          )}

          {/* Search Box */}
          <div className="relative hidden sm:flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-36 focus:w-56 transition-all duration-200 h-6 px-2 pr-6 bg-[#1e1f22] text-xs text-white placeholder-[#949ba4] rounded focus:outline-none"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 text-[#949ba4] hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <Search className="w-3 h-3 text-[#949ba4] absolute right-1.5 pointer-events-none" />
            )}
          </div>
        </div>
      </header>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        {/* Welcome Channel Banner */}
        <div className="pt-6 pb-2 space-y-2">
          <div className="w-16 h-16 rounded-full bg-[#404249] flex items-center justify-center text-white">
            {activeServerId ? <Hash className="w-10 h-10" /> : <span className="text-3xl font-bold">@</span>}
          </div>
          <h1 className="text-2xl font-bold text-white">
            {activeServerId ? `Welcome to #${channelTitle}!` : channelTitle}
          </h1>
          <p className="text-sm text-[#949ba4]">
            {activeServerId
              ? `This is the start of the #${channelTitle} channel.`
              : `This is the direct message history with ${channelTitle}.`}
          </p>
          <div className="h-[1px] bg-[#3f4147] my-4" />
        </div>

        {/* Render Messages */}
        {filteredMessages.map((msg) => {
          const isOwn = msg.author.id === currentUser.id;

          return (
            <motion.div
              key={msg.id}
              layout="position"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="group relative -mx-4 px-4 py-1 hover:bg-[#2e3035]/60 transition-colors flex flex-col gap-1 rounded-sm"
            >
              {/* Replying-to Quote Header */}
              {msg.replyTo && (
                <div className="flex items-center gap-1.5 text-xs text-[#949ba4] ml-11 mb-0.5">
                  <div className="w-5 h-2.5 border-l-2 border-t-2 border-[#4e5058] rounded-tl-sm -mb-2" />
                  <span className="font-semibold text-[#dbdee1]">@{msg.replyTo.author.username}</span>
                  <span className="line-clamp-1 italic text-[#949ba4]">{msg.replyTo.content}</span>
                </div>
              )}

              <div className="flex items-start gap-4">
                {/* Author Avatar */}
                <button
                  onClick={() => setActiveProfileUser(msg.author)}
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <AvatarWithStatus
                    src={msg.author.avatar}
                    alt={msg.author.username}
                    size="md"
                    status={msg.author.status}
                  />
                </button>

                {/* Message Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <button
                      onClick={() => setActiveProfileUser(msg.author)}
                      className="font-medium text-white hover:underline cursor-pointer text-sm"
                    >
                      {msg.author.username}
                    </button>
                    {msg.author.badges?.includes('bot') && (
                      <span className="bg-[#5865F2] text-white text-[10px] font-bold px-1 rounded uppercase leading-tight">
                        BOT
                      </span>
                    )}
                    <span className="text-[11px] text-[#949ba4]">{msg.timestamp}</span>
                  </div>

                  <div className="text-sm text-[#dbdee1] mt-0.5 select-text">
                    {renderMessageContent(msg.content)}
                  </div>

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.attachments.map((att) => (
                        <div key={att.id} className="relative group/att rounded-lg overflow-hidden max-w-sm">
                          <img
                            src={att.url}
                            alt={att.name}
                            onClick={() => setActiveLightboxImage(att.url)}
                            className="max-h-64 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity border border-[#1f2023]"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reaction Chips */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.reactions.map((react, rIdx) => {
                        const hasReacted = react.users.includes(currentUser.id);
                        return (
                          <button
                            key={rIdx}
                            onClick={() => addReaction(msg.id, react.emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                              hasReacted
                                ? 'bg-[#5865F2]/20 border border-[#5865F2] text-[#5865F2]'
                                : 'bg-[#2b2d31] hover:bg-[#35373c] text-[#b5bac1] border border-transparent'
                            }`}
                          >
                            <span>{react.emoji}</span>
                            <span>{react.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Message Hover Actions Bar */}
              <div className="absolute right-4 -top-3.5 opacity-0 group-hover:opacity-100 transition-opacity bg-[#313338] border border-[#232428] shadow-md rounded-md flex items-center p-0.5 gap-0.5 text-[#b5bac1] z-10">
                <button
                  onClick={() => addReaction(msg.id, '❤️')}
                  className="p-1 hover:bg-[#35373c] hover:text-white rounded cursor-pointer"
                  title="React with Love"
                >
                  ❤️
                </button>
                <button
                  onClick={() => addReaction(msg.id, '👍')}
                  className="p-1 hover:bg-[#35373c] hover:text-white rounded cursor-pointer"
                  title="React Thumbs Up"
                >
                  👍
                </button>
                <button
                  onClick={() => addReaction(msg.id, '🔥')}
                  className="p-1 hover:bg-[#35373c] hover:text-white rounded cursor-pointer"
                  title="React Fire"
                >
                  🔥
                </button>
                <div className="w-[1px] h-3 bg-[#3f4147] mx-0.5" />
                <button
                  onClick={() => setReplyingTo(msg)}
                  className="p-1.5 hover:bg-[#35373c] hover:text-white rounded cursor-pointer"
                  title="Reply"
                >
                  <Reply className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => togglePinMessage(msg.id)}
                  className={`p-1.5 hover:bg-[#35373c] rounded cursor-pointer ${
                    msg.pinned ? 'text-[#5865F2]' : 'hover:text-white'
                  }`}
                  title={msg.pinned ? 'Unpin Message' : 'Pin Message'}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
                {isOwn && (
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className="p-1.5 hover:bg-[#35373c] hover:text-[#f23f43] rounded cursor-pointer"
                    title="Delete Message"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Animated typing indicator (DMs) */}
        <AnimatePresence>
          {dmTypingUserId && activeDmFriend?.user.id === dmTypingUserId && (
            <motion.div
              key="typing-indicator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-start gap-4 pl-0 py-1"
            >
              <AvatarWithStatus
                src={activeDmFriend.user.avatar}
                alt={activeDmFriend.user.username}
                size="md"
                status={activeDmFriend.user.status}
              />
              <div className="bg-[#2b2d31] rounded-2xl rounded-tl-md px-4 py-2.5 flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#b5bac1]"
                    animate={{ y: [0, -6, 0], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <footer className="px-4 pb-4 pt-1 bg-[#313338] shrink-0">
        {/* Reply Preview Bar */}
        {replyingTo && (
          <div className="bg-[#2b2d31] rounded-t-lg px-3 py-1.5 flex items-center justify-between text-xs text-[#b5bac1] border-b border-[#35373c]">
            <div className="flex items-center gap-1.5 truncate">
              <Reply className="w-3.5 h-3.5 text-[#5865F2]" />
              <span>Replying to</span>
              <span className="font-semibold text-white">@{replyingTo.author.username}</span>
              <span className="line-clamp-1 italic text-[#949ba4]">"{replyingTo.content}"</span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-0.5 hover:text-white rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className={`bg-[#383a40] ${replyingTo ? 'rounded-b-lg' : 'rounded-lg'} flex items-center px-4 py-2.5 gap-3`}>
          {/* File Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-[#b5bac1] hover:text-white p-1 hover:bg-[#4e5058]/40 rounded-full transition-colors cursor-pointer shrink-0"
            title="Attach Image"
          >
            <PlusCircle className="w-5 h-5" />
          </button>

          {/* Textarea Input */}
          <textarea
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={`Message #${channelTitle}`}
            className="flex-1 bg-transparent text-sm text-white placeholder-[#80848e] focus:outline-none resize-none leading-relaxed max-h-32"
          />

          {/* Emoji Picker Button */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-[#b5bac1] hover:text-white p-1 hover:bg-[#4e5058]/40 rounded transition-colors cursor-pointer"
              title="Add Emoji"
            >
              <Smile className="w-5 h-5 text-[#f0b232]" />
            </button>

            {/* Emoji Quick Picker Dropdown */}
            {showEmojiPicker && (
              <div className="absolute right-0 bottom-10 bg-[#2b2d31] border border-[#1f2023] p-2 rounded-lg shadow-2xl grid grid-cols-5 gap-1.5 z-50 w-56">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setInputContent((prev) => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="p-1.5 hover:bg-[#35373c] rounded text-lg flex items-center justify-center transition-colors cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputContent.trim()}
            className={`p-1.5 rounded-full transition-colors cursor-pointer shrink-0 ${
              inputContent.trim()
                ? 'bg-[#5865F2] text-white hover:bg-[#4752c4]'
                : 'text-[#80848e] opacity-40 cursor-not-allowed'
            }`}
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </main>
  );
};
