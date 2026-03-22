/**
 * 配方配置文件
 * Recipe Configuration File
 * 
 * 定义游戏中的所有配方
 * Defines all recipes in the game
 */

import type { RecipeDefinition } from '@/game/types/recipe'

/**
 * 配方定义列表
 * Recipe definitions list
 */
export const recipeDefinitions: RecipeDefinition[] = [
  // ========== 研究配方 / Research Recipes ==========
  {
    id: 'research_basic',
    nameKey: 'recipes.research_basic.name',
    descriptionKey: 'recipes.research_basic.description',
    icon: '📖',
    inputs: [
      { slotId: 'book', consume: true },
      { slotId: 'funds', consume: false }
    ],
    outputs: [
      { 
        typeId: 'knowledge_fragment', 
        nameKey: 'cards.knowledge_fragment', 
        emoji: '💡', 
        count: 1,
        aspects: { knowledge: 1 }
      }
    ],
    duration: 30
  },
  {
    id: 'research_advanced',
    nameKey: 'recipes.research_advanced.name',
    descriptionKey: 'recipes.research_advanced.description',
    icon: '🔬',
    inputs: [
      { slotId: 'book', consume: true },
      { slotId: 'funds', consume: true }
    ],
    outputs: [
      { 
        typeId: 'knowledge_essence', 
        nameKey: 'cards.knowledge_essence', 
        emoji: '✨', 
        count: 1,
        aspects: { knowledge: 3, mystery: 1 }
      }
    ],
    duration: 60,
    conditions: [
      { type: 'random', value: 0.7, descriptionKey: 'recipes.research_advanced.condition' }
    ]
  },
  
  // ========== 制作配方 / Crafting Recipes ==========
  {
    id: 'craft_duplicate',
    nameKey: 'recipes.craft_duplicate.name',
    descriptionKey: 'recipes.craft_duplicate.description',
    icon: '📋',
    inputs: [
      { slotId: 'worker', consume: false },
      { slotId: 'material', consume: false }
    ],
    outputs: [
      { 
        copyFromSlot: 'material',
        count: 1
      }
    ],
    duration: 5
  },
  {
    id: 'craft_basic',
    nameKey: 'recipes.craft_basic.name',
    descriptionKey: 'recipes.craft_basic.description',
    icon: '🔨',
    inputs: [
      { slotId: 'material', consume: true },
      { slotId: 'tool', consume: false }
    ],
    outputs: [
      { 
        typeId: 'crafted_item', 
        nameKey: 'cards.crafted_item', 
        emoji: '📦', 
        count: 1
      }
    ],
    duration: 15
  },
  {
    id: 'craft_advanced',
    nameKey: 'recipes.craft_advanced.name',
    descriptionKey: 'recipes.craft_advanced.description',
    icon: '⚒️',
    inputs: [
      { slotId: 'material', consume: true },
      { slotId: 'tool', consume: true }
    ],
    outputs: [
      { 
        typeId: 'masterwork', 
        nameKey: 'cards.masterwork', 
        emoji: '🏆', 
        count: 1,
        aspects: { power: 2 }
      }
    ],
    duration: 45
  },
  
  // ========== 仪式配方 / Ritual Recipes ==========
  {
    id: 'ritual_summon',
    nameKey: 'recipes.ritual_summon.name',
    descriptionKey: 'recipes.ritual_summon.description',
    icon: '🌟',
    inputs: [
      { slotId: 'offering', consume: true },
      { slotId: 'influence', consume: true }
    ],
    outputs: [
      { 
        typeId: 'summoned_entity', 
        nameKey: 'cards.summoned_entity', 
        emoji: '👻', 
        count: 1,
        aspects: { mystery: 3, power: 1 }
      }
    ],
    duration: 90,
    conditions: [
      { type: 'random', value: 0.5, descriptionKey: 'recipes.ritual_summon.condition' }
    ]
  },
  {
    id: 'ritual_sacrifice',
    nameKey: 'recipes.ritual_sacrifice.name',
    descriptionKey: 'recipes.ritual_sacrifice.description',
    icon: '💀',
    inputs: [
      { 
        slotId: 'offering', 
        consume: true,
        matchRule: { minAspects: { mystery: 3 } }
      }
    ],
    outputs: [
      { 
        typeId: 'power_fragment', 
        nameKey: 'cards.power_fragment', 
        emoji: '⚡', 
        count: 1,
        aspects: { power: 2, mystery: 1 }
      }
    ],
    duration: 120
  }
]

/**
 * 根据 ID 获取配方定义
 * Get recipe definition by ID
 */
export function getRecipeDefinition(id: string): RecipeDefinition | undefined {
  return recipeDefinitions.find(r => r.id === id)
}

/**
 * 获取面板可用的配方列表
 * Get available recipes for a panel
 */
export function getPanelRecipes(_panelId: string): RecipeDefinition[] {
  // 这里可以根据面板 ID 过滤配方
  // Filter recipes based on panel ID
  // 目前返回所有配方，后续可以根据面板类型过滤
  // Currently returns all recipes, can filter by panel type later
  return recipeDefinitions
}

export default recipeDefinitions
