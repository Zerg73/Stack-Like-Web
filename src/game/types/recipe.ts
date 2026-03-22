/**
 * 配方系统类型定义
 * Recipe System Type Definitions
 * 
 * 定义配方的输入、输出和执行条件
 * Defines recipe inputs, outputs and execution conditions
 */

import type { Season } from '../engine/TimeModule'

// ========== 配方输入 / Recipe Input ==========

/**
 * 配方输入定义
 * Recipe input definition
 * 
 * 定义配方对某个槽位的输入要求
 * Defines recipe input requirements for a slot
 */
export interface RecipeInput {
  /** 对应槽位 ID / Corresponding slot ID */
  slotId: string
  
  /** 是否消耗卡牌 / Whether to consume the card */
  consume: boolean
  
  /** 
   * 额外的匹配规则（可选，覆盖槽位默认规则）
   * Additional match rules (optional, overrides slot default rules)
   */
  matchRule?: {
    /** 最小方面值要求 / Minimum aspect values required */
    minAspects?: Record<string, number>
    /** 最大方面值限制 / Maximum aspect values allowed */
    maxAspects?: Record<string, number>
  }
}

// ========== 配方输出 / Recipe Output ==========

/**
 * 配方输出定义
 * Recipe output definition
 * 
 * 定义配方执行后产出的卡牌
 * Defines cards produced after recipe execution
 */
export interface RecipeOutput {
  /** 产出卡牌类型 ID / Output card type ID */
  typeId?: string
  
  /** 产出卡牌名称 i18n key / Output card name i18n key */
  nameKey?: string
  
  /** 产出卡牌 emoji / Output card emoji */
  emoji?: string
  
  /** 产出数量 / Output count */
  count?: number
  
  /** 
   * 输出到哪个槽位（可选，默认输出到面板的输出槽）
   * Which slot to output to (optional, defaults to panel output slot)
   */
  toSlot?: string
  
  /** 
   * 产出卡牌的方面值（可选）
   * Output card aspect values (optional)
   */
  aspects?: Record<string, number>
  
  /** 
   * 从哪个槽位复制卡牌（可选）
   * Copy card from which slot (optional)
   * 
   * 如果设置此字段，将复制该槽位中的卡牌而非创建新卡牌
   * If set, copies card from this slot instead of creating new card
   * typeId/nameKey/emoji 将被忽略
   * typeId/nameKey/emoji will be ignored
   */
  copyFromSlot?: string
}

// ========== 配方条件 / Recipe Condition ==========

/**
 * 配方条件类型
 * Recipe condition type
 */
export type RecipeConditionType = 
  | 'season'      // 季节条件 / Season condition
  | 'time'        // 时间条件 / Time condition
  | 'daytime'     // 白天/夜晚 / Daytime/Nighttime
  | 'resource'    // 资源条件 / Resource condition
  | 'random'      // 随机概率 / Random probability

/**
 * 配方条件定义
 * Recipe condition definition
 */
export interface RecipeCondition {
  /** 条件类型 / Condition type */
  type: RecipeConditionType
  
  /** 条件值 / Condition value */
  value: RecipeConditionValue
  
  /** 条件描述 i18n key / Condition description i18n key */
  descriptionKey?: string
}

/**
 * 配方条件值
 * Recipe condition value
 */
export type RecipeConditionValue = 
  | Season[]           // 季节列表 / Season list (for 'season' type)
  | { min: number; max: number }  // 时间范围 / Time range (for 'time' type)
  | boolean            // 白天/夜晚 / Daytime/Nighttime (for 'daytime' type)
  | { [resourceId: string]: number }  // 资源数量 / Resource amounts (for 'resource' type)
  | number             // 概率 (0-1) / Probability (for 'random' type)

// ========== 配方定义 / Recipe Definition ==========

/**
 * 配方定义
 * Recipe definition
 * 
 * 定义完整的配方配置
 * Defines complete recipe configuration
 */
export interface RecipeDefinition {
  /** 配方 ID / Recipe ID */
  id: string
  
  /** 配方名称 i18n key / Recipe name i18n key */
  nameKey: string
  
  /** 配方描述 i18n key / Recipe description i18n key */
  descriptionKey?: string
  
  /** 配方图标 / Recipe icon */
  icon?: string
  
  /** 输入要求 / Input requirements */
  inputs: RecipeInput[]
  
  /** 输出结果 / Output results */
  outputs: RecipeOutput[]
  
  /** 
   * 执行时间（游戏分钟）
   * Execution duration (game minutes)
   * 
   * 如果为 0 或未定义，则立即执行
   * If 0 or undefined, executes immediately
   */
  duration?: number
  
  /** 额外条件 / Additional conditions */
  conditions?: RecipeCondition[]
  
  /** 
   * 是否自动执行（当条件满足时）
   * Auto execute when conditions are met
   */
  autoExecute?: boolean
}

// ========== 配方执行状态 / Recipe Execution State ==========

/**
 * 配方执行状态
 * Recipe execution state
 */
export type RecipeExecutionStatus = 
  | 'idle'       // 空闲 / Idle
  | 'ready'      // 准备就绪 / Ready to execute
  | 'running'    // 执行中 / Running
  | 'completed'  // 已完成 / Completed
  | 'failed'     // 失败 / Failed

/**
 * 配方执行实例
 * Recipe execution instance
 * 
 * 跟踪配方的执行状态
 * Tracks recipe execution state
 */
export interface RecipeExecution {
  /** 配方 ID / Recipe ID */
  recipeId: string
  
  /** 面板实例 ID / Panel instance ID */
  panelId: string
  
  /** 执行状态 / Execution status */
  status: RecipeExecutionStatus
  
  /** 开始时间（游戏时间戳）/ Start time (game timestamp) */
  startTime?: number
  
  /** 结束时间（游戏时间戳）/ End time (game timestamp) */
  endTime?: number
  
  /** 进度 (0-1) / Progress (0-1) */
  progress: number
  
  /** 失败原因 / Failure reason */
  failureReason?: string
}

// ========== 配方匹配结果 / Recipe Match Result ==========

/**
 * 配方匹配结果
 * Recipe match result
 */
export interface RecipeMatchResult {
  /** 是否匹配 / Is matched */
  matched: boolean
  
  /** 匹配的配方 / Matched recipe */
  recipe?: RecipeDefinition
  
  /** 不匹配的原因 / Reason for not matching */
  reason?: string
  
  /** 各槽位的匹配状态 / Match status for each slot */
  slotMatches?: {
    slotId: string
    matched: boolean
    reason?: string
  }[]
  
  /** 条件匹配状态 / Condition match status */
  conditionMatches?: {
    type: string
    matched: boolean
    reason?: string
  }[]
}

// ========== 导出类型 / Export Types ==========
// 类型已通过 export interface 直接导出
// Types are exported directly via export interface
