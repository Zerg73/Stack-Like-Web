/**
 * 面板系统类型定义
 * Panel System Type Definitions
 * 
 * 定义面板的配置和运行时状态
 * Defines panel configuration and runtime state
 */

import type { SlotDefinition, SlotInstance } from './slot'
import type { RecipeDefinition, RecipeExecution } from './recipe'

// ========== 面板定义 / Panel Definition ==========

/**
 * 面板定义
 * Panel definition
 * 
 * 定义面板的静态配置
 * Defines static configuration of a panel
 */
export interface PanelDefinition {
  /** 面板唯一标识 / Panel unique ID */
  id: string
  
  /** 面板名称 i18n key / Panel name i18n key */
  nameKey: string
  
  /** 面板描述 i18n key / Panel description i18n key */
  descriptionKey?: string
  
  /** 面板图标 / Panel icon */
  icon?: string
  
  /** 输入槽位定义列表 / Input slot definitions */
  slots: SlotDefinition[]
  
  /** 输出槽位定义（可选）/ Output slot definition (optional) */
  outputSlot?: SlotDefinition
  
  /** 可用配方 ID 列表 / Available recipe IDs */
  recipes: string[]
  
  /** 
   * 面板尺寸（可选）
   * Panel dimensions (optional)
   */
  size?: {
    width: number
    height: number
  }
  
  /** 
   * 是否可以同时打开多个实例
   * Can open multiple instances simultaneously
   */
  allowMultiple?: boolean
  
  /** 
   * 面板类型（用于分类）
   * Panel type (for categorization)
   */
  type?: string
}

// ========== 面板实例 / Panel Instance ==========

/**
 * 面板实例状态
 * Panel instance state
 */
export type PanelState = 
  | 'closed'     // 关闭 / Closed
  | 'opening'    // 打开中 / Opening
  | 'open'       // 打开 / Open
  | 'closing'    // 关闭中 / Closing

/**
 * 面板实例
 * Panel instance
 * 
 * 运行时的面板状态
 * Runtime panel state
 */
export interface PanelInstance {
  /** 实例唯一 ID / Instance unique ID */
  id: string
  
  /** 面板定义 ID / Panel definition ID */
  definitionId: string
  
  /** 输入槽位实例列表 / Input slot instances */
  slots: SlotInstance[]
  
  /** 输出槽位实例 / Output slot instance */
  outputSlot?: SlotInstance
  
  /** 面板状态 / Panel state */
  state: PanelState
  
  /** 面板位置（屏幕坐标）/ Panel position (screen coordinates) */
  position: {
    x: number
    y: number
  }
  
  /** 当前匹配的配方 / Currently matched recipe */
  matchedRecipe?: RecipeDefinition
  
  /** 当前执行的配方 / Currently executing recipe */
  executingRecipe?: RecipeExecution
  
  /** 是否所有必需槽位都已填充 / All required slots filled */
  allRequiredFilled: boolean
  
  /** 是否可以执行配方 / Can execute recipe */
  canExecute: boolean
}

// ========== 面板触发器 / Panel Trigger ==========

/**
 * 面板触发器类型
 * Panel trigger type
 */
export type PanelTriggerType = 
  | 'card'       // 点击卡牌触发 / Triggered by clicking card
  | 'button'     // 点击按钮触发 / Triggered by clicking button
  | 'auto'       // 自动触发 / Auto triggered
  | 'location'   // 到达位置触发 / Triggered by reaching location

/**
 * 面板触发器定义
 * Panel trigger definition
 * 
 * 定义如何打开面板
 * Defines how to open a panel
 */
export interface PanelTriggerDefinition {
  /** 触发器 ID / Trigger ID */
  id: string
  
  /** 触发器类型 / Trigger type */
  type: PanelTriggerType
  
  /** 要打开的面板 ID / Panel ID to open */
  panelId: string
  
  /** 触发器位置（世界坐标）/ Trigger position (world coordinates) */
  position?: {
    x: number
    y: number
  }
  
  /** 触发器图标 / Trigger icon */
  icon?: string
  
  /** 触发器名称 i18n key / Trigger name i18n key */
  nameKey?: string
  
  /** 
   * 触发条件（可选）
   * Trigger conditions (optional)
   */
  conditions?: {
    /** 需要的卡牌类型 / Required card types */
    cardTypes?: string[]
    /** 需要的季节 / Required seasons */
    seasons?: string[]
    /** 其他条件 / Other conditions */
    [key: string]: unknown
  }
}

// ========== 面板管理状态 / Panel Manager State ==========

/**
 * 面板管理器状态
 * Panel manager state
 */
export interface PanelManagerState {
  /** 所有打开的面板实例 / All open panel instances */
  panels: Map<string, PanelInstance>
  
  /** 当前活动面板 ID / Currently active panel ID */
  activePanelId: string | null
  
  /** 面板层级顺序 / Panel z-index order */
  panelOrder: string[]
  
  /** 下一个面板实例 ID / Next panel instance ID */
  nextInstanceId: number
}

// ========== 面板事件 / Panel Events ==========

/**
 * 面板事件类型
 * Panel event type
 */
export type PanelEventType = 
  | 'open'       // 打开 / Open
  | 'close'      // 关闭 / Close
  | 'card_enter' // 卡牌进入槽位 / Card enters slot
  | 'card_leave' // 卡牌离开槽位 / Card leaves slot
  | 'recipe_match'   // 配方匹配 / Recipe matched
  | 'recipe_start'   // 配方开始 / Recipe started
  | 'recipe_complete' // 配方完成 / Recipe completed
  | 'recipe_fail'    // 配方失败 / Recipe failed

/**
 * 面板事件
 * Panel event
 */
export interface PanelEvent {
  /** 事件类型 / Event type */
  type: PanelEventType
  
  /** 面板实例 ID / Panel instance ID */
  panelId: string
  
  /** 槽位 ID（可选）/ Slot ID (optional) */
  slotId?: string
  
  /** 相关卡牌（可选）/ Related card (optional) */
  card?: {
    id: string
    typeId: string
  }
  
  /** 相关配方（可选）/ Related recipe (optional) */
  recipe?: {
    id: string
  }
  
  /** 时间戳 / Timestamp */
  timestamp: number
}

// ========== 导出类型 / Export Types ==========
// 类型已通过 export interface 直接导出
// Types are exported directly via export interface
