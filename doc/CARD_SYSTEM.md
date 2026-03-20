# 卡牌系统设计

## 1. 卡牌类型配置

### 配置结构 (src/config/cardTypes.ts)

```typescript
export interface CardTypeConfig {
  id: string           // 类型ID
  name: string         // 显示名称
  color: string        // 顶部条颜色
}

export interface CardItemConfig {
  typeId: string       // 所属类型
  name: string         // 显示名称
  emoji: string        // 显示emoji
}

export const cardTypes: CardTypeConfig[] = [
  { id: 'material', name: '素材', color: '#8b5cf6' },   // 紫色
  { id: 'unit', name: '单位', color: '#3b82f6' },       // 蓝色
  { id: 'building', name: '建筑', color: '#f59e0b' },   // 橙色
]

export const cardItems: CardItemConfig[] = [
  // 素材类
  { typeId: 'material', name: '木材', emoji: '🪵' },
  { typeId: 'material', name: '石材', emoji: '🪨' },
  // ...更多配置
]
```

## 2. 卡牌数据结构

```typescript
interface GameCard {
  id: string
  typeId: string                      // 卡牌类型ID
  name: string                        // 卡牌名称
  emoji: string                       // 显示emoji
  gridX: number                       // 世界坐标X
  gridY: number                       // 世界坐标Y
  data: Record<string, unknown>       // 扩展数据
  stackId: string                     // 所属堆叠ID
}

interface CardStack {
  id: string
  cards: GameCard[]                   // 同一位置的堆叠卡牌
}
```

## 3. 堆叠视觉效果

堆叠时按照添加顺序从下往上排列：
- 最新添加的卡片在最上方（只显示顶部条）
- 最老的卡片在底部（显示完整内容）
- **单张卡片显示完整内容**

```
显示效果（假设3张卡牌堆叠）：

┌─────────┐
│ Card3   │ ← 最新，只有name strip
├─────────┤
│ Card2   │
├─────────┤
│ Card1   │ ← 最老，显示完整内容
├─────────┤
│  🪵    │
└─────────┘

单张卡片效果：

┌─────────┐
│ Card1   │ ← 标题栏
├─────────┤
│         │
│  🪵    │ ← 内容区（显示完整）
│         │
└─────────┘
```

## 4. 组件结构

### Card.vue
单张卡牌组件，负责：
- 渲染单张卡牌的外观（顶部条 + 内容区）
- 根据 `isTop` 属性决定显示模式
- emoji 设为不可选中（`user-select: none; pointer-events: none`）

### CardStack.vue
堆叠容器组件，负责：
- 计算并渲染所有堆叠卡牌的叠加效果
- 处理堆叠内的点击和拖拽事件
- 堆叠偏移常量：`STACK_OFFSET = 8px`
- `isTop` 判断逻辑：`index === 0 && sortedCards.length > 1`

### CardGrid.vue
网格容器组件，负责：
- 管理所有堆叠的位置
- 传递拖拽事件到父组件

## 5. 拖拽系统

### 事件流

```
CardStack (mousedown)
    │
    ▼ stopPropagation
CardGrid
    │
    ▼ emit
GameView (window mousemove/mouseup)
```

### 坐标转换

使用 `CoordinateSystem.screenDeltaToWorldDelta()` 进行坐标转换：

```typescript
// GameView.vue
function handleStackDragMove(e: MouseEvent) {
  // 计算鼠标移动的 delta（屏幕坐标）
  const dx = e.clientX - dragStartMouse.value.x
  const dy = e.clientY - dragStartMouse.value.y
  
  // 使用坐标系统转换为世界坐标
  const worldDelta = gameStore.screenDeltaToWorldDelta(dx, dy)
  
  // 计算新位置
  const newX = dragStartStack.value.x + worldDelta.dx
  const newY = dragStartStack.value.y + worldDelta.dy
  
  gameStore.moveStack(gameStore.draggingStackId, newX, newY)
}
```

### 拖拽优化

- 移除 `mouseleave` 事件，防止快速拖拽中断
- 使用 `window` 级别的 `mousemove/mouseup` 监听
- 拖拽时禁用 transition，确保跟手

## 6. Store 接口

### gameStore 方法

```typescript
// 坐标系统
coordinateSystem: CoordinateSystem  // 坐标系统实例

// 坐标转换
screenToWorld(screenX: number, screenY: number)
worldToScreen(worldX: number, worldY: number)
screenDeltaToWorldDelta(dx: number, dy: number)

// 拖拽相关
draggingStackId: ref<string | null>  // 当前拖拽的堆叠ID
startStackDrag(stackId: string)      // 开始拖拽
endStackDrag()                        // 结束拖拽
moveStack(stackId: string, x: number, y: number)  // 移动堆叠

// 卡牌操作
createStack(x: number, y: number, typeId: string, name: string, emoji: string): CardStack
addCardToStack(stackId: string, typeId: string, name: string, emoji: string): GameCard | null
removeSelectedStack()                 // 删除选中的堆叠
generateRandomCards(count: number)    // 生成随机测试卡牌
```

## 7. 开发者工具

### DevToolbar.vue
开发期间使用的临时工具栏，提供以下功能：
- 选择卡牌类型（素材/单位/建筑）
- 从配置中选择卡牌名称和emoji
- 添加卡牌到地图
- 删除选中卡牌
- 清空所有卡牌

## 8. 交互设计

### 点击
- 点击堆叠任意位置：选中整个堆叠
- emoji 不可被鼠标选中

### 拖拽移动
- 拖拽时移动整个堆叠
- 自由放置，不吸附网格
- 拖拽过程中实时更新位置
- 快速拖拽不会中断

## 9. 已完成功能

- [x] 卡牌类型配置系统
- [x] 卡牌数据结构调整
- [x] Card.vue 组件
- [x] CardStack.vue 组件
- [x] CardGrid.vue 组件
- [x] 堆叠视觉效果
- [x] 单张卡片显示完整内容
- [x] 卡牌拖拽移动
- [x] emoji 不可选中
- [x] Store 新方法
- [x] 开发者工具栏

## 10. 待实现功能

- [ ] 卡牌详情窗口
- [ ] 卡牌内容区显示图片（而非emoji）
- [ ] 卡牌合成系统
- [ ] 卡牌交互逻辑
