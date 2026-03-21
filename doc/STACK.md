# 堆叠管理 (StackModule)

负责卡牌堆叠的创建、分离、合并等操作，位于 `src/game/engine/StackModule.ts`。

## 堆叠数据结构

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

## 堆叠操作

| 操作 | 说明 |
|------|------|
| `createStack(x, y, typeId, name, emoji)` | 创建新堆叠 |
| `separateStack(stack, fromIndex)` | 从指定索引分离，返回新堆叠 |
| `mergeStacks(source, target)` | 合并两个堆叠 |
| `moveStack(stack, x, y)` | 移动堆叠到指定位置 |
| `getStackBounds(stack)` | 计算堆叠边界 |
| `findStackAtPosition(stacks, x, y)` | 查找指定位置的堆叠 |

## 分离逻辑

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

## 堆叠坐标系统

```
堆叠卡牌坐标计算：

CSS bottom 定位（锚点在卡牌左下角）：
- 底层卡牌 (index=0): bottom=0
- 上层卡牌 (index=n): bottom=-n*NAME_STRIP_HEIGHT
- 顶层卡牌额外偏移: bottom -= CONTENT_HEIGHT

世界坐标：
- 所有卡牌的 y 值相同（底层卡牌的 y）
- 渲染偏移由 CSS bottom 处理

分离计算：
- 新堆叠 y = 原堆叠底层 y - fromIndex * NAME_STRIP_HEIGHT

渲染效果示例（3张卡牌堆叠）：
         0 ─────────────────────  ← card0 名字栏顶部
        -32 ─────────────────────  ← card1 名字栏顶部
        -64 ─────────────────────  ← card2 名字栏顶部 (顶层)
       -139 ─────────────────────  ← card2 内容区底部
```
