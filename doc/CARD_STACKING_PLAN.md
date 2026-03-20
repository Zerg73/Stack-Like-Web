# 卡牌堆叠系统方案

## 1. 需求概述

### 堆叠触发
- 拖拽卡牌放置到另一张卡牌上时自动堆叠
- 需要检测目标位置是否有可堆叠的卡牌

### 分离方式
- 点击堆叠中任意卡牌的名字栏可以拖拽分离
- 分离规则：从拖拽的那张卡牌(m)到最顶层(n)为一堆，剩余的(m-1)到最底层(0)为另一堆
- 如果拖拽的是最底层的卡牌，则移动整个堆叠（不分离）

```
分离前：
┌─────────┐
│ Card3   │ ← n (最顶层)
├─────────┤
│ Card2   │ ← m (拖拽这张)
├─────────┤
│ Card1   │
├─────────┤
│  🪵    │
└─────────┘
│ Card0   │ ← 0 (最底层)
└─────────┘

分离后：
┌─────────┐        ┌─────────┐
│ Card3   │        │ Card1   │
├─────────┤        ├─────────┤
│ Card2   │        │  🪵    │
├─────────┤        └─────────┘
│  🪵    │              ↑
└─────────┘         剩余堆叠
   拖走的一堆
```

### 堆叠规则
- 遵照配置表定义
- 同类型卡牌可以堆叠
- 未来可扩展更复杂的规则

## 2. 配置表更新

### cardTypes.ts 更新

```typescript
export interface CardTypeConfig {
  id: string
  name: string
  color: string
  stackable: boolean        // 是否允许堆叠
  stackWith?: string[]      // 可堆叠的其他类型ID（可选）
}

export const cardTypes: CardTypeConfig[] = [
  { id: 'material', name: '素材', color: '#8b5cf6', stackable: true },
  { id: 'unit', name: '单位', color: '#3b82f6', stackable: false },
  { id: 'building', name: '建筑', color: '#f59e0b', stackable: false },
]
```

### 堆叠规则函数

```typescript
// 检查两个卡牌是否可以堆叠
function canStack(card1: GameCard, card2: GameCard): boolean {
  const type1 = getCardType(card1.typeId)
  const type2 = getCardType(card2.typeId)
  
  if (!type1?.stackable || !type2?.stackable) return false
  
  // 同类型可以堆叠
  if (card1.typeId === card2.typeId) return true
  
  // 检查是否在 stackWith 列表中
  if (type1.stackWith?.includes(card2.typeId)) return true
  if (type2.stackWith?.includes(card1.typeId)) return true
  
  return false
}
```

## 3. 交互设计

### 拖拽区域划分

```
每张卡牌都有独立的名字栏，可以单独拖拽：

┌─────────────────┐
│  Card3 名字栏   │ ← 拖拽：分离 Card3 到 n
├─────────────────┤
│  Card2 名字栏   │ ← 拖拽：分离 Card2 到 n
├─────────────────┤
│  Card1 名字栏   │ ← 拖拽：分离 Card1 到 n
├─────────────────┤
│     内容区域    │
│      🪵        │
└─────────────────┘
│  Card0 名字栏   │ ← 拖拽：移动整个堆叠（最底层）
├─────────────────┤
│     内容区域    │
│      🪵        │
└─────────────────┘
```

### 交互流程

```
拖拽开始（点击名字栏）
    │
    ├─── 拖拽最底层卡牌 ──→ 移动整个堆叠
    │         │
    │         ├─── 放置在空白处 ──→ 移动堆叠位置
    │         │
    │         └─── 放置在其他卡牌上
    │                   │
    │                   ├─── 可堆叠 ──→ 合并堆叠
    │                   │
    │                   └─── 不可堆叠 ──→ 移动堆叠位置
    │
    └─── 拖拽中间/顶层卡牌 ──→ 分离模式
              │
              ├─── 放置在空白处 ──→ 创建新堆叠
              │
              └─── 放置在其他卡牌上
                        │
                        ├─── 可堆叠 ──→ 合并到目标堆叠
                        │
                        └─── 不可堆叠 ──→ 创建新堆叠
```

### 视觉反馈

| 状态 | 反馈 |
|------|------|
| 拖拽中（可堆叠目标） | 目标卡牌高亮绿色边框 |
| 拖拽中（不可堆叠目标） | 目标卡牌高亮红色边框 |
| 拖拽中（空白区域） | 显示放置预览位置 |
| 分离模式 | 显示半透明的分离卡牌预览 |

## 4. 数据结构更新

### CardStack 更新

```typescript
interface CardStack {
  id: string
  cards: GameCard[]
  // 新增：堆叠中心坐标（用于碰撞检测）
  centerX: number
  centerY: number
}
```

### 拖拽状态更新

```typescript
interface DragState {
  isDragging: boolean
  isPanning: boolean
  isSeparating: boolean      // 是否在分离模式
  startX: number
  startY: number
  startTranslateX: number
  startTranslateY: number
  draggedStackId: string | null    // 被拖拽的堆叠ID
  draggedCardIndex: number         // 被拖拽的卡牌在堆叠中的索引
  sourceStackId: string | null     // 源堆叠ID（分离时）
}
```

## 5. 核心函数

### gameStore 新增方法

```typescript
// 检查是否可以堆叠
function canStackCards(cardId1: string, cardId2: string): boolean

// 合并两个堆叠
function mergeStacks(sourceStackId: string, targetStackId: string): boolean

// 分离堆叠：从指定索引处分离，返回新的堆叠
function separateStack(stackId: string, fromIndex: number): CardStack | null
// 示例：separateStack('stack_1', 2) 
// 将索引2到n的卡牌分离出来，原堆叠保留索引0到1的卡牌

// 查找位置上的堆叠
function findStackAtPosition(x: number, y: number, excludeId?: string): CardStack | null

// 处理卡牌放置
function handleCardDrop(
  stackId: string,
  x: number,
  y: number,
  isSeparating: boolean,
  separateIndex?: number
): void
```

## 6. 组件更新

### Card.vue 更新

每张卡牌的名字栏都可以独立拖拽：

```vue
<template>
  <div class="card" :style="cardStyle">
    <!-- 名字栏 - 可拖拽分离 -->
    <div 
      class="name-strip"
      :style="{ background: typeColor }"
      @mousedown="handleNameStripMouseDown"
    >
      <span class="type-dot"></span>
      <span class="name">{{ card.name }}</span>
    </div>

    <!-- 内容区 -->
    <div v-if="!isTop" class="content">
      <span class="emoji">{{ card.emoji }}</span>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits<{
  click: []
  dragStart: [e: MouseEvent, cardIndex: number]  // 传递卡牌索引
}>()

function handleNameStripMouseDown(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  emit('dragStart', e, props.cardIndex)
}
</script>
```

### CardStack.vue 更新

```vue
<template>
  <div class="card-stack" :style="stackStyle">
    <div
      v-for="(card, index) in sortedCards"
      :key="card.id"
      class="stack-item"
      :style="getCardStyle(index, sortedCards.length)"
    >
      <Card
        :card="card"
        :is-selected="selected"
        :is-top="index === 0 && sortedCards.length > 1"
        :card-index="index"
        @click="emit('click')"
        @drag-start="emit('dragStart', $event, index)"
      />
    </div>
  </div>
</template>
```

### CardGrid.vue 更新

```vue
<script setup>
// 拖拽目标检测
const dropTarget = ref<CardStack | null>(null)
const canDrop = ref(false)

function handleDragMove(e: MouseEvent) {
  // 检测鼠标位置下的卡牌
  const worldPos = gameStore.screenToWorld(e.clientX, e.clientY)
  const targetStack = gameStore.findStackAtPosition(worldPos.x, worldPos.y)
  
  if (targetStack && targetStack.id !== draggingStackId) {
    dropTarget.value = targetStack
    canDrop.value = gameStore.canStackCards(draggingCardId, targetStack.cards[0].id)
  } else {
    dropTarget.value = null
  }
}
</script>
```

## 7. 实现步骤

### 第一阶段：配置和基础函数
1. 更新 `cardTypes.ts` 添加 `stackable` 字段
2. 在 `gameStore.ts` 添加 `canStackCards` 函数
3. 添加单元测试验证堆叠规则

### 第二阶段：分离功能
1. 更新 `CardStack.vue` 区分拖拽区域
2. 实现名字栏拖拽分离逻辑
3. 添加分离视觉反馈

### 第三阶段：堆叠合并
1. 实现拖拽目标检测
2. 实现堆叠合并逻辑
3. 添加堆叠视觉反馈

### 第四阶段：优化和测试
1. 添加动画效果
2. 边界情况处理
3. 性能优化

## 8. 边界情况

| 情况 | 处理方式 |
|------|----------|
| 拖拽最底层卡牌 | 移动整个堆叠，不分离 |
| 分离后源堆叠只剩一张卡牌 | 正常保留，堆叠显示完整内容 |
| 分离后源堆叠为空 | 删除源堆叠（理论上不会发生，因为最底层卡牌不会分离） |
| 拖拽到不可堆叠的卡牌上 | 在目标位置旁边创建新堆叠 |
| 快速拖拽导致检测失败 | 使用较大的碰撞检测区域 |
| 拖拽到自己的堆叠上 | 忽略，不执行任何操作 |
| 堆叠数量超过上限 | 暂不限制，后续可配置 |

## 9. 后续扩展

- 支持更多堆叠规则（如：木材+石头=建筑材料）
- 支持堆叠数量限制
- 支持堆叠动画效果
- 支持拖拽预览
