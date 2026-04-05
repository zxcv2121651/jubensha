export const scripts = [
  {
    id: '1',
    title: '良辰吉日',
    tags: ['民国', '情感', '阵营', '悬疑'],
    players: { male: 3, female: 3, any: 0 },
    duration: '4-5小时',
    difficulty: '进阶',
    description: '民国二十六年，江南水乡的一场盛大婚礼上，新郎却离奇死亡。红绸变白绫，喜宴成丧宴。在座的各位，究竟是谁在暗中操控这一切？',
    rating: 9.2
  },
  {
    id: '2',
    title: '长安夜行',
    tags: ['古风', '推理', '武侠', '悬疑'],
    players: { male: 4, female: 2, any: 1 },
    duration: '5-6小时',
    difficulty: '烧脑',
    description: '天宝十四载，长安城内发生连环命案，死者皆为朝廷命官。大理寺少卿奉命彻查，却卷入了一场惊天阴谋……',
    rating: 9.5
  }
];

export const rooms = [
  {
    id: 'room_1',
    scriptId: '1',
    host: 'User1',
    currentPlayers: 4,
    targetPlayers: 6,
    status: 'waiting'
  }
];
