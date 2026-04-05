import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Users, Clock, Filter, ChevronDown, Sparkles, Loader2 } from 'lucide-react';
import { scripts, Script } from '@/src/data/scripts';
import { cn } from '@/src/lib/utils';
import { GoogleGenAI, Type } from '@google/genai';

const FILTER_TYPES = ['全部', '悬疑', '惊悚', '古风', '现代', '情感', '欢乐', '阵营', '机制'];
const FILTER_PLAYERS = ['全部', '5人及以下', '6人', '7人', '8人及以上'];
const FILTER_DIFFICULTIES = ['全部', '新手', '进阶', '烧脑'];

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('全部');
  const [activePlayers, setActivePlayers] = useState('全部');
  const [activeDifficulty, setActiveDifficulty] = useState('全部');
  const [showFilters, setShowFilters] = useState(false);

  // AI Recommendation State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<{script: Script, reason: string}[]>([]);

  const filteredScripts = useMemo(() => {
    return scripts.filter(script => {
      // Search filter
      if (searchQuery && !script.title.includes(searchQuery) && !script.tags.some(t => t.includes(searchQuery))) {
        return false;
      }
      
      // Type filter
      if (activeType !== '全部' && !script.tags.includes(activeType)) {
        return false;
      }

      // Difficulty filter
      if (activeDifficulty !== '全部' && script.difficulty !== activeDifficulty) {
        return false;
      }

      // Players filter
      if (activePlayers !== '全部') {
        const total = script.players.male + script.players.female + script.players.any;
        if (activePlayers === '5人及以下' && total > 5) return false;
        if (activePlayers === '6人' && total !== 6) return false;
        if (activePlayers === '7人' && total !== 7) return false;
        if (activePlayers === '8人及以上' && total < 8) return false;
      }

      return true;
    });
  }, [searchQuery, activeType, activePlayers, activeDifficulty]);

  const handleAiRecommend = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      
      // Mock user profile (in a real app, this would come from the backend)
      const userProfile = {
        recentHistory: ['第七号病房'],
        favorites: ['长安夜行'],
        preferredTags: ['推理', '悬疑', '烧脑'],
        preferredDifficulty: ['进阶', '烧脑']
      };

      const availableScripts = scripts.map(s => ({
        id: s.id,
        title: s.title,
        tags: s.tags,
        difficulty: s.difficulty,
        rating: s.rating,
        description: s.description
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `你是一个专业的剧本杀DM和推荐助手。请根据用户的偏好和当前可用的剧本库，为用户推荐2个最适合的剧本。
        
        用户信息：
        ${JSON.stringify(userProfile)}
        
        可用剧本库：
        ${JSON.stringify(availableScripts)}
        
        请返回JSON数组，包含推荐的剧本ID和一段简短的、个性化的推荐理由（中文，约30字，说明为什么适合该用户）。`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "推荐的剧本ID" },
                reason: { type: Type.STRING, description: "个性化推荐理由" }
              },
              required: ["id", "reason"]
            }
          }
        }
      });

      if (response.text) {
        const result = JSON.parse(response.text);
        const recs = result.map((r: any) => ({
          script: scripts.find(s => s.id === r.id),
          reason: r.reason
        })).filter((r: any) => r.script);
        
        setAiRecommendations(recs);
      }
    } catch (error) {
      console.error("AI Recommendation failed:", error);
      alert("AI推荐生成失败，请稍后再试。");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Header & Search */}
      <header className="bg-white px-4 py-4 sticky top-0 z-40 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-4">剧本库</h1>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input 
              type="text" 
              placeholder="搜索剧本名称、类型..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-100 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-3 rounded-xl flex items-center justify-center transition-colors",
              showFilters ? "bg-red-50 text-red-600" : "bg-neutral-100 text-neutral-600"
            )}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="mt-4 space-y-4 pt-4 border-t border-neutral-100 animate-in slide-in-from-top-2 duration-200">
            {/* Types */}
            <div>
              <h3 className="text-xs font-bold text-neutral-500 mb-2">题材类型</h3>
              <div className="flex flex-wrap gap-2">
                {FILTER_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => setActiveType(type)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                      activeType === type 
                        ? "bg-neutral-900 text-white" 
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Players */}
            <div>
              <h3 className="text-xs font-bold text-neutral-500 mb-2">人数配置</h3>
              <div className="flex flex-wrap gap-2">
                {FILTER_PLAYERS.map(player => (
                  <button
                    key={player}
                    onClick={() => setActivePlayers(player)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                      activePlayers === player 
                        ? "bg-neutral-900 text-white" 
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    )}
                  >
                    {player}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <h3 className="text-xs font-bold text-neutral-500 mb-2">难度级别</h3>
              <div className="flex flex-wrap gap-2">
                {FILTER_DIFFICULTIES.map(diff => (
                  <button
                    key={diff}
                    onClick={() => setActiveDifficulty(diff)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                      activeDifficulty === diff 
                        ? "bg-neutral-900 text-white" 
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    )}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Results */}
      <div className="p-4">
        {/* AI Recommendation Section */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[1px] rounded-2xl shadow-sm">
            <div className="bg-white rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold flex items-center gap-2 text-neutral-900">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  AI 懂你推荐
                </h2>
                {!isAiLoading && (
                  <button 
                    onClick={handleAiRecommend}
                    className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-full font-medium hover:bg-purple-100 transition-colors flex items-center gap-1"
                  >
                    {aiRecommendations.length > 0 ? (
                      <>
                        <Sparkles className="w-3 h-3" />
                        重新生成推荐
                      </>
                    ) : (
                      '生成专属推荐'
                    )}
                  </button>
                )}
              </div>
              
              {isAiLoading && (
                <div className="flex flex-col items-center justify-center py-6 text-purple-500">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-xs font-medium">AI 正在深度分析您的喜好...</span>
                </div>
              )}

              {aiRecommendations.length > 0 && !isAiLoading && (
                <div className="space-y-3">
                  {aiRecommendations.map((rec, idx) => (
                    <Link key={idx} to={`/script/${rec.script.id}`} className="block bg-purple-50/50 rounded-xl p-3 border border-purple-100 hover:bg-purple-50 transition-colors">
                      <div className="flex gap-3">
                        <img src={rec.script.cover} alt={rec.script.title} className="w-16 h-20 object-cover rounded-lg shrink-0" referrerPolicy="no-referrer" />
                        <div className="flex-1">
                          <h3 className="font-bold text-sm text-neutral-900 mb-1">{rec.script.title}</h3>
                          <p className="text-xs text-purple-700 leading-relaxed bg-purple-100/50 p-2 rounded-md">
                            <span className="font-bold">AI推荐语：</span>{rec.reason}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              
              {!aiRecommendations.length && !isAiLoading && (
                <p className="text-xs text-neutral-500 leading-relaxed">
                  根据您的浏览历史、收藏记录和评价偏好，AI将为您从海量剧本中精准匹配最适合您的下一个剧本。
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-neutral-500">共找到 {filteredScripts.length} 个剧本</span>
          <button className="text-sm text-neutral-600 flex items-center gap-1">
            综合排序 <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {filteredScripts.map(script => (
            <Link key={script.id} to={`/script/${script.id}`} className="block bg-white rounded-2xl p-3 shadow-sm border border-neutral-100 hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                <div className="relative w-24 h-32 shrink-0">
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
                  <h3 className="font-bold text-neutral-900 text-lg leading-tight mb-1">{script.title}</h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {script.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <p className="text-xs text-neutral-500 line-clamp-2 mb-2 flex-1">
                    {script.description}
                  </p>
                  
                  <div className="flex items-center gap-3 text-xs text-neutral-500 mt-auto">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {script.players.male + script.players.female + script.players.any}人</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {script.duration}</span>
                    <span className="ml-auto text-red-600 font-medium">{script.difficulty}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          {filteredScripts.length === 0 && (
            <div className="text-center py-12 text-neutral-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>没有找到符合条件的剧本</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
