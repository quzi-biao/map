# map
识光
思维作为一个光场，理解即照明，认知张力是光暗交界处。

## 设计原则
学习的目标，本质，是从混乱到有序

从学习的生物结构出发，
从心理学出发，

导出以下几种原则：
连接构建，
	边界增长
	身体认知
	涌现
动力机制（增强动力，减少阻力）
	本能的好奇
	社会 辅助（群体辅助
	目标驱动
	减少阻力（认知负荷


基于上述的原则构建产品

### MVP核心功能

 基础认知地图

- 节点创建和编辑功能
- 节点间连接创建
- 简单的"亮度"差异表示理解深度
- 单一地图保存/加载

 简化的AI辅助

- 能感知当前选中节点
- 提供相关概念和资源
- 识别基本的认知缺口
- 初始化问答引导

最小交互界面

- React Flow基本实现
- 侧边AI对话窗
- 简洁工具栏
- 节点编辑界面


横向切成三个部分： 1. 主要 概念地图  2. AI部分  3. 工具栏
纵向切成三个部分： 数据层（向上提供标准数据端口）、运算层（service，向上提供运算接口）、表达层（实现UI展示）


## 项目结构

```
src/
│
├── store/                      # Zustand状态管理
│   ├── mapStore.ts             # 概念地图状态
│   ├── aiStore.ts              # AI助手状态
│   ├── toolbarStore.ts         # 工具栏状态
│   └── middleware/             # 状态中间件
│       ├── persistMiddleware.ts # 持久化中间件
│       └── undoMiddleware.ts   # 撤销/重做中间件
│
├── types/                      # 类型定义
│   ├── map.ts                  # 地图相关类型
│   ├── ai.ts                   # AI相关类型
│   └── toolbar.ts              # 工具栏相关类型
│
├── services/                   # 服务层
│   ├── map/                    # 地图服务
│   │   ├── nodeService.ts      # 节点操作服务
│   │   ├── edgeService.ts      # 连接操作服务
│   │   └── layoutService.ts    # 布局计算服务
│   │
│   ├── ai/                     # AI服务
│   │   ├── openrouterService.ts # OpenRouter API集成
│   │   ├── contextService.ts   # 上下文处理
│   │   └── suggestionService.ts # 建议生成服务
│   │
│   ├── storage/                # 持久化服务
│   │   ├── indexedDBService.ts # IndexedDB操作
│   │   └── exportImportService.ts # 导入导出功能
│   │
│   └── utils/                  # 通用工具
│       ├── idGenerator.ts      # ID生成
│       ├── colorUtils.ts       # 颜色处理
│       └── debounce.ts         # 防抖函数
│
├── components/                 # 表达层
│   ├── map/                    # 概念地图UI
│   │   ├── ConceptMapView.tsx  # 地图主视图
│   │   ├── node.tsx            # 节点组件
│   │   ├── edge.tsx            # 边组件
│   │   ├── controls/           # 地图控制组件
│   │   │   ├── ZoomControl.tsx # 缩放控制
│   │   │   └── MapOptions.tsx  # 地图选项
│   │   └── dialogs/            # 地图相关对话框
│   │       ├── NodeEditor.tsx  # 节点编辑器
│   │       └── EdgeEditor.tsx  # 连接编辑器
│   │
│   ├── ai/                     # AI助手UI
│   │   ├── AIPanel.tsx         # AI面板主组件
│   │   ├── ChatHistory.tsx     # 对话历史
│   │   ├── SuggestionList.tsx  # 建议列表
│   │   └── InputArea.tsx       # 输入区域
│   │
│   ├── toolbar/                # 工具栏UI
│   │   ├── ToolbarPanel.tsx    # 工具栏主组件
│   │   ├── MapSelector.tsx     # 地图选择器
│   │   └── ToolButtons.tsx     # 工具按钮组
│   │
│   └── common/                 # 通用UI组件
│       ├── Modal.tsx           # 通用模态框
│       ├── Button.tsx          # 按钮组件
│       └── Icons.tsx           # 图标组件
│
├── hooks/                      # 自定义Hooks
│   ├── useMapOperations.ts     # 地图操作Hook
│   ├── useAIAssistant.ts       # AI助手Hook
│   └── useReactFlow.ts         # ReactFlow相关Hook
│
├── pages/                      # 页面组件
│   ├── MapEditor.tsx           # 地图编辑页面
│   └── Welcome.tsx             # 欢迎/引导页面
│
├── styles/                     # 样式文件
│   ├── tailwind.css            # Tailwind入口
│   └── animations.css          # 自定义动画
│
├── lib/                        # 库和配置
│   ├── reactflow-config.ts     # ReactFlow配置
│   └── shadcn-config.ts        # Shadcn UI配置
│
└── App.tsx                     # 应用入口


```
