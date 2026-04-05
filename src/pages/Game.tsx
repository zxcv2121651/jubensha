import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { scripts } from '@/src/data/scripts';
import { Mic, MicOff, MessageSquare, BookOpen, Search, Settings, ChevronLeft, PhoneOff, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import Peer, { MediaConnection } from 'peerjs';
import { cn } from '@/src/lib/utils';

interface RoomUser {
  id: string;
  peerId: string;
  name: string;
  avatar: string;
  isMuted: boolean;
  status?: 'online' | 'away' | 'inactive';
}

export default function Game() {
  const { id } = useParams();
  const navigate = useNavigate();
  const script = scripts.find(s => s.id === id);
  
  const [activeTab, setActiveTab] = useState<'script' | 'clues' | 'chat' | 'summary'>('script');
  const [expandedActs, setExpandedActs] = useState<string[]>(
    script?.acts ? [script.acts[0].id] : []
  );
  const [expandedSummary, setExpandedSummary] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [clueSearchQuery, setClueSearchQuery] = useState('');
  const [clueFilterType, setClueFilterType] = useState<'all' | 'location' | 'item' | 'character'>('all');
  
  // Real-time states
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{id: number, message: string}[]>([]);
  
  // Status and speaking states
  const myStatusRef = useRef<'online' | 'away' | 'inactive'>('online');
  const [speakingUsers, setSpeakingUsers] = useState<Record<string, boolean>>({});
  const speakingUsersRef = useRef<Record<string, boolean>>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Map<string, AnalyserNode>>(new Map());
  const animationFrameRef = useRef<number | undefined>(undefined);
  
  // Volume state
  const [userVolumes, setUserVolumes] = useState<Record<string, number>>({});
  const userVolumesRef = useRef<Record<string, number>>({});

  // Media streams
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const callsRef = useRef<Map<string, MediaConnection>>(new Map());
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  const handleVolumeChange = (peerId: string, volume: number) => {
    setUserVolumes(prev => ({ ...prev, [peerId]: volume }));
    userVolumesRef.current[peerId] = volume;
    const audioEl = audioRefs.current.get(peerId);
    if (audioEl) {
      audioEl.volume = volume;
    }
  };

  const setupAudioAnalyser = (peerId: string, stream: MediaStream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Check if there are audio tracks
    if (stream.getAudioTracks().length === 0) return;
    
    try {
      const audioStream = new MediaStream(stream.getAudioTracks());
      const source = audioContextRef.current.createMediaStreamSource(audioStream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analysersRef.current.set(peerId, analyser);
    } catch (e) {
      console.error('Error setting up audio analyser:', e);
    }
  };

  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    let inactiveTimer: NodeJS.Timeout;

    const resetTimers = () => {
      if (myStatusRef.current !== 'online') {
        myStatusRef.current = 'online';
        socket?.emit('update-status', 'online');
      }
      clearTimeout(idleTimer);
      clearTimeout(inactiveTimer);

      idleTimer = setTimeout(() => {
        myStatusRef.current = 'away';
        socket?.emit('update-status', 'away');
      }, 5 * 60 * 1000); // 5 minutes

      inactiveTimer = setTimeout(() => {
        myStatusRef.current = 'inactive';
        socket?.emit('update-status', 'inactive');
      }, 15 * 60 * 1000); // 15 minutes
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimers));
    resetTimers();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimers));
      clearTimeout(idleTimer);
      clearTimeout(inactiveTimer);
    };
  }, [socket]);

  useEffect(() => {
    const checkAudioLevels = () => {
      const newSpeakingUsers: Record<string, boolean> = {};
      let hasChanges = false;

      analysersRef.current.forEach((analyser, peerId) => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const isSpeaking = average > 10; // Threshold
        
        if (speakingUsersRef.current[peerId] !== isSpeaking) {
          hasChanges = true;
        }
        newSpeakingUsers[peerId] = isSpeaking;
      });

      if (hasChanges) {
        setSpeakingUsers(newSpeakingUsers);
        speakingUsersRef.current = newSpeakingUsers;
      }

      animationFrameRef.current = requestAnimationFrame(checkAudioLevels);
    };

    animationFrameRef.current = requestAnimationFrame(checkAudioLevels);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!script) return;

    // Initialize Socket.io
    const newSocket = io();
    setSocket(newSocket);

    // Initialize PeerJS
    const newPeer = new Peer();
    setPeer(newPeer);

    const setupPeer = (stream?: MediaStream) => {
      newPeer.on('open', (peerId) => {
        // Join room via socket
        const myProfile = {
          peerId,
          name: `玩家_${Math.floor(Math.random() * 1000)}`,
          avatar: `https://picsum.photos/seed/${peerId}/32/32`
        };
        newSocket.emit('join-room', id, myProfile);
        setIsConnected(true);
      });

      // Answer incoming calls
      newPeer.on('call', (call) => {
        call.answer(stream);
        call.on('stream', (remoteStream) => {
          remoteStreamsRef.current.set(call.peer, remoteStream);
          playRemoteStream(call.peer, remoteStream);
        });
        callsRef.current.set(call.peer, call);
      });
    };

    // Get local audio stream
    navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }, 
      video: false 
    })
      .then(stream => {
        // Mute local stream track initially
        stream.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
        localStreamRef.current = stream;
        setupAudioAnalyser('local', stream);
        setupPeer(stream);
      })
      .catch(err => {
        console.error('Failed to get local stream', err);
        setStreamError('无法获取麦克风权限，您将只能收听其他玩家的语音。请确保已授予麦克风权限。');
        setupPeer(undefined);
      });

    // Socket events
    newSocket.on('room-users', (roomUsers: RoomUser[]) => {
      setUsers(roomUsers);
      // Call existing users
      if (newPeer) {
        roomUsers.forEach(user => {
          if (user.id !== newSocket.id && user.peerId) {
            // If we don't have a local stream, we can still call, but we won't send audio
            // PeerJS allows calling without a stream, but we need to pass something or omit it
            const call = localStreamRef.current 
              ? newPeer.call(user.peerId, localStreamRef.current)
              : newPeer.call(user.peerId, new MediaStream()); // Send empty stream if no local stream
              
            call.on('stream', (remoteStream) => {
              remoteStreamsRef.current.set(user.peerId, remoteStream);
              playRemoteStream(user.peerId, remoteStream);
            });
            callsRef.current.set(user.peerId, call);
          }
        });
      }
    });

    const addToast = (message: string) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, message }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };

    newSocket.on('user-joined', (user: RoomUser) => {
      setUsers(prev => [...prev, user]);
      addToast(`${user.name} 加入了房间`);
    });

    newSocket.on('user-left', (userId: string) => {
      setUsers(prev => {
        const user = prev.find(u => u.id === userId);
        if (user) {
          addToast(`${user.name} 离开了房间`);
          const call = callsRef.current.get(user.peerId);
          if (call) {
            call.close();
            callsRef.current.delete(user.peerId);
          }
          remoteStreamsRef.current.delete(user.peerId);
          
          const audioEl = audioRefs.current.get(user.peerId);
          if (audioEl) {
            audioEl.srcObject = null;
            audioRefs.current.delete(user.peerId);
          }
        }
        return prev.filter(u => u.id !== userId);
      });
    });

    newSocket.on('user-muted', ({ userId, isMuted }: { userId: string, isMuted: boolean }) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isMuted } : u));
    });

    newSocket.on('user-status-changed', ({ userId, status }: { userId: string, status: 'online' | 'away' | 'inactive' }) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
    });

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      callsRef.current.forEach(call => call.close());
      newPeer.destroy();
      newSocket.disconnect();
    };
  }, [id, script]);

  useEffect(() => {
    if (searchQuery.trim() && script?.acts) {
      const query = searchQuery.toLowerCase();
      const matchingActs = script.acts.filter(act => 
        act.title.toLowerCase().includes(query) ||
        act.content.some(p => p.toLowerCase().includes(query)) ||
        act.tasks?.some(t => t.toLowerCase().includes(query))
      ).map(a => a.id);
      
      if (matchingActs.length > 0) {
        setExpandedActs(prev => Array.from(new Set([...prev, ...matchingActs])));
      }
    }
  }, [searchQuery, script]);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <span key={i} className="bg-red-500/50 text-white rounded px-0.5">{part}</span> 
        : part
    );
  };

  const playRemoteStream = (peerId: string, stream: MediaStream) => {
    // Create audio element if it doesn't exist
    if (!audioRefs.current.has(peerId)) {
      const audio = new Audio();
      audio.autoplay = true;
      audio.volume = userVolumesRef.current[peerId] ?? 1;
      audioRefs.current.set(peerId, audio);
    }
    const audioEl = audioRefs.current.get(peerId)!;
    audioEl.srcObject = stream;
    setupAudioAnalyser(peerId, stream);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted; // If currently muted, enable it
        setIsMuted(!isMuted);
        if (socket) {
          socket.emit('toggle-mute', !isMuted);
        }
      }
    }
  };

  const leaveRoom = () => {
    navigate(-1);
  };

  const toggleAct = (actId: string) => {
    setExpandedActs(prev => 
      prev.includes(actId) 
        ? prev.filter(id => id !== actId)
        : [...prev, actId]
    );
  };

  const toggleSummarySection = (section: string) => {
    setExpandedSummary(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const filteredClues = script?.clues?.filter(clue => {
    const matchesSearch = clue.title.toLowerCase().includes(clueSearchQuery.toLowerCase()) || 
                          clue.description.toLowerCase().includes(clueSearchQuery.toLowerCase());
    const matchesType = clueFilterType === 'all' || clue.type === clueFilterType;
    return matchesSearch && matchesType;
  }) || [];

  if (!script) return <div>剧本未找到</div>;

  return (
    <div className="h-screen bg-neutral-900 text-white flex flex-col font-sans overflow-hidden">
      {/* Toast Notifications */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="bg-neutral-800/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs shadow-xl animate-in fade-in slide-in-from-top-2 duration-300 text-center border border-neutral-700">
            {toast.message}
          </div>
        ))}
      </div>

      {/* Game Header */}
      <header className="bg-neutral-950 px-4 py-3 flex items-center justify-between border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <button onClick={leaveRoom} className="text-neutral-400 hover:text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="font-bold text-sm">{script.title}</h1>
            <span className="text-[10px] flex items-center gap-1 text-green-400">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`}></span>
              {isConnected ? '已连接语音房间' : '连接中...'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleMute} 
            className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button onClick={leaveRoom} className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors">
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Players Bar */}
      <div className="bg-neutral-950/50 p-3 flex gap-3 overflow-x-auto scrollbar-hide border-b border-neutral-800">
        {users.map((user) => {
          const isMe = user.id === socket?.id;
          const isSpeaking = isMe ? speakingUsers['local'] && !isMuted : speakingUsers[user.peerId] && !user.isMuted;
          const status = isMe ? myStatusRef.current : (user.status || 'online');
          
          return (
          <div key={user.id} className="flex flex-col items-center gap-1 min-w-[60px]">
            <div className={cn(
              "relative w-12 h-12 rounded-full p-0.5 transition-all duration-200",
              isSpeaking ? "bg-green-500 scale-110 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : (isMe ? "bg-red-500" : "bg-neutral-700"),
              status === 'inactive' && "opacity-50 grayscale"
            )}>
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover border-2 border-neutral-900" referrerPolicy="no-referrer" />
              {user.isMuted && (
                <div className="absolute bottom-0 right-0 bg-neutral-800 rounded-full p-0.5">
                  <MicOff className="w-3 h-3 text-red-500" />
                </div>
              )}
              {status === 'away' && !user.isMuted && (
                <div className="absolute top-0 right-0 bg-yellow-500 w-3 h-3 rounded-full border-2 border-neutral-900" title="离开 (Away)"></div>
              )}
              {status === 'inactive' && !user.isMuted && (
                <div className="absolute top-0 right-0 bg-neutral-500 w-3 h-3 rounded-full border-2 border-neutral-900" title="不活跃 (Inactive)"></div>
              )}
            </div>
            <span className="text-[10px] text-neutral-300 truncate w-full text-center">
              {isMe ? '我' : user.name}
            </span>
            {!isMe && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={userVolumes[user.peerId] ?? 1}
                onChange={(e) => handleVolumeChange(user.peerId, parseFloat(e.target.value))}
                className="w-10 h-1 mt-0.5 accent-red-500 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                title={`调整 ${user.name} 的音量`}
              />
            )}
          </div>
        )})}
        {users.length === 0 && (
          <div className="text-xs text-neutral-500 py-4 w-full text-center">
            正在加入房间...
          </div>
        )}
      </div>

      {streamError && (
        <div className="bg-red-900/50 text-red-200 text-xs px-4 py-2 flex items-center justify-between border-b border-red-800/50">
          <span>{streamError}</span>
          <button onClick={() => setStreamError(null)} className="text-red-400 hover:text-red-200">
            &times;
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {/* Tab Navigation */}
        <div className="flex bg-neutral-900 border-b border-neutral-800">
          <button 
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'script' ? 'text-red-500 border-b-2 border-red-500' : 'text-neutral-400'}`}
            onClick={() => setActiveTab('script')}
          >
            <BookOpen className="w-4 h-4" />剧本
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'clues' ? 'text-red-500 border-b-2 border-red-500' : 'text-neutral-400'}`}
            onClick={() => setActiveTab('clues')}
          >
            <Search className="w-4 h-4" />线索
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'summary' ? 'text-red-500 border-b-2 border-red-500' : 'text-neutral-400'}`}
            onClick={() => setActiveTab('summary')}
          >
            <ClipboardList className="w-4 h-4" />复盘
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'text-red-500 border-b-2 border-red-500' : 'text-neutral-400'}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare className="w-4 h-4" />公聊
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-neutral-900">
          <div className={cn("space-y-6 pb-6", activeTab === 'script' ? "block" : "hidden")}>
            {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="在剧本中搜索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-500 border border-neutral-700"
                />
                <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* Synopsis */}
              <div className="bg-neutral-800/30 p-5 rounded-2xl border border-neutral-800">
                <h2 className="text-lg font-bold text-neutral-100 mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-red-500" />
                  剧本简介
                </h2>
                <p className="text-sm text-neutral-300 leading-relaxed text-justify indent-6">
                  {highlightText(script.description, searchQuery)}
                </p>
              </div>

              {/* Acts */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-neutral-400 px-1">剧本章节</h3>
                {script.acts ? script.acts.map((act) => {
                  const isExpanded = expandedActs.includes(act.id);
                  return (
                    <div key={act.id} className="bg-neutral-800/50 rounded-2xl border border-neutral-700 overflow-hidden transition-all">
                      <button 
                        onClick={() => toggleAct(act.id)}
                        className="w-full px-5 py-4 flex items-center justify-between bg-neutral-800 hover:bg-neutral-700/80 transition-colors"
                      >
                        <span className="font-bold text-neutral-100">{highlightText(act.title, searchQuery)}</span>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
                      </button>
                      
                      <div className={cn(
                        "p-5 border-t border-neutral-700/50",
                        isExpanded ? "block animate-in slide-in-from-top-2 duration-200" : "hidden"
                      )}>
                        <div className="space-y-4">
                          {act.content.map((paragraph, i) => (
                            <p key={i} className="text-sm text-neutral-300 leading-relaxed text-justify indent-6">
                              {highlightText(paragraph, searchQuery)}
                            </p>
                          ))}
                        </div>
                        
                        {act.tasks && act.tasks.length > 0 && (
                          <div className="mt-6 bg-red-950/20 p-4 rounded-xl border border-red-900/30">
                            <h4 className="text-red-400 font-bold mb-3 text-sm flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              本幕任务
                            </h4>
                            <ul className="list-disc list-inside text-sm text-neutral-300 space-y-2">
                              {act.tasks.map((task, i) => (
                                <li key={i}>{highlightText(task, searchQuery)}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-8 text-neutral-500 text-sm">
                    暂无章节内容
                  </div>
                )}
              </div>
          </div>

          <div className={cn("flex-col gap-4 pb-6", activeTab === 'clues' ? "flex" : "hidden")}>
            {/* Search and Filter */}
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索线索..."
                  value={clueSearchQuery}
                  onChange={(e) => setClueSearchQuery(e.target.value)}
                  className="w-full bg-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-500 border border-neutral-700"
                />
                <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                <button
                  onClick={() => setClueFilterType('all')}
                  className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors", clueFilterType === 'all' ? "bg-red-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700")}
                >
                  全部
                </button>
                <button
                  onClick={() => setClueFilterType('location')}
                  className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors", clueFilterType === 'location' ? "bg-red-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700")}
                >
                  地点
                </button>
                <button
                  onClick={() => setClueFilterType('item')}
                  className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors", clueFilterType === 'item' ? "bg-red-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700")}
                >
                  物品
                </button>
                <button
                  onClick={() => setClueFilterType('character')}
                  className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors", clueFilterType === 'character' ? "bg-red-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700")}
                >
                  人物
                </button>
              </div>
            </div>

            {/* Clues Grid */}
            <div className="grid grid-cols-2 gap-3">
              {filteredClues.length > 0 ? filteredClues.map(clue => (
                <div key={clue.id} className="bg-neutral-800 rounded-xl p-3 border border-neutral-700 flex flex-col">
                  <div className="aspect-square bg-neutral-900 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden">
                    <Search className="w-8 h-8 text-neutral-600" />
                    {!clue.isPublic && (
                      <div className="absolute top-1 right-1 bg-red-900/80 text-red-200 text-[8px] px-1.5 py-0.5 rounded">私密</div>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-neutral-200 line-clamp-1">{highlightText(clue.title, clueSearchQuery)}</h4>
                  <p className="text-[10px] text-neutral-400 mt-1 line-clamp-2 flex-1">{highlightText(clue.description, clueSearchQuery)}</p>
                </div>
              )) : (
                <div className="col-span-2 text-center py-8 text-neutral-500 text-sm">
                  没有找到匹配的线索
                </div>
              )}
            </div>
          </div>

          <div className={cn("space-y-4 pb-6", activeTab === 'summary' ? "block" : "hidden")}>
            <h2 className="text-lg font-bold text-neutral-100 mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-red-500" />
                案件复盘
              </h2>

              {/* Plot Points */}
              <div className="bg-neutral-800/50 rounded-2xl border border-neutral-700 overflow-hidden transition-all">
                <button
                  onClick={() => toggleSummarySection('plot')}
                  className="w-full px-5 py-4 flex items-center justify-between bg-neutral-800 hover:bg-neutral-700/80 transition-colors"
                >
                  <span className="font-bold text-neutral-100">关键剧情点</span>
                  {expandedSummary.includes('plot') ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
                </button>
                <div className={cn(
                  "p-5 border-t border-neutral-700/50",
                  expandedSummary.includes('plot') ? "block animate-in slide-in-from-top-2 duration-200" : "hidden"
                )}>
                  <ul className="list-disc list-inside text-sm text-neutral-300 space-y-2">
                    {script.summary?.plotPoints ? (
                      script.summary.plotPoints.map((point, i) => <li key={i}>{point}</li>)
                    ) : (
                      <li className="text-neutral-500 list-none text-center">暂无剧情点记录</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Relationships */}
              <div className="bg-neutral-800/50 rounded-2xl border border-neutral-700 overflow-hidden transition-all">
                <button
                  onClick={() => toggleSummarySection('relationships')}
                  className="w-full px-5 py-4 flex items-center justify-between bg-neutral-800 hover:bg-neutral-700/80 transition-colors"
                >
                  <span className="font-bold text-neutral-100">人物关系</span>
                  {expandedSummary.includes('relationships') ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
                </button>
                <div className={cn(
                  "p-5 border-t border-neutral-700/50",
                  expandedSummary.includes('relationships') ? "block animate-in slide-in-from-top-2 duration-200" : "hidden"
                )}>
                  <div className="space-y-3">
                    {script.summary?.relationships ? (
                      script.summary.relationships.map((rel, i) => (
                        <div key={i} className="bg-neutral-900/50 p-3 rounded-lg border border-neutral-800">
                          <span className="text-red-400 font-bold mr-2">{rel.character}:</span>
                          <span className="text-sm text-neutral-300">{rel.relation}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-neutral-500 text-center text-sm">暂无人物关系记录</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Evidence */}
              <div className="bg-neutral-800/50 rounded-2xl border border-neutral-700 overflow-hidden transition-all">
                <button
                  onClick={() => toggleSummarySection('evidence')}
                  className="w-full px-5 py-4 flex items-center justify-between bg-neutral-800 hover:bg-neutral-700/80 transition-colors"
                >
                  <span className="font-bold text-neutral-100">已搜集证据</span>
                  {expandedSummary.includes('evidence') ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
                </button>
                <div className={cn(
                  "p-5 border-t border-neutral-700/50",
                  expandedSummary.includes('evidence') ? "block animate-in slide-in-from-top-2 duration-200" : "hidden"
                )}>
                  <ul className="list-disc list-inside text-sm text-neutral-300 space-y-2">
                    {script.summary?.evidence ? (
                      script.summary.evidence.map((ev, i) => <li key={i}>{ev}</li>)
                    ) : (
                      <li className="text-neutral-500 list-none text-center">暂无证据记录</li>
                    )}
                  </ul>
                </div>
              </div>
          </div>

          <div className={cn("flex-col h-full", activeTab === 'chat' ? "flex" : "hidden")}>
              <div className="flex-1 space-y-4 mb-4">
                <div className="flex gap-3">
                  <img src="https://picsum.photos/seed/c2/32/32" className="w-8 h-8 rounded-full" alt="avatar" />
                  <div className="bg-neutral-800 rounded-2xl rounded-tl-none p-3 max-w-[80%]">
                    <p className="text-sm text-neutral-200">我刚才一直在前厅招待客人，根本没去过后院。</p>
                  </div>
                </div>
                <div className="flex gap-3 flex-row-reverse">
                  <img src="https://picsum.photos/seed/c1/32/32" className="w-8 h-8 rounded-full" alt="avatar" />
                  <div className="bg-red-600 rounded-2xl rounded-tr-none p-3 max-w-[80%]">
                    <p className="text-sm text-white">可是有人看到你往后院的方向去了。</p>
                  </div>
                </div>
              </div>
              <div className="relative mt-auto">
                <input 
                  type="text" 
                  placeholder="发送消息..." 
                  className="w-full bg-neutral-800 rounded-full py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white">
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
          </div>
        </div>
      </main>
    </div>
  );
}
