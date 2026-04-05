import { useState } from 'react';
import { Link } from 'react-router-dom';
import { scripts } from '@/src/data/scripts';
import { Users, Clock, MapPin, Search, Filter, Plus, X, Check } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface Team {
  id: string;
  scriptId: string;
  host: string;
  hostAvatar: string;
  time: string;
  currentPlayers: number;
  targetPlayers: number;
  isJoined: boolean;
}

const initialTeams: Team[] = [
  { id: 't1', scriptId: '1', host: '剧本杀老司机', hostAvatar: 'https://picsum.photos/seed/u1/32/32', time: '今天 20:00 开局', currentPlayers: 4, targetPlayers: 6, isJoined: false },
  { id: 't2', scriptId: '2', host: '推理小白', hostAvatar: 'https://picsum.photos/seed/u2/32/32', time: '明天 14:00 开局', currentPlayers: 2, targetPlayers: 7, isJoined: false },
  { id: 't3', scriptId: '3', host: '硬核玩家', hostAvatar: 'https://picsum.photos/seed/u3/32/32', time: '周五 19:30 开局', currentPlayers: 5, targetPlayers: 6, isJoined: false },
];

export default function Lobby() {
  const [activeTab, setActiveTab] = useState<'online' | 'offline'>('online');
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create Team Form State
  const [newTeamScript, setNewTeamScript] = useState(scripts[0].id);
  const [newTeamTime, setNewTeamTime] = useState('今天 20:00');

  const handleJoin = (teamId: string) => {
    setTeams(teams.map(t => {
      if (t.id === teamId) {
        if (t.isJoined) return t; // Already joined
        return { ...t, currentPlayers: t.currentPlayers + 1, isJoined: true };
      }
      return t;
    }));
  };

  const handleCreateTeam = () => {
    const script = scripts.find(s => s.id === newTeamScript);
    if (!script) return;
    
    const targetPlayers = script.players.male + script.players.female + script.players.any;
    
    const newTeam: Team = {
      id: `t${Date.now()}`,
      scriptId: newTeamScript,
      host: '我 (房主)',
      hostAvatar: 'https://picsum.photos/seed/me/32/32',
      time: `${newTeamTime} 开局`,
      currentPlayers: 1,
      targetPlayers,
      isJoined: true
    };
    
    setTeams([newTeam, ...teams]);
    setShowCreateModal(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 relative">
      {/* Header */}
      <header className="bg-white px-4 py-4 sticky top-0 z-30 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-4">组局大厅</h1>
        
        <div className="flex bg-neutral-100 p-1 rounded-xl mb-4">
          <button 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'online' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'}`}
            onClick={() => setActiveTab('online')}
          >
            线上车队
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'offline' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'}`}
            onClick={() => setActiveTab('offline')}
          >
            线下门店
          </button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="搜索车队、剧本..." 
              className="w-full bg-neutral-100 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none"
            />
          </div>
          <button className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-600">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Lobby List */}
      <div className="p-4 space-y-4">
        {teams.map((team) => {
          const script = scripts.find(s => s.id === team.scriptId);
          if (!script) return null;
          
          const isFull = team.currentPlayers >= team.targetPlayers;
          const missingPlayers = team.targetPlayers - team.currentPlayers;

          return (
            <div key={team.id} className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100">
              <div className="flex gap-4">
                <Link to={`/script/${script.id}`} className="shrink-0">
                  <img 
                    src={script.cover} 
                    alt={script.title} 
                    className="w-20 h-28 object-cover rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                </Link>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-neutral-900">{script.title}</h3>
                      {!isFull ? (
                        <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-sm">
                          缺{missingPlayers}人
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-sm">
                          已满员
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 mb-2">
                      <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-sm">{script.difficulty}</span>
                      <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-sm">语音车</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{team.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Users className="w-3.5 h-3.5" />
                      <span>已上车: {team.currentPlayers}/{team.targetPlayers}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={team.hostAvatar} className="w-6 h-6 rounded-full object-cover" alt="host" referrerPolicy="no-referrer" />
                  <span className="text-xs text-neutral-600">DM: {team.host}</span>
                </div>
                <button 
                  onClick={() => handleJoin(team.id)}
                  disabled={team.isJoined || isFull}
                  className={cn(
                    "text-sm font-bold px-6 py-2 rounded-full transition-colors flex items-center gap-1",
                    team.isJoined 
                      ? "bg-green-50 text-green-600" 
                      : isFull 
                        ? "bg-neutral-100 text-neutral-400" 
                        : "bg-neutral-900 text-white hover:bg-neutral-800"
                  )}
                >
                  {team.isJoined ? <><Check className="w-4 h-4" /> 已上车</> : isFull ? '已满员' : '上车'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-600/30 hover:bg-red-700 transition-colors z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-neutral-900">发起拼车</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-neutral-400 hover:text-neutral-900">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">选择剧本</label>
                <select 
                  value={newTeamScript}
                  onChange={(e) => setNewTeamScript(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  {scripts.map(s => (
                    <option key={s.id} value={s.id}>{s.title} ({s.players.male + s.players.female + s.players.any}人本)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">开局时间</label>
                <input 
                  type="text" 
                  value={newTeamTime}
                  onChange={(e) => setNewTeamTime(e.target.value)}
                  placeholder="例如：今天 20:00"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleCreateTeam}
                  className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors"
                >
                  确认发起
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
