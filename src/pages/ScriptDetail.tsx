import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { scripts } from '@/src/data/scripts';
import { ArrowLeft, Star, Clock, Users, Share2, Heart, Play, MessageSquare, Video, Download } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { GoogleGenAI } from '@google/genai';
import ReactPlayer from 'react-player';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

declare const process: any;

export default function ScriptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const script = scripts.find(s => s.id === id);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Share Modal States
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  // Mock Friends Data
  const mockFriends = [
    { id: 'f1', name: '推理大师_小王', avatar: 'https://picsum.photos/seed/f1/100/100', status: 'online' },
    { id: 'f2', name: '情感本天后', avatar: 'https://picsum.photos/seed/f2/100/100', status: 'offline' },
    { id: 'f3', name: '菠萝头老李', avatar: 'https://picsum.photos/seed/f3/100/100', status: 'online' },
    { id: 'f4', name: '戏精本精', avatar: 'https://picsum.photos/seed/f4/100/100', status: 'playing' },
  ];

  // Video Generation States
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  if (!script) return <div>剧本未找到</div>;

  const totalPlayers = script.players.male + script.players.female + script.players.any;

  const handleFavorite = () => {
    const newStatus = !isFavorited;
    setIsFavorited(newStatus);
    setToastMessage(newStatus ? '已添加到收藏' : '已取消收藏');
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const handleShare = () => {
    if (selectedFriends.length === 0) {
      setToastMessage('请先选择要分享的好友');
      setTimeout(() => setToastMessage(null), 2000);
      return;
    }
    
    // In a real app, this would call an API to send the share message
    setIsShareModalOpen(false);
    setSelectedFriends([]);
    setToastMessage(`已成功分享给 ${selectedFriends.length} 位好友`);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const generateTrailer = async () => {
    try {
      setIsGeneratingVideo(true);
      setVideoError(null);

      if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        await window.aistudio.openSelectKey();
      }

      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `A cinematic movie trailer for a murder mystery story titled "${script.title}". ${script.description}. High quality, dramatic lighting, suspenseful atmosphere.`;

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': apiKey,
          },
        });
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setVideoUri(url);
      } else {
        setVideoError('视频生成失败，请重试。');
      }
    } catch (error: any) {
      if (error.message?.includes("Requested entity was not found")) {
         if (window.aistudio) await window.aistudio.openSelectKey();
      }
      setVideoError(error.message || '生成视频时发生错误');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-neutral-900/90 backdrop-blur-sm text-white px-5 py-2.5 rounded-full text-sm shadow-xl z-50 animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-2">
          <Heart className={cn("w-4 h-4", isFavorited ? "fill-red-500 text-red-500" : "text-white")} />
          {toastMessage}
        </div>
      )}

      {/* Header & Cover */}
      <div className="relative h-72">
        <div className="absolute inset-0">
          <img 
            src={script.cover} 
            alt={script.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-black/30" />
        </div>
        
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            <button 
              onClick={handleFavorite}
              className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
            >
              <Heart className={cn("w-5 h-5 transition-colors", isFavorited ? "fill-red-500 text-red-500" : "")} />
            </button>
            <button 
              onClick={() => setIsShareModalOpen(true)}
              className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex gap-2 mb-3">
            {script.tags.map(tag => (
              <span key={tag} className="text-xs bg-white/20 backdrop-blur-md px-2 py-1 rounded-sm border border-white/10">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-bold mb-2">{script.title}</h1>
          <div className="flex items-center gap-4 text-sm text-white/80">
            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {script.rating || '暂无'} 评分</span>
            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {totalPlayers}人 ({script.players.male}男{script.players.female}女)</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {script.duration}</span>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full sm:w-[400px] rounded-t-3xl sm:rounded-3xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-neutral-900">分享给好友</h3>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-600 bg-neutral-100 rounded-full"
              >
                &times;
              </button>
            </div>
            
            <div className="p-4 max-h-[50vh] overflow-y-auto">
              <div className="space-y-3">
                {mockFriends.map(friend => (
                  <div 
                    key={friend.id} 
                    onClick={() => toggleFriendSelection(friend.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                      selectedFriends.includes(friend.id) 
                        ? "border-red-500 bg-red-50" 
                        : "border-neutral-100 hover:bg-neutral-50"
                    )}
                  >
                    <div className="relative">
                      <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                      <span className={cn(
                        "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
                        friend.status === 'online' ? "bg-green-500" : 
                        friend.status === 'playing' ? "bg-yellow-500" : "bg-neutral-300"
                      )} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-neutral-900">{friend.name}</h4>
                      <p className="text-xs text-neutral-500">
                        {friend.status === 'online' ? '在线' : 
                         friend.status === 'playing' ? '游戏中' : '离线'}
                      </p>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center",
                      selectedFriends.includes(friend.id) 
                        ? "border-red-500 bg-red-500" 
                        : "border-neutral-300"
                    )}>
                      {selectedFriends.includes(friend.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-neutral-100 bg-neutral-50">
              <button 
                onClick={handleShare}
                disabled={selectedFriends.length === 0}
                className="w-full py-3 bg-red-600 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                分享 {selectedFriends.length > 0 ? `(${selectedFriends.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-6 py-6 space-y-8">
        {/* Synopsis */}
        <section>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-red-600 rounded-full"></span>
            剧本简介
          </h2>
          <p className="text-neutral-600 text-sm leading-relaxed">
            {script.description}
          </p>
        </section>

        {/* AI Trailer */}
        <section>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-red-600 rounded-full"></span>
            AI 预告片
          </h2>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
            {videoUri ? (
              <div className="space-y-3">
                <div className="rounded-lg overflow-hidden bg-black aspect-video relative">
                  <ReactPlayer
                    src={videoUri}
                    width="100%"
                    height="100%"
                    controls
                    playing
                    onError={(e) => {
                      console.error('Video playback error:', e);
                      setPlaybackError('视频播放出错，请尝试下载后观看。');
                    }}
                  />
                  {playbackError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-4 text-center text-sm z-10">
                      {playbackError}
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <a 
                    href={videoUri} 
                    download={`${script.title}-预告片.mp4`}
                    className="flex items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-4 py-2 rounded-lg transition-colors font-medium"
                  >
                    <Download className="w-4 h-4" />
                    下载预告片
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-neutral-900 mb-1">生成专属预告片</h3>
                <p className="text-xs text-neutral-500 mb-4 max-w-[200px]">
                  使用 Veo AI 为《{script.title}》生成一段电影级的高清预告片
                </p>
                <button 
                  onClick={generateTrailer}
                  disabled={isGeneratingVideo}
                  className="px-6 py-2 bg-neutral-900 text-white text-sm font-bold rounded-full disabled:opacity-50 flex items-center gap-2 transition-opacity"
                >
                  {isGeneratingVideo ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      正在生成 (约需几分钟)...
                    </>
                  ) : (
                    '立即生成'
                  )}
                </button>
                {videoError && (
                  <p className="text-xs text-red-500 mt-3">{videoError}</p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Characters */}
        {script.characters && script.characters.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-red-600 rounded-full"></span>
              人物介绍
            </h2>
            <div className="flex flex-col gap-3">
              {script.characters.map(char => (
                <div key={char.id} className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100 flex gap-4 items-start">
                  <img 
                    src={char.avatar} 
                    alt={char.name} 
                    className="w-14 h-14 rounded-full object-cover border-2 border-neutral-50 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-bold text-sm text-neutral-900">{char.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${char.gender === 'male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                        {char.gender === 'male' ? '男' : '女'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      {char.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Character Relationships */}
        {script.summary?.relationships && script.summary.relationships.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-red-600 rounded-full"></span>
              人物关系网
            </h2>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-neutral-100">
              <div className="relative border-l-2 border-neutral-100 ml-5 space-y-6">
                {script.summary.relationships.map((rel, index) => {
                  const char = script.characters.find(c => c.name === rel.character);
                  return (
                    <div key={index} className="relative pl-6">
                      <div className="absolute -left-[21px] top-1 w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        {char ? (
                          <img src={char.avatar} alt={char.name} className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center border-2 border-white shadow-sm">
                            <Users className="w-4 h-4 text-neutral-400" />
                          </div>
                        )}
                      </div>
                      <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-100 ml-2">
                        <h4 className="text-sm font-bold text-neutral-900 mb-1">{rel.character}</h4>
                        <p className="text-xs text-neutral-600 leading-relaxed">{rel.relation}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Reviews */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="w-1 h-4 bg-red-600 rounded-full"></span>
              玩家评价 ({script.reviewCount || 0})
            </h2>
            <button 
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="text-sm text-red-600 font-medium flex items-center gap-1"
            >
              <MessageSquare className="w-4 h-4" />
              写评价
            </button>
          </div>

          {showReviewForm && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 mb-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="w-6 h-6 text-neutral-200 hover:text-yellow-400 hover:fill-yellow-400 cursor-pointer transition-colors" />
                ))}
              </div>
              <textarea 
                placeholder="分享你的游玩体验（不含剧透）..."
                className="w-full bg-neutral-50 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[80px] mb-3"
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-1.5 text-sm text-neutral-500 font-medium"
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                    alert('评价提交成功！');
                    setShowReviewForm(false);
                  }}
                  className="px-4 py-1.5 bg-red-600 text-white text-sm font-bold rounded-lg"
                >
                  发布
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {script.reviews && script.reviews.length > 0 ? (
              script.reviews.map(review => (
                <div key={review.id} className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <img src={review.avatar} alt={review.user} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                      <div>
                        <span className="text-sm font-bold text-neutral-900 block">{review.user}</span>
                        <span className="text-[10px] text-neutral-400">{review.date}</span>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn("w-3 h-3", i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-neutral-200")} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {review.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-neutral-400 text-sm">
                暂无评价，快来抢沙发吧！
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 flex gap-3 z-50">
        <button className="flex-1 bg-neutral-100 text-neutral-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2">
          <Users className="w-5 h-5" />
          发起拼车
        </button>
        <Link to={`/game/${script.id}`} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/20">
          <Play className="w-5 h-5" />
          创建房间
        </Link>
      </div>
    </div>
  );
}
