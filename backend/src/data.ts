export const scripts = [
  { id: '1', title: '良辰吉日', tags: ['民国', '情感', '阵营', '悬疑'], players: { male: 3, female: 3, any: 0 }, duration: '4-5小时', difficulty: '进阶', description: '民国二十六年...', rating: 9.2, roles: [{ id: 'c1', name: '林少爷', gender: 'male' }, { id: 'c2', name: '苏小姐', gender: 'female' }] },
  { id: '2', title: '长安夜行', tags: ['古风', '推理', '武侠', '悬疑'], players: { male: 4, female: 2, any: 1 }, duration: '5-6小时', difficulty: '烧脑', description: '天宝十四载...', rating: 9.5, roles: [] }
];

export const reviews = [
  { id: 'r1', scriptId: '1', user: '剧本杀老司机', userId: 'user_1', rating: 5, content: '强推！', date: '2023-10-01' }
];

export const rooms = [
  { id: 'room_1', scriptId: '1', host: 'user_1', currentPlayers: 4, targetPlayers: 6, status: 'waiting', players: ['user_1', 'user_2', 'user_3', 'user_4'], password: '', isPublic: true }
];

export const achievements = [
  { id: 'ach_1', name: '初出茅庐', description: '完成第一次剧本杀', icon: '🌟' },
  { id: 'ach_2', name: '推理大师', description: '成功指认凶手10次', icon: '🔍' }
];

export const users = [
  {
    id: 'user_1', username: 'admin', password: 'password123', name: '剧本杀老司机', bio: '推理无情，沉浸有爱。', avatar: 'https://picsum.photos/seed/u1/150/150', stats: { played: 42, favorites: 15, reviews: 8, rating: 4.9 },
    history: [{ id: 'h1', scriptId: '1', role: '林少爷', date: '2023-10-01', dm: '小黑', location: '线上车队' }],
    favorites: ['1', '2'], friends: ['user_2'], inventory: [], library: ['1'], achievements: ['ach_1', 'ach_2'], balance: 1000 // In-app currency
  },
  {
    id: 'user_2', username: 'testuser', password: 'password123', name: '推理小白', bio: '努力学习中', avatar: 'https://picsum.photos/seed/u2/150/150', stats: { played: 5, favorites: 2, reviews: 1, rating: 4.2 },
    history: [], favorites: [], friends: ['user_1'], inventory: [], library: [], achievements: ['ach_1'], balance: 50
  }
];

export const directMessages: Record<string, any[]> = {
  'user_1_user_2': [
    { id: 'm1', senderId: 'user_1', text: '今晚打本吗？', timestamp: Date.now() - 3600000 },
    { id: 'm2', senderId: 'user_2', text: '来！', timestamp: Date.now() - 3500000 }
  ]
};

export const notifications = [
  { id: 'n1', userId: 'user_1', type: 'friend_request', message: 'User2 请求添加好友', read: false, createdAt: Date.now() }
];

export const reports: any[] = [];

export const roomStates: Record<string, any> = {
  'room_1': { currentAct: 'act_1', revealedClues: ['clue_1', 'clue_2'], chatLog: [{ id: 'msg1', userId: 'user_1', text: '大家好！', timestamp: Date.now(), isPrivate: false }], roleAssignments: {}, votes: {}, isPaused: false }
};

export const storeItems = [
  { id: 'item_1', name: '大侦探头像框', type: 'avatar_frame', price: 100 },
  { id: 'item_2', name: '血迹气泡', type: 'chat_bubble', price: 200 }
];

// Matchmaking queues: Record of scriptId -> array of userIds waiting
export const matchmakingQueues: Record<string, string[]> = {};
