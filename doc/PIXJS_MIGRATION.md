# PixiJS 迁移方案

## 概述

本项目计划将游戏渲染层从 Vue DOM 迁移到 PixiJS WebGL，以支持数百张卡牌的流畅渲染和更丰富的动画效果。

### 迁移原因

| 当前问题 | PixiJS 解决方案 |
|---------|----------------|
| 数百个 DOM 节点性能下降 | WebGL 批量渲染，数千精灵流畅运行 |
| CSS 动画灵活性有限 | Ticker 驱动，可控性更强 |
| 特效实现困难 | 粒子系统、滤镜、着色器支持 |

### 架构对比

```
当前架构 (DOM):
┌─────────────────────────────────────────┐
│              GameView                     │
├─────────────────────────────────────────┤
│  Viewport (CSS transform)                │
│  ├── CardGrid (v-for stacks)             │
│  │   └── CardStack (v-for cards)         │
│  │       └── Card (DOM elements)         │
│  └── PanelLayer (DOM overlays)           │
└─────────────────────────────────────────┘

目标架构 (PixiJS):
┌─────────────────────────────────────────┐
│              GameView                     │
├─────────────────────────────────────────┤
│  PixiGame (Canvas)                       │
│  ├── worldContainer (平移/缩放)          │
│  │   ├── gridContainer (网格背景)        │
│  │   └── cardContainer (卡牌精灵)        │
│  └── UI Layer (Vue DOM - 面板/弹窗)       │
└─────────────────────────────────────────┘
```

## 迁移计划

### 阶段一：基础设施 (1-2天)

**目标**: 建立 PixiJS 渲染基础，集成到现有架构

```
任务清单:
├── [x] 1.1 安装 pixi.js 依赖
├── [x] 1.2 创建 PixiApplication 封装
├── [x] 1.3 创建渲染层接口 (GameRenderer)
├── [x] 1.4 集成到 GameView
└── [x] 1.5 验证基本渲染
```

**产出文件:**
- `src/game/renderer/PixiApplication.ts` - Pixi 应用封装
- `src/game/renderer/GameRenderer.ts` - 渲染器接口

---

### 阶段二：卡牌渲染 (2-3天)

**目标**: 实现卡牌精灵渲染，替换现有 Card/CardStack 组件

```
任务清单:
├── [x] 2.1 创建 CardSprite 类
├── [x] 2.2 创建 SpritePool (精灵池，复用)
├── [x] 2.3 实现卡牌绘制 (背景/名字栏/emoji)
├── [x] 2.4 实现堆叠渲染 (多层叠加)
├── [x] 2.5 状态同步 (选中/悬停/拖拽)
└── [x] 2.6 性能测试 (100+ 卡牌)
```

**关键类设计:**

```typescript
// CardSprite.ts
class CardSprite extends Container {
  // 卡牌数据
  cardData: GameCard
  
  // 绘制方法
  render(card: GameCard): void
  
  // 状态更新
  setSelected(selected: boolean): void
  setHovered(hovered: boolean): void
  setDragging(dragging: boolean): void
}

// SpritePool.ts
class SpritePool {
  // 预创建精灵
  prewarm(count: number): void
  
  // 获取精灵
  acquire(): CardSprite
  
  // 归还精灵
  release(sprite: CardSprite): void
}
```

---

### 阶段三：视口控制 (1-2天)

**目标**: 实现地图的缩放/平移，替换现有 Viewport 组件

```
任务清单:
├── [x] 3.1 实现 ViewportController 类
├── [x] 3.2 缩放 (以视口中心为锚点)
├── [x] 3.3 平移 (边界限制)
├── [x] 3.4 鼠标滚轮缩放
├── [x] 3.5 键盘快捷键支持
└── [x] 3.6 与 gameStore 状态同步
```

---

### 阶段四：拖拽交互 (2-3天)

**目标**: 实现卡牌拖拽，与现有 DragModule 集成

```
任务清单:
├── [x] 4.1 拖拽事件系统
├── [x] 4.2 拖拽开始 (pointerdown)
├── [x] 4.3 拖拽移动 (pointermove)
├── [x] 4.4 拖拽结束 (pointerup)
├── [x] 4.5 碰撞检测 (与堆叠/槽位)
├── [x] 4.6 分离/合并逻辑
└── [x] 4.7 与 DragModule 集成
```

**事件流程:**

```
pointerdown (卡牌)
    ↓
gameStore.startDrag() → DragModule.startDrag()
    ↓
渲染层: 提升精灵层级，设置拖拽状态
    ↓
pointermove (全局)
    ↓
gameStore.updateDrag() → DragModule.updateDrag()
    ↓
渲染层: 更新精灵位置
    ↓
pointerup (全局)
    ↓
gameStore.endDrag() → DragModule.endDrag()
    ↓
渲染层: 放置/合并/分离
```

---

### 阶段五：UI 混合 (1-2天)

**目标**: 处理 PixiJS 画布与 Vue DOM UI 的混合布局

```
任务清单:
├── [x] 5.1 面板层保留 Vue DOM
├── [x] 5.2 弹窗保留 Vue DOM
├── [x] 5.3 时间面板保留 Vue DOM
├── [x] 5.4 小地图迁移决策
│   ├── 选项A: 保留 Vue DOM ✓
│   └── 选项B: PixiJS 渲染 (性能更好)
└── [x] 5.5 事件穿透处理
```

---

### 阶段六：优化与清理 (1-2天)

**目标**: 性能优化，移除旧代码

```
任务清单:
├── [x] 6.1 移除旧 Card.vue
├── [x] 6.2 移除旧 CardStack.vue
├── [x] 6.3 移除旧 CardGrid.vue
├── [x] 6.4 精灵池优化
├── [x] 6.5 批量渲染优化
└── [x] 6.6 完整功能测试
```

---

## 文件对应关系

| 旧文件 (Vue DOM) | 新文件 (PixiJS) | 说明 |
|------------------|-----------------|------|
| `Card.vue` | `CardSprite.ts` | 单卡牌渲染 (已删除) |
| `CardStack.vue` | 内嵌 CardSprite | 堆叠渲染 (已删除) |
| `CardGrid.vue` | `CardContainer.ts` | 卡牌容器 (已删除) |
| `Viewport.vue` | `ViewportController.ts` | 视口控制 (已删除) |
| `DragLayer.vue` | `DragHandler.ts` | 拖拽处理 (已删除) |

## 渐进式迁移策略

### 策略: 并行运行，逐步替换

```
阶段一完成后:
┌─────────────────────────────────────────┐
│              GameView                     │
├─────────────────────────────────────────┤
│  Viewport                                │
│  ├── CardGrid (旧 - Vue)                 │
│  └── PixiGame (新 - 隐藏)               │
└─────────────────────────────────────────┘

阶段二完成后:
┌─────────────────────────────────────────┐
│              GameView                     │
├─────────────────────────────────────────┤
│  Viewport                                │
│  ├── CardGrid (旧 - Vue) - 仍使用        │
│  └── PixiGame (新 - 启用)               │
└─────────────────────────────────────────┘
```

### 切换开关

在 `gameStore` 中添加开发开关:

```typescript
// gameStore.ts
const usePixiRenderer = ref(false)  // 开发阶段手动切换

// 或通过 URL 参数
const isPixiMode = computed(() => {
  return new URLSearchParams(location.search).get('pixi') === '1'
})
```

## 保留组件

以下组件保留 Vue DOM 实现，无需迁移:

| 组件 | 原因 |
|------|------|
| `PanelLayer.vue` | 复杂 UI，DOM 更方便 |
| `Panel.vue` | 面板窗口 |
| `Slot.vue` | 槽位组件 |
| `MiniMap.vue` | 可选迁移 |
| `ZoomControls.vue` | 简单按钮 |
| `HelpModal.vue` | 弹窗 |
| `TimePanel.vue` | 简单 UI |
| `DevToolbar.vue` | 开发工具 |

## 类型适配

### 扩展游戏类型

```typescript
// src/game/types/pixi.ts
import type { Container, Sprite, Graphics, Text } from 'pixi.js'

// Pixi 精灵包装类型
export interface CardSpriteWrapper {
  container: Container
  background: Graphics
  nameBar: Graphics
  emoji: Text
  cardData: GameCard
}

// 渲染器接口
export interface IGameRenderer {
  // 初始化
  init(container: HTMLElement): Promise<void>
  destroy(): void
  
  // 卡牌操作
  createCardSprite(card: GameCard): CardSpriteWrapper
  updateCardSprite(id: string, card: GameCard): void
  removeCardSprite(id: string): void
  
  // 视口操作
  setScale(scale: number): void
  setPan(x: number, y: number): void
  
  // 事件
  onDragStart(callback: (card: GameCard) => void): void
  onDragMove(callback: (card: GameCard, x: number, y: number) => void): void
  onDragEnd(callback: (card: GameCard, x: number, y: number) => void): void
}
```

## 性能目标

| 指标 | 目标 |
|------|------|
| 帧率 | 60 FPS (500+ 卡牌) |
| 内存 | < 200MB |
| 首帧 | < 100ms |
| 交互响应 | < 16ms |

## 风险与应对

| 风险 | 应对方案 |
|------|----------|
| Emoji 渲染模糊 | 使用 BitmapText 或自定义字体 |
| 迁移周期长 | 渐进式迁移，并行运行 |
| 调试困难 | 保留旧代码作为对照 |
| 文本输入 | 使用 HTML overlay |

## 验收标准

- [x] 500 张卡牌渲染 60fps
- [x] 拖拽/缩放/平移交互流畅
- [x] 与现有 gameStore 完美集成
- [x] 面板/弹窗 UI 正常显示
- [x] 无内存泄漏
- [x] 开发体验良好

## 迁移完成状态

**状态: ✅ 已完成**

迁移日期: 2024年

已删除的旧文件:
- `src/game/card/Card.vue`
- `src/game/card/CardStack.vue`
- `src/game/card/CardGrid.vue`
- `src/game/card/CardTimer.vue`
- `src/game/core/Viewport.vue`
- `src/components/ui/DragLayer.vue`

新增的 PixiJS 渲染器:
- `src/game/renderer/PixiApplication.ts`
- `src/game/renderer/CardSprite.ts`
- `src/game/renderer/SpritePool.ts`
- `src/game/renderer/ViewportController.ts`
- `src/game/renderer/DragHandler.ts`
- `src/game/renderer/PixiGameRenderer.ts`
- `src/game/renderer/PixiGameRenderer.vue`
- `src/game/renderer/index.ts`

## 时间估算

| 阶段 | 时间 | 累计 |
|------|------|------|
| 阶段一 | 1-2天 | 1-2天 |
| 阶段二 | 2-3天 | 3-5天 |
| 阶段三 | 1-2天 | 4-7天 |
| 阶段四 | 2-3天 | 6-10天 |
| 阶段五 | 1-2天 | 7-12天 |
| 阶段六 | 1-2天 | 8-14天 |

**总计: 约 2 周**
