export const scripts = [
  {
    id: '1',
    title: '良辰吉日',
    tags: ['民国', '情感', '阵营', '悬疑'],
    players: { male: 3, female: 3, any: 0 },
    duration: '4-5小时',
    difficulty: '进阶',
    description: '民国二十六年，江南水乡的一场盛大婚礼上，新郎却离奇死亡。红绸变白绫，喜宴成丧宴。在座的各位，究竟是谁在暗中操控这一切？',
    rating: 9.2,
    roles: [
      { id: 'c1', name: '林少爷', gender: 'male' },
      { id: 'c2', name: '苏小姐', gender: 'female' },
      { id: 'c3', name: '管家老李', gender: 'male' },
      { id: 'c4', name: '丫鬟小翠', gender: 'female' },
      { id: 'c5', name: '张探长', gender: 'male' },
      { id: 'c6', name: '神秘女客', gender: 'female' }
    ]
  },
  {
    id: '2',
    title: '长安夜行',
    tags: ['古风', '推理', '武侠', '悬疑'],
    players: { male: 4, female: 2, any: 1 },
    duration: '5-6小时',
    difficulty: '烧脑',
    description: '天宝十四载，长安城内发生连环命案，死者皆为朝廷命官。大理寺少卿奉命彻查，却卷入了一场惊天阴谋……',
    rating: 9.5,
    roles: []
  }
];

export const reviews = [
  { id: 'r1', scriptId: '1', user: '剧本杀老司机', userId: 'user_1', rating: 5, content: '情感线非常饱满，最后的反转让人意想不到，强推！', date: '2023-10-01' }
];

export const rooms = [
  {
    id: 'room_1',
    scriptId: '1',
    host: 'user_1', // DM
    currentPlayers: 4,
    targetPlayers: 6,
    status: 'waiting',
    players: ['user_1', 'user_2', 'user_3', 'user_4']
  }
];

export const users = [
  {
    id: 'user_1',
    name: '剧本杀老司机',
    bio: '推理无情，沉浸有爱。',
    avatar: 'https://picsum.photos/seed/u1/150/150',
    stats: { played: 42, favorites: 15, reviews: 8 },
    history: [
      { id: 'h1', scriptId: '1', role: '林少爷', date: '2023-10-01', dm: '小黑', location: '线上车队' }
    ],
    favorites: ['1', '2'],
    friends: ['user_2'],
    inventory: [] // e.g. custom avatar frames, chat bubbles
  },
  {
    id: 'user_2',
    name: '推理小白',
    bio: '努力学习中',
    avatar: 'https://picsum.photos/seed/u2/150/150',
    stats: { played: 5, favorites: 2, reviews: 1 },
    history: [],
    favorites: [],
    friends: ['user_1'],
    inventory: []
  }
];

export const roomStates: Record<string, any> = {
  'room_1': {
    currentAct: 'act_1',
    revealedClues: ['clue_1', 'clue_2'],
    chatLog: [
      { id: 'msg1', userId: 'user_1', text: '大家好！', timestamp: Date.now(), isPrivate: false }
    ],
    roleAssignments: {}, // { userId: roleId }
    votes: {} // { voterUserId: targetRoleId }
  }
};

export const storeItems = [
  { id: 'item_1', name: '大侦探头像框', type: 'avatar_frame', price: 100 },
  { id: 'item_2', name: '血迹气泡', type: 'chat_bubble', price: 200 }
];
