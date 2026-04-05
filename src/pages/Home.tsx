import { Link } from 'react-router-dom';
import { scripts } from '@/src/data/scripts';
import { Search, Flame, Star, Clock, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Header */}
      <header className="bg-white px-4 py-4 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">谜案寻踪</h1>
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
            我
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input 
            type="text" 
            placeholder="搜索剧本、作者、发行..." 
            className="w-full bg-neutral-100 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
          />
        </div>
      </header>

      {/* Categories */}
      <section className="px-4 py-6">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {['全部', '悬疑', '惊悚', '古风', '现代', '情感', '欢乐', '阵营', '机制'].map((cat, i) => (
            <button 
              key={cat}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                i === 0 ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Banner */}
      <section className="px-4 mb-8">
        <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-md">
          <img 
            src="https://picsum.photos/seed/banner/800/400" 
            alt="Featured" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm w-fit mb-2">独家首发</span>
            <h2 className="text-white font-bold text-xl mb-1">长相思 · 破阵子</h2>
            <p className="text-white/80 text-xs">古风 / 情感 / 沉浸 / 6人</p>
          </div>
        </div>
      </section>

      {/* Popular Scripts */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500" />
            热门剧本
          </h2>
          <button className="text-sm text-neutral-500">查看全部</button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {scripts.map((script) => (
            <Link key={script.id} to={`/script/${script.id}`} className="group">
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2 shadow-sm group-hover:shadow-md transition-shadow">
                <img 
                  src={script.cover} 
                  alt={script.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span>9.8</span>
                </div>
              </div>
              <h3 className="font-bold text-neutral-900 truncate">{script.title}</h3>
              <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {script.players.male + script.players.female + script.players.any}人</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {script.duration}</span>
              </div>
              <div className="flex gap-1 mt-2 flex-wrap">
                {script.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
