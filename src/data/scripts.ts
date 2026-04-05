export interface Character {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'any';
  avatar: string;
  description: string;
}

export interface Review {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  content: string;
  date: string;
}

export interface Act {
  id: string;
  title: string;
  content: string[];
  tasks?: string[];
}

export interface ScriptSummary {
  plotPoints: string[];
  relationships: { character: string; relation: string }[];
  evidence: string[];
}

export interface Clue {
  id: string;
  title: string;
  description: string;
  type: 'location' | 'item' | 'character';
  isPublic: boolean;
}

export interface Script {
  id: string;
  title: string;
  cover: string;
  tags: string[];
  players: {
    male: number;
    female: number;
    any: number;
  };
  duration: string;
  difficulty: '新手' | '进阶' | '烧脑';
  description: string;
  characters: Character[];
  rating: number;
  reviewCount: number;
  reviews: Review[];
  acts?: Act[];
  summary?: ScriptSummary;
  clues?: Clue[];
}

export const scripts: Script[] = [
  {
    id: '1',
    title: '良辰吉日',
    cover: 'https://picsum.photos/seed/script1/400/600',
    tags: ['民国', '情感', '阵营', '悬疑'],
    players: { male: 3, female: 3, any: 0 },
    duration: '4-5小时',
    difficulty: '进阶',
    description: '民国二十六年，江南水乡的一场盛大婚礼上，新郎却离奇死亡。红绸变白绫，喜宴成丧宴。在座的各位，究竟是谁在暗中操控这一切？',
    rating: 9.2,
    reviewCount: 128,
    characters: [
      { id: 'c1', name: '林少爷', gender: 'male', avatar: 'https://picsum.photos/seed/c1/100/100', description: '林家大少爷，风流倜傥。' },
      { id: 'c2', name: '苏小姐', gender: 'female', avatar: 'https://picsum.photos/seed/c2/100/100', description: '苏家千金，温柔婉约。' },
      { id: 'c3', name: '管家老李', gender: 'male', avatar: 'https://picsum.photos/seed/c3/100/100', description: '林家老管家，忠心耿耿。' },
      { id: 'c4', name: '丫鬟小翠', gender: 'female', avatar: 'https://picsum.photos/seed/c4/100/100', description: '苏小姐的贴身丫鬟。' },
      { id: 'c5', name: '张探长', gender: 'male', avatar: 'https://picsum.photos/seed/c5/100/100', description: '租界巡捕房探长。' },
      { id: 'c6', name: '神秘女客', gender: 'female', avatar: 'https://picsum.photos/seed/c6/100/100', description: '不请自来的神秘女子。' },
    ],
    reviews: [
      { id: 'r1', user: '剧本杀老司机', avatar: 'https://picsum.photos/seed/u1/100/100', rating: 5, content: '情感线非常饱满，最后的反转让人意想不到，强推！', date: '2023-10-01' },
      { id: 'r2', user: '推理小白', avatar: 'https://picsum.photos/seed/u2/100/100', rating: 4, content: '作为新手觉得稍微有点难，但是DM带得好，体验很棒。', date: '2023-10-05' }
    ],
    summary: {
      plotPoints: [
        "林天赐死于胸口刀伤，凶器为刻有'苏'字的匕首。",
        "案发时间为吉时将至，新娘花轿刚进门时。",
        "管家老李昨晚曾去过少爷房间，但隐瞒了此事。"
      ],
      relationships: [
        { character: "苏婉儿", relation: "死者未婚妻，家族间似有恩怨。" },
        { character: "管家老李", relation: "林家老仆，对林老爷忠心，但对少爷态度不明。" },
        { character: "丫鬟小翠", relation: "苏婉儿贴身丫鬟，案发后神色慌张。" },
        { character: "神秘女客", relation: "不请自来，身份成谜，似乎知道林家过去的秘密。" }
      ],
      evidence: [
        "案发现场：刻有'苏'字的精致匕首。",
        "林老爷书房：一本记录着多年前旧账的泛黄账本。",
        "后院泥地：一串凌乱的脚印，指向后门。"
      ]
    },
    clues: [
      { id: 'clue1', title: '案发现场 - 匕首', description: '一把精致的匕首，刀柄上刻着一个"苏"字。', type: 'item', isPublic: true },
      { id: 'clue2', title: '林老爷书房 - 账本', description: '一本记录着多年前旧账的泛黄账本，其中一页被撕掉。', type: 'item', isPublic: true },
      { id: 'clue3', title: '后院泥地 - 脚印', description: '一串凌乱的脚印，指向后门，尺码偏小，似是女子所留。', type: 'location', isPublic: true },
      { id: 'clue4', title: '丫鬟小翠 - 供词', description: '小翠声称案发时在厨房帮忙，但有人看到她曾在后院徘徊。', type: 'character', isPublic: true },
      { id: 'clue5', title: '少爷房间 - 信件', description: '一封烧毁了一半的信件，隐约可见"私奔"二字。', type: 'item', isPublic: false },
    ],
    acts: [
      {
        id: 'act1',
        title: '第一幕：血染红绸',
        content: [
          '民国二十六年，初秋。江南水乡的林家大院张灯结彩，今日是林家大少爷林天赐与苏家千金苏婉儿的大喜之日。你作为林家的老管家，早早地便起来张罗着一切。',
          '然而，就在吉时将至，新娘的花轿刚刚抬进大门的时候，后院却传来了一声凄厉的尖叫。你急忙赶去，却发现新郎林天赐倒在血泊之中，胸口插着一把精致的匕首。'
        ],
        tasks: [
          '隐瞒你昨晚去过少爷房间的事实。',
          '找出杀害少爷的真凶。',
          '保护苏小姐的安全。'
        ]
      },
      {
        id: 'act2',
        title: '第二幕：暗流涌动',
        content: [
          '警察局的张探长很快封锁了现场，所有人都被集中在大厅。你注意到苏小姐的丫鬟小翠神色慌张，而那位不请自来的神秘女客则在一旁冷眼旁观。',
          '随着调查的深入，林家隐藏多年的秘密逐渐浮出水面。原来，林老爷当年发家并不光彩，而这一切似乎都与苏家有着千丝万缕的联系。'
        ],
        tasks: [
          '弄清楚小翠为什么慌张。',
          '试探神秘女客的真实身份。',
          '寻找林老爷当年的账本。'
        ]
      },
      {
        id: 'act3',
        title: '第三幕：真相大白',
        content: [
          '夜深了，暴雨倾盆。大厅里的气氛降到了冰点。所有的线索都指向了一个你最不愿意怀疑的人。',
          '现在，是时候做出你的选择了。你的决定，将改变所有人的命运。'
        ],
        tasks: [
          '在公审阶段指认凶手。',
          '完成你的个人隐藏任务。'
        ]
      }
    ]
  },
  {
    id: '2',
    title: '长安夜行',
    cover: 'https://picsum.photos/seed/script2/400/600',
    tags: ['古风', '推理', '武侠', '悬疑'],
    players: { male: 4, female: 2, any: 1 },
    duration: '5-6小时',
    difficulty: '烧脑',
    description: '天宝十四载，长安城内发生连环命案，死者皆为朝廷命官。大理寺少卿奉命彻查，却卷入了一场惊天阴谋……',
    rating: 9.5,
    reviewCount: 342,
    characters: [
      { id: 'c7', name: '李少卿', gender: 'male', avatar: 'https://picsum.photos/seed/c7/100/100', description: '大理寺少卿，断案如神。' },
      { id: 'c8', name: '红拂女', gender: 'female', avatar: 'https://picsum.photos/seed/c8/100/100', description: '江湖侠女，武艺高强。' }
    ],
    reviews: [
      { id: 'r3', user: '硬核玩家', avatar: 'https://picsum.photos/seed/u3/100/100', rating: 5, content: '核诡设计得太妙了，盘了6个小时才盘明白，爽！', date: '2023-11-12' }
    ]
  },
  {
    id: '3',
    title: '第七号病房',
    cover: 'https://picsum.photos/seed/script3/400/600',
    tags: ['现代', '恐怖', '惊悚', '变格'],
    players: { male: 2, female: 2, any: 2 },
    duration: '3-4小时',
    difficulty: '新手',
    description: '废弃多年的青山精神病院，深夜总会传出诡异的哭声。几个胆大的年轻人决定一探究竟，却发现自己再也无法离开……',
    rating: 8.8,
    reviewCount: 89,
    characters: [],
    reviews: []
  },
  {
    id: '4',
    title: '欢乐喜剧人',
    cover: 'https://picsum.photos/seed/script4/400/600',
    tags: ['现代', '欢乐', '机制', '撕逼'],
    players: { male: 3, female: 3, any: 2 },
    duration: '4小时',
    difficulty: '新手',
    description: '一档爆火的喜剧选秀节目后台，各位选手为了争夺唯一的出道名额，展开了啼笑皆非的明争暗斗。',
    rating: 9.0,
    reviewCount: 210,
    characters: [],
    reviews: []
  },
  {
    id: '5',
    title: '深渊之瞳',
    cover: 'https://picsum.photos/seed/script5/400/600',
    tags: ['科幻', '悬疑', '立意', '硬核'],
    players: { male: 3, female: 2, any: 0 },
    duration: '6-7小时',
    difficulty: '烧脑',
    description: '2077年，人类意识上传技术取得突破。然而，第一批试验者却在虚拟世界中接连脑死亡。你作为调查员，必须潜入深渊……',
    rating: 9.7,
    reviewCount: 450,
    characters: [],
    reviews: []
  }
];
