# 拖拽管理 (DragModule)

负责卡牌拖拽的完整生命周期，位于 `src/game/engine/DragModule.ts`。

## 拖拽流程

```
1. startDrag(stack, cardIndex, screenX, screenY)
   │
   ├── 记录拖拽起始状态
   └── 返回起始世界坐标
   
2. calculateDragPosition(screenX, screenY)  [拖拽过程中]
   │
   ├── 计算屏幕增量
   ├── 转换为世界增量（Y轴反转）
   ├── 限制坐标在地图边界内
   └── 返回新的世界坐标
   
3. endDrag(stacks, screenX, screenY)
   │
   ├── 使用 elementFromPoint 查找目标
   ├── 尝试合并（如果可堆叠）
   └── 返回放置结果
```

## 碰撞检测方案

使用 `elementFromPoint` 方案实现精确的碰撞检测：

```
┌─────────────────────────────────────────────────────────────────┐
│                    碰撞检测流程                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 临时隐藏拖拽元素（设置 pointerEvents: 'none'）               │
│                                                                 │
│  2. document.elementFromPoint(screenX, screenY)                 │
│     └── 获取鼠标位置的最上层 DOM 元素                            │
│                                                                 │
│  3. 向上查找 [data-stack-id] 容器                               │
│     └── el.closest('[data-stack-id]')                          │
│                                                                 │
│  4. 从 stackMap 获取堆叠数据                                     │
│     └── stackMap.get(stackId)  // O(1) 查找                     │
│                                                                 │
│  5. 恢复拖拽元素的 pointerEvents                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

优点：
- 像素级精确碰撞检测
- 自动处理 z-index 层级
- 自动处理 transform 缩放/平移
- 无需手动计算边界
- O(1) 查找复杂度
```

## DOM 与数据映射

```
渲染层：CardStack.vue
  └── <div class="card-stack" :data-stack-id="stack.id">

数据层：gameStore
  └── stackMap: Map<string, CardStack>  // O(1) 查找
```

## 边界限制

卡牌拖拽时会自动限制在 ground 区域内，确保卡牌不会移动到可放置区域外面。

### 卡牌锚点

卡牌的锚点位于**左下角**，使用 CSS `left` 和 `bottom` 定位：

```
     ┌─────────────────┐
     │     名字栏      │  ← 顶部 (32px)
     ├─────────────────┤
     │                 │  ↑
     │     内容区域    │  │ 内容区高度 (75px)
     │                 │  ↓
     └─────────────────┘
     ↑                 ↑
     锚点(x, y)        x + cardWidth
     (左下角)
```

- `x` = 卡牌左边缘的世界坐标
- `y` = 卡牌底边缘的世界坐标（CSS bottom 值）
- 名字栏在卡牌顶部，内容区域在下方

### 世界坐标系统

**世界坐标原点在地图左下角 (0, 0)**，地图右上角坐标为 (mapWidth, mapHeight)。

```
地图尺寸：2560 x 1440

   (0, 1440) ───────────────────────────── (2560, 1440)
      │                                       │
      │           地图区域                    │
      │        (可放置卡牌区域)                │
      │                                       │
      │                                       │
   (0, 0) ───────────────────────────── (2560, 0)
      ↑
   世界坐标原点
```

### 锚点限制范围

为确保卡牌完全在地图内，锚点的世界坐标限制范围为：

| 轴 | 最小值 | 最大值 | 计算公式 |
|----|--------|--------|----------|
| X | 0 | 2480 | `mapWidth - cardWidth` |
| Y | 0 | 1333 | `mapHeight - cardHeight` |

### 实现位置

边界限制在以下位置实现：
1. `CoordinateModule.clampCardPosition()` - 核心边界限制方法
2. `DragModule.calculateDragPosition()` - 拖拽计算时限制
3. `gameStore.moveStack()` - 移动堆叠时限制（双重保障）

## 拖拽状态

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
