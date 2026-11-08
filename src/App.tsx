import React, { useState, useEffect, useMemo, useRef, FormEvent } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { apiUrl } from './lib/apiBase';
import { Send, MessageCircle, LogOut, RefreshCw, Music, X } from 'lucide-react';

const CHAT_KEY = 'global';

interface ChatMessage {
  id: string;
  channelId: string;
  author: { id: string; username: string; discriminator: string; avatar: string };
  content: string;
  timestamp: string;
}

function GlobalChat() {
  const { session, logOut } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<'syncing' | 'connected' | 'offline'>('syncing');
  const [syncing, setSyncing] = useState(false);
  const [musicOn, setMusicOn] = useState(() => {
    try { return localStorage.getItem('openchat_music_on') === '1'; }
    catch { return false; }
  });
  const pulledRef = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const user = session!;

  // Pull from server on mount
  useEffect(() => {
    const token = localStorage.getItem('openchat_token');
    if (!token) return;
    fetch(apiUrl('/api/state'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const state = data?.state;
        const list = state?.messages?.[CHAT_KEY];
        if (Array.isArray(list)) setMessages(list);
        pulledRef.current = true;
        setStatus('connected');
      })
      .catch(() => {
        pulledRef.current = true;
        setStatus('offline');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push to server, debounced
  useEffect(() => {
    if (!pulledRef.current) return;
    const token = localStorage.getItem('openchat_token');
    if (!token) return;
    const t = setTimeout(() => {
      fetch(apiUrl('/api/state'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ state: { messages: { [CHAT_KEY]: messages } } }),
      })
        .then(() => setStatus('connected'))
        .catch(() => setStatus('offline'));
    }, 700);
    return () => clearTimeout(t);
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = (e?: FormEvent) => {
    e?.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        channelId: CHAT_KEY,
        author: {
          id: user.id,
          username: user.username,
          discriminator: user.discriminator,
          avatar: user.avatar,
        },
        content,
        timestamp: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setDraft('');
  };

  const toggleMusic = () => {
    setMusicOn((v) => {
      const next = !v;
      try { localStorage.setItem('openchat_music_on', next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  };

  const refresh = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('openchat_token');
      const r = await fetch(apiUrl('/api/state'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = r.ok ? await r.json() : null;
      const list = data?.state?.messages?.[CHAT_KEY];
      if (Array.isArray(list)) setMessages(list);
      setStatus('connected');
    } catch {
      setStatus('offline');
    } finally {
      setSyncing(false);
    }
  };

  const dot = useMemo(
    () => (status === 'connected' ? 'bg-green-500' : status === 'offline' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'),
    [status]
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#1e1f22] text-[#dbdee1] font-sans antialiased select-none">
      <div className="flex flex-col w-full max-w-3xl mx-auto h-full border-x border-[#232428]">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 h-14 bg-[#2b2d31] border-b border-[#232428] shrink-0">
          <MessageCircle className="w-5 h-5 text-[#5865F2]" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white leading-tight">OpenChat V2</div>
            <div className="text-[10px] text-[#949ba4] leading-tight">Global chat</div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#949ba4]">
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            {status === 'connected' ? 'Synced' : status === 'offline' ? 'Offline' : 'Syncing…'}
          </div>
          <button
            onClick={toggleMusic}
            className={`p-2 rounded-md transition-colors ${musicOn ? 'bg-[#5865F2]/20 text-[#5865F2]' : 'text-[#949ba4] hover:text-white hover:bg-[#35373c]'}`}
            title="Music"
          >
            <Music className="w-4 h-4" />
          </button>
          <button
            onClick={refresh}
            className="p-2 rounded-md text-[#949ba4] hover:text-white hover:bg-[#35373c] transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={logOut}
            className="p-2 rounded-md text-[#f23f43] hover:bg-[#f23f43]/10 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Music player — embeds the song */}
        {musicOn && (
          <div className="shrink-0 relative bg-black border-b border-[#232428]">
            <iframe
              title="OpenChat Music"
              src="https://www.youtube.com/embed/9suR53954uM?autoplay=1&loop=1&playlist=9suR53954uM&rel=0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="w-full h-44"
            />
            <button
              onClick={() => setMusicOn(false)}
              title="Close player"
              className="absolute top-2 right-2 p-1.5 rounded-md bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-2">
              <MessageCircle className="w-10 h-10 text-[#5865F2]" />
              <div className="text-lg font-bold text-white">Welcome to OpenChat V2</div>
              <div className="text-sm text-[#949ba4] max-w-xs">
                This is the single global chat. Say hi — messages sync across web, desktop, Android and iOS.
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const own = m.author.id === user.id;
              const initial = (m.author.username || '?')[0].toUpperCase();
              return (
                <div key={m.id} className="flex items-start gap-2">
                  <div
                    className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      own ? 'bg-[#5865F2]' : 'bg-[#404249]'
                    }`}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-xs font-bold ${own ? 'text-[#5865F2]' : 'text-white'}`}>
                        {m.author.username}
                      </span>
                      <span className="text-[10px] text-[#949ba4]">{m.timestamp}</span>
                    </div>
                    <div className="text-sm text-[#dbdee1] whitespace-pre-wrap break-words">{m.content}</div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        <form onSubmit={send} className="shrink-0 p-3 bg-[#2b2d31] border-t border-[#232428]">
          <div className="flex items-center gap-2 bg-[#383a40] rounded-2xl pl-4 pr-1.5 py-1.5 focus-within:ring-1 focus-within:ring-[#5865F2]">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Message #global"
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder-[#949ba4] py-1.5"
              autoFocus
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="p-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Send"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AuthGate() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#1e1f22] text-[#949ba4]">
        Loading…
      </div>
    );
  }

  if (!session) return <AuthScreen />;
  return <GlobalChat />;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
