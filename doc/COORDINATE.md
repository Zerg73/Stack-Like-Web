# 坐标系统 (CoordinateModule)

统一处理所有坐标转换的核心模块，位于 `src/game/engine/CoordinateModule.ts`。

## 坐标系说明

```
┌─────────────────────────────────────────────────────────┐
│                    坐标系统架构                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  视口坐标                                               │
│  ┌──────────────┐         ┌──────────────┐              │
│  │ 原点: 左上角  │         │ transform    │              │
│  │ X→ Y↓        │ ──────► │ translate    │              │
│  └──────────────┘         │ scale        │              │
│                           │ rotateX      │              │
│                           └──────────────┘              │
│                                  │                      │
│                                  ▼                      │
│  世界坐标                                               │
│  ┌──────────────┐                                        │
│  │ 原点: 左下角  │                                        │
│  │ X→ Y↑        │                                        │
│  └──────────────┘                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 视口坐标系 (Viewport Coordinates)

### 定义

视口坐标系是浏览器内容区域的坐标系，用于描述鼠标位置和 DOM 元素在浏览器窗口内的位置。

> **注意**: 在 Web 开发中，"屏幕坐标"通常指显示器物理坐标 (`screenX/screenY`)，
> 而我们实际使用的是视口坐标 (`clientX/clientY`)。

### 特点

| 属性 | 值 |
|------|-----|
| 原点位置 | 浏览器视口左上角 |
| X 轴方向 | 向右为正 |
| Y 轴方向 | **向下为正** |
| 单位 | 像素 (px) |
| 范围 | [0, window.innerWidth] × [0, window.innerHeight] |

### 示意图

```
   (0, 0) ───────────────────── (window.innerWidth, 0)
      │                                       │
      │     浏览器窗口                         │
      │                                       │
      │                                       │
      │                                       │
   (0, window.innerHeight) ─── (window.innerWidth, window.innerHeight)
```

### 使用场景

- 鼠标事件 (`mousedown`, `mousemove`, `mouseup`) 的 `clientX`, `clientY`
- `element.getBoundingClientRect()` 返回的位置
- `document.elementFromPoint(x, y)` 的参数

## 世界坐标系 (World Coordinates)

### 定义

世界坐标系是游戏世界的逻辑坐标系，用于描述游戏对象（如卡牌）在地图上的位置。

### 特点

| 属性 | 值 |
|------|-----|
| 原点位置 | 地图左下角 |
| X 轴方向 | 向右为正 |
| Y 轴方向 | **向上为正** |
| 单位 | 像素 (px) |
| 范围 | [0, mapWidth] × [0, mapHeight] |

### 示意图

```
地图尺寸：2560 x 1440

   (0, 1440) ───────────────────── (2560, 1440)
      │                                       │
      │           地图区域                    │
      │        (可放置卡牌区域)                │
      │                                       │
      │                                       │
   (0, 0) ───────────────────────────── (2560, 0)
      ↑
   世界坐标原点
```

### 与 CSS 定位的关系

世界坐标系与 CSS `left` 和 `bottom` 定位一致：

| 世界坐标 | CSS 属性 |
|----------|----------|
| `x` | `left` |
| `y` | `bottom` |

```css
.card {
  position: absolute;
  left: 100px;    /* 世界坐标 x = 100 */
  bottom: 200px;  /* 世界坐标 y = 200 */
}
```

### 使用场景

- 卡牌位置存储 (`GameCard.x`, `GameCard.y`)
- 堆叠位置计算
- 碰撞检测
- 存档数据

## 坐标转换规则

### 视口坐标 → 世界坐标

**方法**: `screenToWorld(screenX, screenY)`

> 方法名保留 `screen` 是历史原因，实际参数为视口坐标。

**转换步骤**:

```
1. 减去平移 (translate)
   x = screenX - translateX
   y = screenY - translateY

2. 除以缩放 (scale)
   x = x / scale
   y = y / scale

3. Y 轴反转 (因为屏幕 Y 向下，世界 Y 向上)
   worldX = x
   worldY = mapHeight - y
```

**公式**:
```
worldX = (screenX - translateX) / scale
worldY = mapHeight - (screenY - translateY) / scale
```

**示例**:
```typescript
// 假设：translateX = 0, translateY = 0, scale = 1, mapHeight = 1440
// 屏幕坐标 (100, 200)
screenToWorld(100, 200)
// → worldX = (100 - 0) / 1 = 100
// → worldY = 1440 - (200 - 0) / 1 = 1240
// 结果：世界坐标 (100, 1240)
```

### 世界坐标 → 视口坐标

**方法**: `worldToScreen(worldX, worldY)`

> 方法名保留 `screen` 是历史原因，实际返回值为视口坐标。

**转换步骤**:

```
1. Y 轴反转
   x = worldX * scale
   y = (mapHeight - worldY) * scale

2. 加上平移 (translate)
   screenX = x + translateX
   screenY = y + translateY
```

**公式**:
```
screenX = worldX * scale + translateX
screenY = (mapHeight - worldY) * scale + translateY
```

**示例**:
```typescript
// 假设：translateX = 0, translateY = 0, scale = 1, mapHeight = 1440
// 世界坐标 (100, 1240)
worldToScreen(100, 1240)
// → screenX = 100 * 1 + 0 = 100
// → screenY = (1440 - 1240) * 1 + 0 = 200
// 结果：屏幕坐标 (100, 200)
```

### 视口增量 → 世界增量

**方法**: `screenDeltaToWorldDelta(dx, dy)`

> 方法名保留 `screen` 是历史原因，实际参数为视口增量。

**用途**: 拖拽时计算移动距离

**转换规则**:

```
worldDx = dx / scale
worldDy = -dy / scale  // Y 轴反转
```

**Y 轴反转原因**:

```
屏幕坐标：Y 向下为正
世界坐标：Y 向上为正（与 CSS bottom 一致）

鼠标向下移动 (dy > 0):
  → 希望 bottom 值减小
  → 世界 Y 坐标减小
  → 所以 worldDy = -dy / scale
```

**示例**:
```typescript
// 鼠标向下移动 100 像素，scale = 1
screenDeltaToWorldDelta(0, 100)
// → { dx: 0, dy: -100 }
// 世界坐标 Y 减小 100，卡牌向下移动
```

## 核心方法

| 方法 | 用途 |
|------|------|
| `screenToWorld(x, y)` | 视口坐标 → 世界坐标 |
| `worldToScreen(x, y)` | 世界坐标 → 视口坐标 |
| `screenDeltaToWorldDelta(dx, dy)` | 视口增量 → 世界增量（Y轴反转） |
| `getTranslateBounds()` | 计算平移边界 |
| `clampTranslate(x, y)` | 限制平移在边界内 |
| `clampCardPosition(x, y)` | 限制卡牌位置在地图边界内 |
| `getTransformStyle()` | 生成 CSS transform |

## 卡牌锚点

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

## 锚点限制范围

为确保卡牌完全在地图内，锚点的世界坐标限制范围为：

| 轴 | 最小值 | 最大值 | 计算公式 |
|----|--------|--------|----------|
| X | 0 | 2480 | `mapWidth - cardWidth` |
| Y | 0 | 1333 | `mapHeight - cardHeight` |

## 实现位置

边界限制在以下位置实现：
1. `CoordinateModule.clampCardPosition()` - 核心边界限制方法
2. `DragModule.calculateDragPosition()` - 拖拽计算时限制
3. `gameStore.moveStack()` - 移动堆叠时限制（双重保障）

## 视口变换

视口变换通过 CSS `transform` 实现：

```css
transform: translate(translateX, translateY) scale(scale) rotateX(rotateX);
```

| 参数 | 说明 |
|------|------|
| `translateX` | 地图水平偏移（正值向右） |
| `translateY` | 地图垂直偏移（正值向下） |
| `scale` | 缩放比例 (0.5 ~ 2) |
| `rotateX` | 3D 旋转角度 |

**transform-origin**: `left bottom`（与地图左下角对齐）
