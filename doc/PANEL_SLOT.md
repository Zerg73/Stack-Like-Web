# 面板槽位系统设计文档
# Panel & Slot System Design Document

## 概述 / Overview

面板槽位系统实现了类似《密教模拟器》的卡牌交互机制，允许玩家：
- 点击打开浮动面板窗口
- 将卡牌拖入槽位
- 根据槽位内的卡牌组合触发配方效果

## 核心概念 / Core Concepts

### 1. 标签系统 (Tag System)

标签系统用于卡牌的分类和匹配，包含三种类型：

| 类型 | 说明 | 特点 |
|------|------|------|
| **分类标签** | 卡牌的主要分类 | 单选互斥，如 `material`、`unit` |
| **属性标签** | 卡牌的特性标签 | 多选可叠加，如 `edible`、`flammable` |
| **方面数值** | 数值型属性 | 用于高级匹配，如 `{ knowledge: 2 }` |

### 2. 槽位匹配规则 (Slot Match Rule)

```typescript
interface SlotMatchRule {
  category?: string | string[]        // 分类要求
  requiredAttributes?: string[]       // 必需属性
  excludedAttributes?: string[]       // 排除属性
  requiredAspects?: Record<string, number>  // 方面数值要求
}
```

匹配流程：
1. **分类检查** - 卡牌分类必须匹配（支持多选一）
2. **必需属性检查** - 卡牌必须包含所有必需属性
3. **排除属性检查** - 卡牌不能包含任何排除属性
4. **方面数值检查** - 卡牌的方面值必须满足要求

### 3. 面板 (Panel)

面板是包含多个槽位的浮动窗口：

```typescript
interface PanelDefinition {
  id: string                    // 面板唯一标识
  nameKey: string               // 面板名称 i18n key
  slots: SlotDefinition[]       // 输入槽位定义
  outputSlot?: SlotDefinition   // 输出槽位（可选）
  recipes: string[]             // 可用配方 ID 列表
}
```

### 4. 配方 (Recipe)

配方定义了槽位内卡牌组合的效果：

```typescript
interface RecipeDefinition {
  id: string                    // 配方 ID
  inputs: RecipeInput[]         // 输入要求
  outputs: RecipeOutput[]       // 输出结果
  duration?: number             // 执行时间（游戏分钟）
}
```

## 文件结构 / File Structure

```
src/
├── game/
│   ├── engine/
│   │   ├── SlotModule.ts      # 槽位管理模块
│   │   └── PanelModule.ts     # 面板管理模块
│   └── types/
│       ├── tags.ts            # 标签类型定义
│       ├── slot.ts            # 槽位类型定义
│       ├── recipe.ts          # 配方类型定义
│       └── panel.ts           # 面板类型定义
└── config/
    └── tags.ts                # 标签配置
```

## 使用示例 / Usage Examples

### 1. 定义分类和属性

```typescript
// src/config/tags.ts 已预定义
import { categories, attributes, aspects } from '@/config/tags'
```

### 2. 定义面板

```typescript
// src/config/panels.ts (待创建)
import type { PanelDefinition } from '@/game/types/panel'

export const panelDefinitions: PanelDefinition[] = [
  {
    id: 'research',
    nameKey: 'panels.research.name',
    slots: [
      {
        id: 'book',
        nameKey: 'panels.research.slots.book',
        type: 'input',
        matchRule: {
          category: 'knowledge',
          requiredAspects: { knowledge: 2 }
        },
        required: true,
        maxCards: 1
      }
    ],
    outputSlot: {
      id: 'output',
      nameKey: 'panels.research.slots.output',
      type: 'output',
      matchRule: {},
      required: false,
      maxCards: 3
    },
    recipes: ['research_basic']
  }
]
```

### 3. 定义配方

```typescript
// src/config/recipes.ts (待创建)
import type { RecipeDefinition } from '@/game/types/recipe'

export const recipeDefinitions: RecipeDefinition[] = [
  {
    id: 'research_basic',
    nameKey: 'recipes.research_basic.name',
    inputs: [
      { slotId: 'book', consume: true }
    ],
    outputs: [
      { typeId: 'knowledge', nameKey: 'cards.knowledge', emoji: '💡', count: 1 }
    ],
    duration: 30
  }
]
```

### 4. 使用模块

```typescript
import { SlotModule } from '@/game/engine/SlotModule'
import { PanelModule } from '@/game/engine/PanelModule'

// 创建模块实例
const slotModule = new SlotModule()
const panelModule = new PanelModule(slotModule)

// 注册定义
panelModule.registerPanelDefinitions(panelDefinitions)
panelModule.registerRecipeDefinitions(recipeDefinitions)

// 打开面板
const panelId = panelModule.openPanel('research')

// 添加卡牌到槽位
panelModule.addCardToSlot(panelId, 'book', card)

// 检查配方匹配
const matchResult = panelModule.checkRecipeMatch(panelId)
```

## 匹配算法 / Matching Algorithm

### 单卡匹配

```
输入: 卡牌 card, 槽位匹配规则 rule
输出: boolean (是否匹配)

1. 分类检查
   - 如果 rule.category 是字符串: card.category === rule.category
   - 如果 rule.category 是数组: card.category in rule.category
   - 如果 rule.category 未定义: 跳过此检查

2. 必需属性检查
   - rule.requiredAttributes 中的每个属性都必须在 card.attributes 中存在

3. 排除属性检查
   - rule.excludedAttributes 中的任一属性存在于 card.attributes 中则拒绝

4. 方面数值检查
   - rule.requiredAspects 中的每个方面值都必须 <= card.aspects[方面名]
```

### 多卡组合匹配

当槽位 `maxCards > 1` 时，支持多卡组合匹配：

```
输入: 卡牌数组 cards, 方面要求 requiredAspects
输出: boolean (是否满足)

1. 累加所有卡的方面值
   accumulated = sum(card.aspects for card in cards)

2. 检查每个方面是否满足
   for each (aspect, required) in requiredAspects:
     if accumulated[aspect] < required:
       return false

3. return true
```

## 扩展 GameCard / Extending GameCard

要使用标签系统，需要扩展 `GameCard` 类型：

```typescript
// 扩展后的 GameCard
interface GameCardWithTags extends GameCard {
  category: string              // 分类标签
  attributes: string[]          // 属性标签
  aspects?: Record<string, number>  // 方面数值
}
```

## 后续开发 / Future Development

### 阶段二：UI 组件 ✅ 已完成
- [x] Panel.vue - 面板组件
- [x] PanelSlot.vue - 槽位组件
- [x] UILayer.vue - UI 层容器
- [x] PanelTrigger.vue - 面板触发器

### 阶段三：拖拽交互 ✅ 已完成
- [x] DragModule 扩展 - 支持槽位拖拽
- [x] 卡牌拖入槽位检测
- [x] 槽位高亮反馈

### 阶段四：配方系统 ✅ 已完成
- [x] RecipeModule.ts - 配方执行模块
- [x] 配方匹配逻辑
- [x] 配方条件检测
- [x] 配方执行流程

### 阶段五：完善 🚧 进行中
- [x] 国际化文本
- [ ] 存档支持
- [ ] 性能优化

## 文件清单 / File List

### 引擎模块
| 文件 | 说明 |
|------|------|
| `src/game/engine/SlotModule.ts` | 槽位管理模块 |
| `src/game/engine/PanelModule.ts` | 面板管理模块 |
| `src/game/engine/RecipeModule.ts` | 配方管理模块 |

### 类型定义
| 文件 | 说明 |
|------|------|
| `src/game/types/tags.ts` | 标签类型定义 |
| `src/game/types/slot.ts` | 槽位类型定义 |
| `src/game/types/recipe.ts` | 配方类型定义 |
| `src/game/types/panel.ts` | 面板类型定义 |

### UI 组件
| 文件 | 说明 |
|------|------|
| `src/components/ui/UILayer.vue` | UI 层容器 |
| `src/components/ui/Panel.vue` | 面板组件 |
| `src/components/ui/PanelSlot.vue` | 槽位组件 |
| `src/components/ui/PanelTrigger.vue` | 面板触发器 |

### 配置文件
| 文件 | 说明 |
|------|------|
| `src/config/tags.ts` | 标签配置 |
| `src/config/panels.ts` | 面板配置 |
| `src/config/recipes.ts` | 配方配置 |

## 参考 / References

- [密教模拟器 Wiki](https://cultistsimulator.fandom.com/wiki/Cultist_Simulator_Wiki)
- [DESIGN.md](./DESIGN.md) - 项目设计文档
