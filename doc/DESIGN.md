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
| 存档格式 | JSON |
| MOD存储 | IndexedDB |

## 项目结构

```
src/
├── assets/           # 静态资源
├── components/      # Vue 通用组件
│   └── ui/          # UI 组件（卡片、弹窗等）
├── composables/      # Vue Composables（可复用逻辑）
│   └── useKeyboardControls.ts  # 键盘快捷键控制
├── config/          # 配置文件
│   ├── game.ts      # 游戏配置
│   └── cardTypes.ts # 卡牌类型配置
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
│   │   └── DragModule.ts      # 拖拽管理模块
│   ├── events/      # 事件定义
│   │   └── index.ts
│   └── types/       # 类型定义
│       └── index.ts
├── stores/          # Pinia 状态管理
│   ├── saveStore.ts  # 存档管理
│   └── gameStore.ts  # 游戏状态
├── utils/          # 工具函数
└── views/          # 页面视图
    ├── HomeView.vue  # 初始页面（存档管理）
    └── GameView.vue   # 游戏页面
```

## 游戏配置 (config/game.ts)

```typescript
export const gameConfig = {
  viewport: {
    width: 2560,        // 地图宽度
    height: 1440,       // 地图高度
    minScale: 0.5,      // 最小缩放
    maxScale: 2,        // 最大缩放
    defaultScale: 1,     // 默认缩放
    boundaryMargin: 200  // 边界外边距（限制移动范围）
  },

  perspective: {
    maxRotateX: 45,              // 最大视角旋转
    animationDuration: 300        // 动画时长
  },

  grid: {
    originX: 0,
    originY: 0,
    cellWidth: 80,               // 卡牌宽度
    cellHeight: 107,              // 卡牌高度（3:4比例）
    gridSize: 40                  // 地面网格大小
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

游戏引擎层是业务逻辑的核心，所有业务代码只与引擎层交互，避免直接操作底层模块。

#### 架构图

```
┌─────────────────────────────────────────────────────┐
│                    Vue 组件层                        │
│              (GameView, CardStack, etc.)            │
└─────────────────────┬───────────────────────────────┘
                      │ 调用 gameStore API
┌─────────────────────▼───────────────────────────────┐
│                    gameStore                         │
│              (状态管理 + 引擎代理)                     │
└─────────────────────┬───────────────────────────────┘
                      │ 调用引擎 API
┌─────────────────────▼───────────────────────────────┐
│                    GameEngine                        │
├─────────────────────────────────────────────────────┤
│ CoordinateModule: 坐标转换                           │
│ StackModule: 堆叠操作（创建、分离、合并）              │
│ DragModule: 拖拽管理（开始、移动、结束）               │
└─────────────────────────────────────────────────────┘
```

#### 模块说明

| 模块 | 职责 | 主要方法 |
|------|------|----------|
| **CoordinateModule** | 坐标系统管理 | `screenToWorld()`, `screenDeltaToWorldDelta()`, `getTransformStyle()` |
| **StackModule** | 堆叠生命周期 | `createStack()`, `separateStack()`, `mergeStacks()`, `getStackBounds()` |
| **DragModule** | 拖拽流程控制 | `startDrag()`, `calculateDragPosition()`, `endDrag()`, `findDropTarget()` |

#### 坐标系统说明

```
┌─────────────────────────────────────────────────────┐
│                    坐标系统架构                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  屏幕坐标 (Screen):                                  │
│  - 浏览器窗口坐标，原点在左上角                        │
│  - X 向右为正，Y 向下为正                            │
│                                                     │
│  世界坐标 (World):                                   │
│  - 游戏世界坐标，原点在地图左下角                      │
│  - X 向右为正，Y 向上为正                            │
│  - 与 CSS bottom 定位一致                           │
│                                                     │
│  网格坐标 (Grid):                                    │
│  - 用于对齐到网格的坐标                               │
│  - gridX = worldX / cellWidth                       │
│  - gridY = worldY / cellHeight                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### 堆叠坐标系统

```
堆叠卡牌坐标计算：

CSS bottom 定位：
- 底层卡牌 (index=0): bottom=0, 底边在 y
- 上层卡牌 (index=n): bottom=-n*STACK_OFFSET, 向下偏移

世界坐标：
- 所有卡牌的 y 值相同（底层卡牌的 y）
- 渲染偏移由 CSS bottom 处理

分离计算：
- 新堆叠 y = 原堆叠底层 y - fromIndex * STACK_OFFSET
```

### 1. 坐标系统 (CoordinateModule)

统一处理所有坐标转换的核心模块，位于 `src/game/engine/CoordinateModule.ts`。

#### 坐标系说明

```
┌─────────────────────────────────────────────────────────┐
│                    坐标系统架构                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  屏幕坐标          视口坐标         │
│  ┌──────────────┐         ┌──────────────┐              │
│  │ 原点: 左上角  │         │ transform    │              │
│  │ X→ Y↓        │ ──────► │ translate    │              │
│  └──────────────┘         │ scale        │              │
│                           │ rotateX      │              │
│                           └──────────────┘              │
│                                  │                      │
│                                  ▼                      │
│  世界坐标  ◄────────────────────────                   │
│  ┌──────────────┐                                        │
│  │ 原点: 左下角  │                                        │
│  │ X→ Y↑        │                                        │
│  └──────────────┘                                        │
│                                  │                      │
│                                  ▼                      │
│  网格坐标                         │
│  ┌──────────────┐                                        │
│  │ 对齐到网格    │                                        │
│  └──────────────┘                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### 核心方法

| 方法 | 用途 |
|------|------|
| `screenToWorld(x, y)` | 鼠标点击位置 → 游戏世界位置 |
| `worldToScreen(x, y)` | 游戏对象位置 → 屏幕显示位置 |
| `screenDeltaToWorldDelta(dx, dy)` | 拖拽移动距离转换（Y轴反转） |
| `screenDeltaToGridDelta(dx, dy)` | 屏幕移动 → 网格移动 |
| `getTranslateBounds()` | 计算平移边界 |
| `clampTranslate(x, y)` | 限制平移在边界内 |
| `getTransformStyle()` | 生成 CSS transform |
| `getStackBounds(stack, offset)` | 计算堆叠的世界坐标边界 |

### 2. 堆叠管理 (StackModule)

负责卡牌堆叠的创建、分离、合并等操作，位于 `src/game/engine/StackModule.ts`。

#### 堆叠数据结构

```typescript
interface GameCard {
  id: string
  typeId: string
  name: string
  emoji: string
  x: number       // 世界坐标 X（像素）
  y: number       // 世界坐标 Y（像素）
  data: Record<string, unknown>
  stackId: string
}

interface CardStack {
  id: string
  cards: GameCard[]  // 索引 0 = 底层卡牌，索引越大越靠上
}
```

#### 堆叠操作

| 操作 | 说明 |
|------|------|
| `createStack(x, y, typeId, name, emoji)` | 创建新堆叠 |
| `separateStack(stack, fromIndex)` | 从指定索引分离，返回新堆叠 |
| `mergeStacks(source, target)` | 合并两个堆叠 |
| `moveStack(stack, x, y)` | 移动堆叠到指定位置 |
| `getStackBounds(stack)` | 计算堆叠边界 |
| `findStackAtPosition(stacks, x, y)` | 查找指定位置的堆叠 |

#### 分离逻辑

```
分离前（3张卡牌，底层 y=500）：
├── cards[0]: 底层，渲染位置 = 500
├── cards[1]: 中层，渲染位置 = 500 - 32 = 468
└── cards[2]: 顶层，渲染位置 = 500 - 64 = 436

从索引 1 分离后：
原堆叠：
└── cards[0]: 底层，渲染位置 = 500（不变）

新堆叠（y = 500 - 1*32 = 468）：
├── cards[0]: 原中层，渲染位置 = 468（不变）
└── cards[1]: 原顶层，渲染位置 = 468 - 32 = 436（不变）
```

### 3. 拖拽管理 (DragModule)

负责卡牌拖拽的完整生命周期，位于 `src/game/engine/DragModule.ts`。

#### 拖拽流程

```
1. startDrag(stack, cardIndex, screenX, screenY)
   │
   ├── 记录拖拽起始状态
   └── 返回起始世界坐标
   
2. calculateDragPosition(screenX, screenY)  [拖拽过程中]
   │
   ├── 计算屏幕增量
   ├── 转换为世界增量（Y轴反转）
   └── 返回新的世界坐标
   
3. endDrag(stacks, screenX, screenY)
   │
   ├── 使用卡牌当前位置查找目标
   ├── 尝试合并（如果可堆叠）
   └── 返回放置结果
```

#### 拖拽状态

```typescript
interface DragContext {
  isDragging: boolean
  draggingStackId: string | null
  sourceStackId: string | null
  startScreenX: number
  startScreenY: number
  startWorldX: number
  startWorldY: number
  draggedCardIndex: number
  isSeparating: boolean
}
```

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

- 显示整个地图的缩略图
- 显示当前视口位置
- 点击/拖拽可快速定位
- 显示所有卡牌位置

### 7. 自定义 UI 层

- 缩放控制按钮
- 帮助按钮和快捷键说明弹窗
- 开发者工具栏

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
- [x] 堆叠分离和合并
- [x] 小地图导航
- [x] 键盘快捷键
- [x] 存档管理界面
- [x] 开发者工具栏

## 待实现功能

- [ ] 卡牌详情窗口
- [ ] 卡牌内容区显示图片（而非emoji）
- [ ] 地图切换
- [ ] 时间/季节系统
- [ ] MOD 系统
- [ ] 存档保存/加载（游戏内）

## 开发命令

```bash
npm run dev    # 开发模式
npm run build  # 构建
npm run preview # 预览构建
```
