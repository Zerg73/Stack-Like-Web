/**
 * 标签系统配置
 * Tag System Configuration
 * 
 * 定义游戏中的分类、属性和方面标签
 * Defines categories, attributes and aspects in the game
 */

import type { 
  CategoryDefinition, 
  AttributeDefinition, 
  AspectDefinition,
  TagSystemConfig 
} from '@/game/types/tags'

// ========== 分类标签定义 / Category Definitions ==========
// 分类标签是互斥的，每张卡牌只能属于一个分类
// Categories are exclusive, each card can only belong to one category

/**
 * 分类标签列表
 * Category list
 */
export const categories: CategoryDefinition[] = [
  {
    id: 'material',
    nameKey: 'categories.material',
    color: '#8b5cf6',
    descriptionKey: 'categories.material.description'
  },
  {
    id: 'unit',
    nameKey: 'categories.unit',
    color: '#3b82f6',
    descriptionKey: 'categories.unit.description'
  },
  {
    id: 'building',
    nameKey: 'categories.building',
    color: '#f59e0b',
    descriptionKey: 'categories.building.description'
  },
  {
    id: 'knowledge',
    nameKey: 'categories.knowledge',
    color: '#10b981',
    descriptionKey: 'categories.knowledge.description'
  },
  {
    id: 'tool',
    nameKey: 'categories.tool',
    color: '#ec4899',
    descriptionKey: 'categories.tool.description'
  },
  {
    id: 'funds',
    nameKey: 'categories.funds',
    color: '#fbbf24',
    descriptionKey: 'categories.funds.description'
  },
  {
    id: 'influence',
    nameKey: 'categories.influence',
    color: '#a855f7',
    descriptionKey: 'categories.influence.description'
  }
]

// ========== 属性标签定义 / Attribute Definitions ==========
// 属性标签可以叠加，一张卡牌可以有多个属性
// Attributes can stack, a card can have multiple attributes

/**
 * 属性标签列表
 * Attribute list
 */
export const attributes: AttributeDefinition[] = [
  // 基础属性 / Basic attributes
  {
    id: 'edible',
    nameKey: 'attributes.edible',
    descriptionKey: 'attributes.edible.description',
    icon: '🍎'
  },
  {
    id: 'flammable',
    nameKey: 'attributes.flammable',
    descriptionKey: 'attributes.flammable.description',
    icon: '🔥'
  },
  {
    id: 'craftable',
    nameKey: 'attributes.craftable',
    descriptionKey: 'attributes.craftable.description',
    icon: '🔨'
  },
  {
    id: 'valuable',
    nameKey: 'attributes.valuable',
    descriptionKey: 'attributes.valuable.description',
    icon: '💎'
  },
  {
    id: 'magical',
    nameKey: 'attributes.magical',
    descriptionKey: 'attributes.magical.description',
    icon: '✨'
  },
  
  // 单位属性 / Unit attributes
  {
    id: 'combatant',
    nameKey: 'attributes.combatant',
    descriptionKey: 'attributes.combatant.description',
    icon: '⚔️'
  },
  {
    id: 'worker',
    nameKey: 'attributes.worker',
    descriptionKey: 'attributes.worker.description',
    icon: '👷'
  },
  {
    id: 'scholar',
    nameKey: 'attributes.scholar',
    descriptionKey: 'attributes.scholar.description',
    icon: '📚'
  },
  
  // 建筑属性 / Building attributes
  {
    id: 'habitable',
    nameKey: 'attributes.habitable',
    descriptionKey: 'attributes.habitable.description',
    icon: '🏠'
  },
  {
    id: 'productive',
    nameKey: 'attributes.productive',
    descriptionKey: 'attributes.productive.description',
    icon: '🏭'
  },
  
  // 知识属性 / Knowledge attributes
  {
    id: 'ancient',
    nameKey: 'attributes.ancient',
    descriptionKey: 'attributes.ancient.description',
    icon: '📜'
  },
  {
    id: 'forbidden',
    nameKey: 'attributes.forbidden',
    descriptionKey: 'attributes.forbidden.description',
    icon: '👁️'
  }
]

// ========== 方面定义 / Aspect Definitions ==========
// 方面是数值型的，用于高级匹配（类似密教模拟器）
// Aspects are numeric, used for advanced matching (like Cultist Simulator)

/**
 * 方面列表
 * Aspect list
 */
export const aspects: AspectDefinition[] = [
  // 基础方面 / Basic aspects
  {
    id: 'knowledge',
    nameKey: 'aspects.knowledge',
    descriptionKey: 'aspects.knowledge.description',
    icon: '📚'
  },
  {
    id: 'power',
    nameKey: 'aspects.power',
    descriptionKey: 'aspects.power.description',
    icon: '⚡'
  },
  {
    id: 'mystery',
    nameKey: 'aspects.mystery',
    descriptionKey: 'aspects.mystery.description',
    icon: '🔮'
  },
  {
    id: 'passion',
    nameKey: 'aspects.passion',
    descriptionKey: 'aspects.passion.description',
    icon: '❤️'
  },
  
  // 资源方面 / Resource aspects
  {
    id: 'labor',
    nameKey: 'aspects.labor',
    descriptionKey: 'aspects.labor.description',
    icon: '💪'
  },
  {
    id: 'wealth',
    nameKey: 'aspects.wealth',
    descriptionKey: 'aspects.wealth.description',
    icon: '💰'
  },
  
  // 神秘方面 / Mystic aspects
  {
    id: 'lantern',
    nameKey: 'aspects.lantern',
    descriptionKey: 'aspects.lantern.description',
    icon: '🏮'
  },
  {
    id: 'forge',
    nameKey: 'aspects.forge',
    descriptionKey: 'aspects.forge.description',
    icon: '🔥'
  },
  {
    id: 'edge',
    nameKey: 'aspects.edge',
    descriptionKey: 'aspects.edge.description',
    icon: '🗡️'
  },
  {
    id: 'winter',
    nameKey: 'aspects.winter',
    descriptionKey: 'aspects.winter.description',
    icon: '❄️'
  },
  {
    id: 'heart',
    nameKey: 'aspects.heart',
    descriptionKey: 'aspects.heart.description',
    icon: '💗'
  },
  {
    id: 'grail',
    nameKey: 'aspects.grail',
    descriptionKey: 'aspects.grail.description',
    icon: '🍷'
  },
  {
    id: 'moth',
    nameKey: 'aspects.moth',
    descriptionKey: 'aspects.moth.description',
    icon: '🦋'
  },
  {
    id: 'knock',
    nameKey: 'aspects.knock',
    descriptionKey: 'aspects.knock.description',
    icon: '🚪'
  }
]

// ========== 辅助函数 / Helper Functions ==========

/**
 * 根据分类 ID 获取分类定义
 * Get category definition by ID
 */
export function getCategory(id: string): CategoryDefinition | undefined {
  return categories.find(c => c.id === id)
}

/**
 * 根据属性 ID 获取属性定义
 * Get attribute definition by ID
 */
export function getAttribute(id: string): AttributeDefinition | undefined {
  return attributes.find(a => a.id === id)
}

/**
 * 根据方面 ID 获取方面定义
 * Get aspect definition by ID
 */
export function getAspect(id: string): AspectDefinition | undefined {
  return aspects.find(a => a.id === id)
}

/**
 * 获取分类颜色
 * Get category color
 */
export function getCategoryColor(id: string): string {
  return getCategory(id)?.color ?? '#6b7280'
}

/**
 * 获取方面图标
 * Get aspect icon
 */
export function getAspectIcon(id: string): string {
  return getAspect(id)?.icon ?? '❓'
}

// ========== 导出配置 / Export Config ==========

/**
 * 完整的标签系统配置
 * Complete tag system configuration
 */
export const tagSystemConfig: TagSystemConfig = {
  categories,
  attributes,
  aspects
}

export default tagSystemConfig
