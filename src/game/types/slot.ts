/**
 * 槽位系统类型定义
 * Slot System Type Definitions
 * 
 * 定义面板中的槽位，包括匹配规则和槽位实例
 * Defines slots in panels, including match rules and slot instances
 */

import type { GameCard } from './index'
import type { CategoryId, AttributeId, AspectValues } from './tags'

// ========== 槽位匹配规则 / Slot Match Rules ==========

/**
 * 槽位匹配规则
 * Slot match rule
 * 
 * 用于判断卡牌是否可以放入槽位
 * Used to determine if a card can be placed in a slot
 */
export interface SlotMatchRule {
  /**
   * 必须匹配的分类（精确匹配，支持数组表示多选一）
   * Required category (exact match, array means any of)
   * 
   * 示例 / Examples:
   * - category: 'material'  // 只接受材料类
   * - category: ['unit', 'building']  // 接受单位或建筑
   */
  category?: CategoryId | CategoryId[]
  
  /**
   * 必须包含的属性标签（全部满足）
   * Required attributes (all must be present)
   * 
   * 示例 / Example:
   * - requiredAttributes: ['edible', 'craftable']  // 必须同时具有可食用和可制作属性
   */
  requiredAttributes?: AttributeId[]
  
  /**
   * 排除的属性标签（任一存在则拒绝）
   * Excluded attributes (any present will reject)
   * 
   * 示例 / Example:
   * - excludedAttributes: ['flammable']  // 不可燃
   */
  excludedAttributes?: AttributeId[]
  
  /**
   * 必须达到的方面数值（每项都要满足）
   * Required aspect values (each must be satisfied)
   * 
   * 示例 / Example:
   * - requiredAspects: { knowledge: 2, mystery: 1 }  // 知识值 >= 2 且神秘值 >= 1
   */
  requiredAspects?: Partial<AspectValues>
}

// ========== 槽位定义 / Slot Definition ==========

/**
 * 槽位类型
 * Slot type
 */
export type SlotType = 'input' | 'output'

/**
 * 槽位定义
 * Slot definition
 * 
 * 定义槽位的静态配置
 * Defines static configuration of a slot
 */
export interface SlotDefinition {
  /** 槽位 ID / Slot ID */
  id: string
  
  /** 槽位名称 i18n key / Slot name i18n key */
  nameKey: string
  
  /** 槽位描述 i18n key / Slot description i18n key */
  descriptionKey?: string
  
  /** 槽位类型 / Slot type */
  type: SlotType
  
  /** 匹配规则 / Match rule */
  matchRule: SlotMatchRule
  
  /** 是否必须填入 / Is required to fill */
  required: boolean
  
  /** 最大卡牌数量（默认 1）/ Max cards (default 1) */
  maxCards: number
}

// ========== 槽位实例 / Slot Instance ==========

/**
 * 槽位实例
 * Slot instance
 * 
 * 运行时的槽位状态
 * Runtime slot state
 */
export interface SlotInstance {
  /** 槽位定义 ID / Slot definition ID */
  definitionId: string
  
  /** 所属面板实例 ID / Parent panel instance ID */
  panelId: string
  
  /** 当前槽位内的卡牌 / Cards currently in slot */
  cards: GameCard[]
  
  /** 当前卡牌是否有效（满足匹配规则）/ Is current cards valid (satisfies match rule) */
  isValid: boolean
  
  /** 当前累积的方面值（多卡组合时使用）/ Current accumulated aspect values (for multi-card) */
  accumulatedAspects?: AspectValues
}

// ========== 槽位匹配结果 / Slot Match Result ==========

/**
 * 槽位匹配结果
 * Slot match result
 */
export interface SlotMatchResult {
  /** 是否匹配 / Is matched */
  matched: boolean
  
  /** 不匹配的原因 / Reason for not matching */
  reason?: string
  
  /** 匹配的具体检查结果 / Specific check results */
  checks?: {
    category?: boolean
    requiredAttributes?: boolean
    excludedAttributes?: boolean
    requiredAspects?: boolean
  }
}

// ========== 槽位拖拽状态 / Slot Drag State ==========

/**
 * 槽位拖拽状态
 * Slot drag state
 * 
 * 用于跟踪卡牌在槽位间的拖拽
 * Used to track card dragging between slots
 */
export interface SlotDragState {
  /** 是否正在拖拽槽位中的卡牌 / Is dragging card from slot */
  isDraggingFromSlot: boolean
  
  /** 来源面板 ID / Source panel ID */
  sourcePanelId: string | null
  
  /** 来源槽位 ID / Source slot ID */
  sourceSlotId: string | null
  
  /** 被拖拽的卡牌 / Dragged card */
  draggedCard: GameCard | null
  
  /** 目标槽位 ID / Target slot ID */
  targetSlotId: string | null
  
  /** 是否可以放置 / Can drop */
  canDrop: boolean
}

// ========== 导出类型 / Export Types ==========
// 类型已通过 export interface 直接导出
// Types are exported directly via export interface
