/**
 * 标签系统类型定义
 * Tag System Type Definitions
 * 
 * 用于槽位匹配的标签系统，包含三种标签类型：
 * Tag system for slot matching, containing three tag types:
 * - 分类标签（Category）：单选互斥
 * - 属性标签（Attribute）：多选可叠加
 * - 方面数值（Aspect）：数值条件
 */

// ========== 分类标签 / Category Tags ==========

/**
 * 分类标签定义
 * Category tag definition
 */
export interface CategoryDefinition {
  /** 分类 ID / Category ID */
  id: string
  /** 分类名称 i18n key / Category name i18n key */
  nameKey: string
  /** 分类颜色 / Category color */
  color: string
  /** 分类描述 i18n key / Category description i18n key */
  descriptionKey?: string
}

/**
 * 分类标签类型
 * Category tag types
 */
export type CategoryId = string

// ========== 属性标签 / Attribute Tags ==========

/**
 * 属性标签定义
 * Attribute tag definition
 */
export interface AttributeDefinition {
  /** 属性 ID / Attribute ID */
  id: string
  /** 属性名称 i18n key / Attribute name i18n key */
  nameKey: string
  /** 属性描述 i18n key / Attribute description i18n key */
  descriptionKey?: string
  /** 属性图标 / Attribute icon */
  icon?: string
}

/**
 * 属性标签类型
 * Attribute tag types
 */
export type AttributeId = string

// ========== 方面数值 / Aspect Values ==========

/**
 * 方面定义
 * Aspect definition
 */
export interface AspectDefinition {
  /** 方面 ID / Aspect ID */
  id: string
  /** 方面名称 i18n key / Aspect name i18n key */
  nameKey: string
  /** 方面描述 i18n key / Aspect description i18n key */
  descriptionKey?: string
  /** 方面图标 / Aspect icon */
  icon?: string
}

/**
 * 方面数值类型
 * Aspect value types
 */
export type AspectId = string

/**
 * 方面数值映射
 * Aspect value map
 * 
 * 用于存储卡牌的方面数值
 * Used to store aspect values of a card
 */
export type AspectValues = Record<AspectId, number>

// ========== 标签配置接口 / Tag Config Interfaces ==========

/**
 * 标签系统配置
 * Tag system configuration
 */
export interface TagSystemConfig {
  /** 分类标签定义列表 / Category definitions */
  categories: CategoryDefinition[]
  /** 属性标签定义列表 / Attribute definitions */
  attributes: AttributeDefinition[]
  /** 方面定义列表 / Aspect definitions */
  aspects: AspectDefinition[]
}

// ========== 卡牌标签扩展 / Card Tag Extension ==========

/**
 * 卡牌标签数据
 * Card tag data
 * 
 * 扩展 GameCard 时添加的标签字段
 * Tag fields to add when extending GameCard
 */
export interface CardTags {
  /** 分类标签（单选，互斥）/ Category tag (single, exclusive) */
  category: CategoryId
  
  /** 属性标签（多选，可叠加）/ Attribute tags (multiple, stackable) */
  attributes: AttributeId[]
  
  /** 方面数值（可选，用于高级匹配）/ Aspect values (optional, for advanced matching) */
  aspects?: AspectValues
}

// ========== 导出类型 / Export Types ==========
// 类型已通过 export interface 直接导出
// Types are exported directly via export interface
