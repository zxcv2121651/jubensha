export const scripts: any[] = [
  {
    id: '1', title: '良辰吉日', tags: ['民国', '情感', '阵营', '悬疑'], players: { male: 3, female: 3, any: 0 }, duration: '4-5小时', difficulty: '进阶', description: '民国二十六年...', rating: 9.2,
    roles: [{ id: 'c1', name: '林少爷', gender: 'male' }, { id: 'c2', name: '苏小姐', gender: 'female' }],
    acts: [{ id: 'act_1', title: '第一幕', content: '那是一个下雨的夜晚...' }, { id: 'act_2', title: '第二幕', content: '尸体被发现了...' }],
    clues: [{ id: 'clue_1', title: '匕首', description: '带血的匕首', condition: null }],
    isUgc: false, approvalStatus: 'approved', authorId: 'sys'
  }
];

export const ugcDrafts: any[] = [];
export const reviews: any[] = [];
export const rooms: any[] = [];
export const achievements: any[] = [];
export const quests: any[] = [];

export const users: any[] = [
  {
    id: 'user_1', username: 'admin', password: '123', name: '剧本杀老司机', bio: '推理无情，沉浸有爱。', avatar: 'https://picsum.photos/seed/u1/150/150', stats: { played: 42, favorites: 15, reviews: 8, rating: 4.9 },
    history: [], favorites: [], friends: ['user_2'], blacklist: [], inventory: [], library: [], achievements: [], balance: 1000,
    isVip: false, vipExpiry: null, dmTipsReceived: 0, quests: [], clubId: 'club_1', wishlist: [], checkinStreak: 5, lastCheckin: Date.now() - 86400000,
    isAdmin: true, accountStatus: 'active',
    // Ranked System
    elo: 1250, rank: '黄金', rankedWins: 20, rankedLosses: 5
  },
  {
    id: 'user_2', username: 'testuser', password: '123', name: '推理小白', bio: '努力学习中', avatar: 'https://picsum.photos/seed/u2/150/150', stats: { played: 5, favorites: 2, reviews: 1, rating: 4.2 },
    history: [], favorites: [], friends: ['user_1'], blacklist: [], inventory: [], library: [], achievements: [], balance: 50,
    isVip: true, vipExpiry: Date.now() + 86400000 * 30, dmTipsReceived: 0, quests: [], clubId: null, wishlist: [], checkinStreak: 0, lastCheckin: 0,
    isAdmin: false, accountStatus: 'active',
    // Ranked System
    elo: 950, rank: '青铜', rankedWins: 2, rankedLosses: 8
  },
  {
    id: 'user_3', username: 'pro_player', password: '123', name: '职业推土机', bio: '', avatar: 'https://picsum.photos/seed/u3/150/150', stats: { played: 100, favorites: 0, reviews: 0, rating: 5.0 },
    history: [], favorites: [], friends: [], blacklist: [], inventory: [], library: [], achievements: [], balance: 0,
    isVip: false, vipExpiry: null, dmTipsReceived: 0, quests: [], clubId: null, wishlist: [], checkinStreak: 0, lastCheckin: 0,
    isAdmin: false, accountStatus: 'active',
    // Ranked System
    elo: 1300, rank: '黄金', rankedWins: 50, rankedLosses: 10
  }
];

export const clubs: any[] = [];
export const directMessages: Record<string, any[]> = {};
export const notifications: any[] = [];
export const reports: any[] = [];
export const roomStates: Record<string, any> = {};
export const gameResults: Record<string, any> = {};
export const gameReplays: Record<string, any> = {};
export const storeItems: any[] = [];
export const promoCodes: Record<string, any> = {};
export const gachaPool: any[] = [];

// Casual Queue: scriptId -> array of userIds
export const matchmakingQueues: Record<string, string[]> = {};

// Ranked Queue: RankTier -> ScriptId -> array of userIds
export const rankedQueues: Record<string, Record<string, string[]>> = {
  '青铜': {},
  '白银': {},
  '黄金': {},
  '钻石': {},
  '王者': {}
};
