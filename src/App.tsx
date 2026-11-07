import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DiscordProvider, useDiscord } from './context/DiscordContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { ServerRail } from './components/server-rail/ServerRail';
import { ChannelSidebar } from './components/sidebar/ChannelSidebar';
import { ChatArea } from './components/chat/ChatArea';
import { VoiceRoom } from './components/chat/VoiceRoom';
import { FriendsHub } from './components/friends/FriendsHub';
import { MemberList } from './components/members/MemberList';
import { UserSettingsModal } from './components/modals/UserSettingsModal';
import { CreateServerModal } from './components/modals/CreateServerModal';
import { CreateChannelModal } from './components/modals/CreateChannelModal';
import { InviteModal } from './components/modals/InviteModal';
import { UserProfilePopover } from './components/modals/UserProfilePopover';
import { LightboxModal } from './components/modals/LightboxModal';

const DiscordApp: React.FC = () => {
  const { activeServerId, activeDmFriendId, activeChannel } = useDiscord();

  // Determine main view
  const isDirectMessagesFriendsView = activeServerId === null && activeDmFriendId === null;
  const isVoiceChannelActive =
    activeChannel && (activeChannel.type === 'voice' || activeChannel.type === 'stage');
  const viewKey = isDirectMessagesFriendsView ? 'friends' : isVoiceChannelActive ? 'voice' : 'chat';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#1e1f22] text-[#dbdee1] font-sans antialiased select-none">
      {/* 1. Left 72px Server Rail */}
      <ServerRail />

      {/* 2. Channel & Direct Messages Sidebar */}
      <ChannelSidebar />

      {/* 3. Main Center Content View (animated transitions between views) */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={viewKey}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="flex-1 flex min-w-0 h-full"
        >
          {isDirectMessagesFriendsView ? (
            <FriendsHub />
          ) : isVoiceChannelActive ? (
            <VoiceRoom />
          ) : (
            <ChatArea />
          )}
        </motion.div>
      </AnimatePresence>

      {/* 4. Right Members Sidebar (Only in Servers and when not in Voice stage) */}
      {activeServerId && !isVoiceChannelActive && <MemberList />}

      {/* 5. Modals & Popovers */}
      <UserSettingsModal />
      <CreateServerModal />
      <CreateChannelModal />
      <InviteModal />
      <UserProfilePopover />
      <LightboxModal />
    </div>
  );
};

// Gates the app behind account creation/login and syncs the account
// into the Discord context's currentUser.
const AuthGate: React.FC = () => {
  const { session, loading } = useAuth();
  const { updateCurrentUser } = useDiscord();

  useEffect(() => {
    if (session) {
      updateCurrentUser({
        id: session.id,
        username: session.username,
        discriminator: session.discriminator,
        avatar: session.avatar,
        customStatus: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#1e1f22] text-[#949ba4]">
        Loading…
      </div>
    );
  }

  if (!session) return <AuthScreen />;
  return <DiscordApp />;
};

export default function App() {
  return (
    <AuthProvider>
      <DiscordProvider>
        <AuthGate />
      </DiscordProvider>
    </AuthProvider>
  );
}
