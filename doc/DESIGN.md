# Stack Like - 技术设计文档

## 项目概述

堆叠大陆游戏，纯客户端 Web 游戏，使用 TypeScript + Vue 实现类似堆叠大陆和密教模拟器的卡牌交互玩法。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 (Composition API) |
| 语言 | TypeScript |
| 构建工具 | Vite |
| 状态管理 | Pinia |
| 样式方案 | UnoCSS |
| 国际化 | vue-i18n |
| 存档格式 | JSON |
| MOD存储 | IndexedDB |

## 项目结构

```
src/
├── assets/           # 静态资源
├── components/      # Vue 通用组件
│   └── ui/          # UI 组件（卡片、弹窗、面板等）
├── composables/      # Vue Composables（可复用逻辑）
│   └── useKeyboardControls.ts  # 键盘快捷键控制
├── config/          # 配置文件
│   ├── game.ts      # 游戏配置
│   ├── cardTypes.ts # 卡牌类型配置
│   ├── tags.ts      # 标签配置（分类、属性、方面）
│   ├── panels.ts    # 面板配置
│   └── recipes.ts   # 配方配置
├── game/            # 游戏核心逻辑
│   ├── card/        # 卡牌系统
│   │   ├── Card.vue      # 单个卡牌组件
│   │   ├── CardStack.vue # 堆叠容器组件
│   │   └── CardGrid.vue  # 卡牌网格容器
│   ├── core/        # 核心 UI 组件
│   │   ├── Viewport.vue   # 视口管理
│   │   ├── MiniMap.vue    # 小地图导航
│   │   ├── ZoomControls.vue  # 缩放控制
│   │   ├── HelpButton.vue   # 帮助按钮
│   │   ├── HelpModal.vue    # 快捷键说明弹窗
│   │   └── DevToolbar.vue   # 开发者工具栏
│   ├── engine/      # 游戏引擎（业务逻辑层）
│   │   ├── GameEngine.ts      # 引擎主入口
│   │   ├── CoordinateModule.ts # 坐标系统模块
│   │   ├── StackModule.ts     # 堆叠管理模块
│   │   ├── DragModule.ts      # 拖拽管理模块
│   │   ├── SlotModule.ts      # 槽位管理模块
│   │   ├── PanelModule.ts     # 面板管理模块
│   │   └── RecipeModule.ts    # 配方管理模块
│   ├── events/      # 事件定义
│   │   └── index.ts
│   └── types/       # 类型定义
│       ├── index.ts
│       ├── panel.ts   # 面板类型
│       ├── slot.ts    # 槽位类型
│       ├── recipe.ts  # 配方类型
│       └── tags.ts    # 标签类型
├── stores/          # Pinia 状态管理
│   ├── saveStore.ts  # 存档管理
│   ├── gameStore.ts  # 游戏状态
│   └── localeStore.ts # 语言设置
├── locales/         # 国际化语言文件
│   ├── index.ts     # i18n 配置入口
│   ├── zh-CN.json   # 简体中文
│   └── en-US.json   # 英语
├── utils/          # 工具函数
└── views/          # 页面视图
    ├── HomeView.vue  # 初始页面（存档管理）
    └── GameView.vue   # 游戏页面
```

## 游戏配置 (config/game.ts)

```typescript
export const gameConfig = {
  viewport: {
    // 地图尺寸（也是可放置卡牌区域尺寸）
    // Map size (also playable area for cards)
    width: 2560,
    height: 1440,
    
    minScale: 0.5,      // 最小缩放
    maxScale: 2,        // 最大缩放
    defaultScale: 1     // 默认缩放
  },

  perspective: {
    maxRotateX: 45,              // 最大视角旋转
    animationDuration: 300        // 动画时长
  },

  card: {
    width: 80,       // 卡牌宽度 / Card width
    height: 107      // 卡牌高度（3:4比例）/ Card height (3:4 ratio)
  },

  controls: {
    zoomStep: 0.1,      // 缩放步进
    panSpeed: 1         // 平移速度
  },

  minimap: {
    width: 200,
    height: 112,
    padding: 16
  },

  shortcuts: {
    zoomIn: '=',
    zoomOut: '-',
    zoomReset: '0',
    panUp: 'ArrowUp',
    panDown: 'ArrowDown',
    panLeft: 'ArrowLeft',
    panRight: 'ArrowRight',
    rotateView: 'r',
    togglePause: ' '
  }
} as const
```

## 核心系统

### 0. 游戏引擎架构 (GameEngine)

详见：[游戏引擎架构文档](./ENGINE.md)

游戏引擎层是业务逻辑的核心，所有业务代码只与引擎层交互，避免直接操作底层模块。

### 1. 坐标系统 (CoordinateModule)

详见：[坐标系统文档](./COORDINATE.md)

统一处理所有坐标转换的核心模块，位于 `src/game/engine/CoordinateModule.ts`。

### 2. 堆叠管理 (StackModule)

详见：[堆叠管理文档](./STACK.md)

负责卡牌堆叠的创建、分离、合并等操作，位于 `src/game/engine/StackModule.ts`。

### 3. 拖拽管理 (DragModule)

详见：[拖拽管理文档](./DRAG.md)

负责卡牌拖拽的完整生命周期，位于 `src/game/engine/DragModule.ts`。

### 4. 视口系统 (Viewport)

负责游戏的渲染区域管理，包括：
- **缩放**：通过 CSS transform scale 实现
- **平移**：通过 CSS transform translate 实现
- **视角旋转**：通过 CSS transform rotateX 实现

#### 交互方式

| 操作 | PC端 | 移动端 |
|------|------|--------|
| 缩放 | 滚轮 | 双指捏合 |
| 平移 | 拖拽/方向键 | 单指拖拽 |
| 旋转 | 按 R 键 | - |

#### 移动范围限制

- 放大时：可以拖动看到整个地图
- 缩小时：地图居中显示

### 5. 卡牌系统

详细内容见：[卡牌系统设计](./CARD_SYSTEM.md)

#### 数据结构

```typescript
interface GameCard {
  id: string
  x: number           // 世界坐标 X（像素）
  y: number           // 世界坐标 Y（像素）
  typeId: string      // 卡牌类型
  name: string        // 名称
  emoji: string       // 显示emoji
  data: Record<string, unknown>  // 扩展数据
  stackId: string     // 所属堆叠ID
}

interface CardStack {
  id: string
  cards: GameCard[]   // 索引 0 = 底层卡牌
}
```

### 6. 小地图系统 (MiniMap)

详见：[小地图系统文档](./MINIMAP.md)

小地图显示**当前视口范围**内的卡牌分布，而非整个地图，提供清晰的局部导航体验。

### 7. 自定义 UI 层

- 缩放控制按钮
- 帮助按钮和快捷键说明弹窗
- 开发者工具栏

### 8. 面板槽位系统 (Panel & Slot System)

类似《密教模拟器》的面板槽位系统，允许玩家点击打开面板，将卡牌拖入槽位进行合成/操作。

详见：[面板槽位系统文档](./PANEL_SLOT.md)

#### 核心组件

- **面板系统 (Panel)** - 可点击打开的浮动面板窗口
- **槽位系统 (Slot)** - 面板内可接受卡牌拖入的槽位
- **配方系统 (Recipe)** - 检测槽位内卡牌组合，触发对应效果
- **标签系统 (Tag)** - 用于槽位匹配的分类、属性、方面

#### 标签匹配系统

采用混合标签系统，结合三种标签类型：

| 标签类型 | 说明 | 示例 |
|----------|------|------|
| 分类标签 | 单选互斥 | `material`, `unit`, `knowledge` |
| 属性标签 | 多选可叠加 | `edible`, `flammable`, `magical` |
| 方面数值 | 数值条件 | `{ knowledge: 2, mystery: 3 }` |

#### 数据结构

```typescript
// 槽位匹配规则 / Slot Match Rule
interface SlotMatchRule {
  category?: string | string[]           // 分类要求
  requiredAttributes?: string[]          // 必需属性
  excludedAttributes?: string[]          // 排除属性
  requiredAspects?: Record<string, number>  // 方面数值要求
}

// 面板定义 / Panel Definition
interface PanelDefinition {
  id: string
  nameKey: string
  slots: SlotDefinition[]
  outputSlot?: SlotDefinition
  recipes: string[]
}

// 配方定义 / Recipe Definition
interface RecipeDefinition {
  id: string
  nameKey: string
  inputs: RecipeInput[]
  outputs: RecipeOutput[]
  duration?: number
}
```

## 组件通信

### Props & Events

| 组件 | Props | Events |
|------|-------|--------|
| SaveSlotCard | slot: SaveSlot | start, config, delete |
| CardGrid | stacks, selectedStacks, draggingStackId | cardClick, cardLongpress, stackDragStart |
| CardStack | stack, selected, isDragging | click, dragStart |
| Card | card, isSelected, isTop | click |
| ConfirmModal | title, message, confirmText, cancelText | confirm, cancel |

### Store 状态

**gameStore** 管理游戏状态：
- engine（游戏引擎实例）
- viewport（缩放，平移，旋转）
- selection（选中状态）
- currentMap（当前地图和堆叠）
- drag（拖拽状态）

**saveStore** 管理存档状态：
- slots（存档槽列表）
- 当前选中的存档

## 页面流程

```
┌─────────────┐
│  HomeView   │ (存档选择)
│             │
│  点击存档   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  GameView   │ (游戏主界面)
│             │
│  - Viewport │
│  - MiniMap  │
│  - Controls │
│  - DevTools │
└─────────────┘
```

## 已完成功能

- [x] 项目初始化和配置
- [x] 视口系统（缩放/平移/旋转）
- [x] 游戏引擎架构（CoordinateModule/StackModule/DragModule）
- [x] 坐标系统（统一坐标转换）
- [x] 卡牌类型配置系统
- [x] 卡牌渲染和堆叠效果
- [x] 卡牌拖拽移动
- [x] 卡牌拖拽边界限制
- [x] 堆叠分离和合并
- [x] 小地图导航
- [x] 键盘快捷键
- [x] 存档管理界面
- [x] 开发者工具栏
- [x] 多语言系统（中/英文切换）

## 待实现功能

- [ ] 面板槽位系统
  - [ ] 标签系统（分类、属性、方面）
  - [ ] 槽位匹配逻辑
  - [ ] 面板管理模块
  - [ ] 配方系统
  - [ ] 槽位拖拽交互
  - [ ] 面板 UI 组件
- [ ] 卡牌详情窗口
- [ ] 卡牌内容区显示图片（而非emoji）
- [ ] 地图切换
- [ ] 时间/季节系统
- [ ] MOD 系统
- [ ] 存档保存/加载（游戏内）

## PixiJS 迁移方案

详见：[PIXJS_MIGRATION.md](./PIXJS_MIGRATION.md)

## 文档索引

| 文档 | 说明 |
|------|------|
| [ENGINE.md](./ENGINE.md) | 游戏引擎架构 |
| [COORDINATE.md](./COORDINATE.md) | 坐标系统 |
| [STACK.md](./STACK.md) | 堆叠管理 |
| [DRAG.md](./DRAG.md) | 拖拽管理 |
| [MINIMAP.md](./MINIMAP.md) | 小地图系统 |
| [CARD_SYSTEM.md](./CARD_SYSTEM.md) | 卡牌系统 |
| [I18N_PLAN.md](./I18N_PLAN.md) | 多语言系统设计 |
| [PANEL_SLOT.md](./PANEL_SLOT.md) | 面板槽位系统 |

## 开发命令

```bash
npm run dev    # 开发模式
npm run build  # 构建
npm run preview # 预览构建
```
