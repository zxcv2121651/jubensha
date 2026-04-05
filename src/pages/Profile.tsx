import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, ChevronRight, History, Heart, Star, Users, Clock, Edit3 } from 'lucide-react';
import { scripts } from '@/src/data/scripts';
import { cn } from '@/src/lib/utils';

// Mock User Data
const defaultUserProfile = {
  name: '剧本杀老司机',
  id: 'ID: 839201',
  avatar: 'https://picsum.photos/seed/u1/150/150',
  bio: '推理无情，沉浸有爱。',
  stats: {
    played: 42,
    favorites: 15,
    reviews: 8
  }
};

// Mock History Data
const playHistory = [
  { id: 'h1', scriptId: '1', role: '林少爷', date: '2023-10-01', dm: '小黑', location: '线上车队' },
  { id: 'h2', scriptId: '3', role: '神秘人', date: '2023-09-15', dm: '阿白', location: '迷雾推理馆' }
];

// Mock Favorites Data
const favoriteIds = ['2', '5'];

export default function Profile() {
  const [activeTab, setActiveTab] = useState<'history' | 'favorites'>('history');
  const [avatar, setAvatar] = useState(defaultUserProfile.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedAvatar = localStorage.getItem('user_avatar');
    if (savedAvatar) {
      setAvatar(savedAvatar);
    }
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatar(base64String);
        localStorage.setItem('user_avatar', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const favoriteScripts = scripts.filter(s => favoriteIds.includes(s.id));
  const historyScripts = playHistory.map(h => ({
    ...h,
    script: scripts.find(s => s.id === h.scriptId)
  })).filter(h => h.script);

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Header Profile Section */}
      <div className="bg-white px-4 pt-8 pb-6 shadow-sm relative">
        <div className="absolute top-4 right-4 flex gap-3">
          <button className="text-neutral-600 hover:text-neutral-900">
            <Settings className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex items-center gap-4 mt-4">
          <div className="relative cursor-pointer" onClick={handleAvatarClick}>
            <img 
              src={avatar} 
              alt="avatar" 
              className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
              referrerPolicy="no-referrer"
            />
            <button className="absolute bottom-0 right-0 bg-neutral-900 text-white p-1.5 rounded-full border-2 border-white hover:bg-neutral-800 transition-colors">
              <Edit3 className="w-3 h-3" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-neutral-900">{defaultUserProfile.name}</h1>
            <p className="text-xs text-neutral-500 mt-1">{defaultUserProfile.id}</p>
            <p className="text-sm text-neutral-600 mt-2">{defaultUserProfile.bio}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-between mt-6 px-4 py-3 bg-neutral-50 rounded-2xl">
          <div className="text-center flex-1">
            <div className="text-lg font-bold text-neutral-900">{defaultUserProfile.stats.played}</div>
            <div className="text-xs text-neutral-500 mt-0.5">玩过</div>
          </div>
          <div className="w-px bg-neutral-200 my-2"></div>
          <div className="text-center flex-1">
            <div className="text-lg font-bold text-neutral-900">{defaultUserProfile.stats.favorites}</div>
            <div className="text-xs text-neutral-500 mt-0.5">收藏</div>
          </div>
          <div className="w-px bg-neutral-200 my-2"></div>
          <div className="text-center flex-1">
            <div className="text-lg font-bold text-neutral-900">{defaultUserProfile.stats.reviews}</div>
            <div className="text-xs text-neutral-500 mt-0.5">评价</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-white border-b border-neutral-100 flex">
        <button 
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors relative",
            activeTab === 'history' ? "text-red-600" : "text-neutral-500"
          )}
        >
          <History className="w-4 h-4" />
          我的战绩
          {activeTab === 'history' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-red-600 rounded-t-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('favorites')}
          className={cn(
            "flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors relative",
            activeTab === 'favorites' ? "text-red-600" : "text-neutral-500"
          )}
        >
          <Heart className="w-4 h-4" />
          我的收藏
          {activeTab === 'favorites' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-red-600 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'history' && (
          <div className="space-y-4">
            {historyScripts.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100">
                <div className="flex justify-between items-center mb-3 pb-3 border-b border-neutral-100">
                  <span className="text-xs text-neutral-500">{item.date}</span>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-sm">已完成</span>
                </div>
                <Link to={`/script/${item.scriptId}`} className="flex gap-4">
                  <img 
                    src={item.script!.cover} 
                    alt={item.script!.title} 
                    className="w-16 h-24 object-cover rounded-lg shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-neutral-900 mb-1">{item.script!.title}</h3>
                    <div className="text-xs text-neutral-600 space-y-1">
                      <p><span className="text-neutral-400">扮演角色：</span>{item.role}</p>
                      <p><span className="text-neutral-400">组局地点：</span>{item.location}</p>
                      <p><span className="text-neutral-400">主持人：</span>{item.dm}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-300 self-center" />
                </Link>
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 py-2 bg-neutral-50 text-neutral-600 text-xs font-bold rounded-lg hover:bg-neutral-100 transition-colors">
                    写评价
                  </button>
                  <button className="flex-1 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors">
                    再组一局
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="space-y-4">
            {favoriteScripts.map(script => (
              <Link key={script.id} to={`/script/${script.id}`} className="block bg-white rounded-2xl p-3 shadow-sm border border-neutral-100 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  <div className="relative w-20 h-28 shrink-0">
                    <img 
                      src={script.cover} 
                      alt={script.title} 
                      className="w-full h-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-md text-white text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span>{script.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col py-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-neutral-900 text-base leading-tight mb-1">{script.title}</h3>
                      <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {script.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-neutral-500 mt-auto">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {script.players.male + script.players.female + script.players.any}人</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {script.duration}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            
            {favoriteScripts.length === 0 && (
              <div className="text-center py-12 text-neutral-400">
                <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>暂无收藏剧本</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
