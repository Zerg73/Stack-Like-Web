/**
 * 游戏引擎 - 配方管理模块
 * Game Engine - Recipe Management Module
 * 
 * 负责配方的检测、匹配和执行
 * Handles recipe detection, matching and execution
 */

import type { GameCard } from '@/game/types'
import type { RecipeDefinition, RecipeOutput, RecipeExecution, RecipeMatchResult } from '@/game/types/recipe'
import type { PanelInstance, PanelDefinition } from '@/game/types/panel'

/**
 * 卡牌工厂函数类型
 * Card factory function type
 */
export type CardFactory = (output: RecipeOutput) => GameCard

/**
 * 卡牌消耗回调类型
 * Card consume callback type
 */
export type CardConsumeCallback = (cardId: string) => void

/**
 * 配方管理模块
 * Recipe Management Module
 * 
 * 提供配方匹配和执行的核心功能
 * Provides core functionality for recipe matching and execution
 */
export class RecipeModule {
  /** 配方定义映射 / Recipe definition map */
  private _recipes: Map<string, RecipeDefinition> = new Map()
  
  /** 正在执行的配方 / Currently executing recipes */
  private _executions: Map<string, RecipeExecution> = new Map()
  
  /** 卡牌工厂函数 / Card factory function */
  private _cardFactory: CardFactory | null = null
  
  /** 卡牌消耗回调 / Card consume callback */
  private _onCardConsume: CardConsumeCallback | null = null
  
  constructor() {
    // 配方通过 registerRecipes 方法注册
    // Recipes are registered via registerRecipes method
  }
  
  // ========== 配方注册 / Recipe Registration ==========
  
  /**
   * 注册配方
   * Register recipe
   */
  registerRecipe(definition: RecipeDefinition): void {
    this._recipes.set(definition.id, definition)
  }
  
  /**
   * 批量注册配方
   * Register multiple recipes
   */
  registerRecipes(definitions: RecipeDefinition[]): void {
    for (const def of definitions) {
      this.registerRecipe(def)
    }
  }
  
  /**
   * 获取配方定义
   * Get recipe definition
   */
  getRecipe(id: string): RecipeDefinition | undefined {
    return this._recipes.get(id)
  }
  
  /**
   * 设置卡牌工厂
   * Set card factory
   */
  setCardFactory(factory: CardFactory): void {
    this._cardFactory = factory
  }
  
  /**
   * 设置卡牌消耗回调
   * Set card consume callback
   */
  setCardConsumeCallback(callback: CardConsumeCallback): void {
    this._onCardConsume = callback
  }
  
  // ========== 配方匹配 / Recipe Matching ==========
  
  /**
   * 检查面板是否匹配配方
   * Check if panel matches any recipe
   * 
   * @param panel 面板实例 / Panel instance
   * @param panelDef 面板定义 / Panel definition
   * @returns 匹配结果 / Match result
   */
  matchRecipe(panel: PanelInstance, panelDef: PanelDefinition): RecipeMatchResult {
    // 检查面板的每个可用配方
    // Check each available recipe for the panel
    for (const recipeId of panelDef.recipes) {
      const recipe = this._recipes.get(recipeId)
      if (!recipe) continue
      
      const result = this.checkRecipeMatch(panel, recipe)
      if (result.matched) {
        return result
      }
    }
    
    return {
      matched: false,
      reason: 'No matching recipe found'
    }
  }
  
  /**
   * 检查配方是否匹配
   * Check if recipe matches
   */
  private checkRecipeMatch(panel: PanelInstance, recipe: RecipeDefinition): RecipeMatchResult {
    const slotMatches: RecipeMatchResult['slotMatches'] = []
    
    // 检查每个输入槽
    // Check each input slot
    for (const input of recipe.inputs) {
      const slot = panel.slots.find(s => s.definitionId === input.slotId)
      
      if (!slot) {
        slotMatches.push({
          slotId: input.slotId,
          matched: false,
          reason: 'Slot not found'
        })
        continue
      }
      
      // 检查槽位是否有卡牌
      // Check if slot has cards
      if (slot.cards.length === 0) {
        slotMatches.push({
          slotId: input.slotId,
          matched: false,
          reason: 'Slot is empty'
        })
        continue
      }
      
      // 检查额外匹配规则（方面值要求）
      // Check additional match rules (aspect requirements)
      if (input.matchRule?.minAspects) {
        const aspectCheck = this.checkAspectRequirements(slot.cards, input.matchRule.minAspects)
        if (!aspectCheck.passed) {
          slotMatches.push({
            slotId: input.slotId,
            matched: false,
            reason: aspectCheck.reason
          })
          continue
        }
      }
      
      slotMatches.push({
        slotId: input.slotId,
        matched: true
      })
    }
    
    // 所有槽位都匹配才算成功
    // All slots must match for success
    const allMatched = slotMatches.every(sm => sm.matched)
    
    return {
      matched: allMatched,
      recipe: allMatched ? recipe : undefined,
      reason: allMatched ? undefined : 'Some slots do not meet requirements',
      slotMatches
    }
  }
  
  /**
   * 检查方面值要求
   * Check aspect requirements
   */
  private checkAspectRequirements(
    cards: GameCard[],
    minAspects: Record<string, number>
  ): { passed: boolean; reason?: string } {
    // 累加所有卡的方面值
    // Accumulate aspect values from all cards
    const totalAspects: Record<string, number> = {}
    
    for (const card of cards) {
      const cardWithAspects = card as GameCard & { aspects?: Record<string, number> }
      if (cardWithAspects.aspects) {
        for (const [aspect, value] of Object.entries(cardWithAspects.aspects)) {
          totalAspects[aspect] = (totalAspects[aspect] ?? 0) + value
        }
      }
    }
    
    // 检查最小值
    // Check minimum values
    for (const [aspect, min] of Object.entries(minAspects)) {
      if ((totalAspects[aspect] ?? 0) < min) {
        return {
          passed: false,
          reason: `Insufficient ${aspect}: ${totalAspects[aspect] ?? 0}/${min}`
        }
      }
    }
    
    return { passed: true }
  }
  
  // ========== 配方执行 / Recipe Execution ==========
  
  /**
   * 开始执行配方
   * Start executing recipe
   * 
   * @param panel 面板实例 / Panel instance
   * @param recipe 配方定义 / Recipe definition
   * @param startTime 游戏开始时间 / Game start time
   * @returns 执行实例 ID / Execution instance ID
   */
  startExecution(
    panel: PanelInstance,
    recipe: RecipeDefinition,
    startTime: number
  ): string | null {
    // 检查是否已有执行中的配方
    // Check if there's already an executing recipe
    if (panel.executingRecipe && panel.executingRecipe.status === 'running') {
      return null
    }
    
    const executionId = `${panel.id}_${recipe.id}_${Date.now()}`
    
    const execution: RecipeExecution = {
      recipeId: recipe.id,
      panelId: panel.id,
      status: 'running',
      startTime,
      endTime: recipe.duration ? startTime + recipe.duration : startTime,
      progress: 0
    }
    
    this._executions.set(executionId, execution)
    panel.executingRecipe = execution
    
    return executionId
  }
  
  /**
   * 更新执行进度
   * Update execution progress
   * 
   * @param panel 面板实例 / Panel instance
   * @param currentTime 当前游戏时间 / Current game time
   * @returns 是否完成 / Whether completed
   */
  updateExecution(panel: PanelInstance, currentTime: number): boolean {
    const execution = panel.executingRecipe
    if (!execution || execution.status !== 'running') {
      return false
    }
    
    const recipe = this._recipes.get(execution.recipeId)
    if (!recipe) {
      execution.status = 'failed'
      execution.failureReason = 'Recipe not found'
      return false
    }
    
    // 计算进度
    // Calculate progress
    if (recipe.duration && recipe.duration > 0) {
      const elapsed = currentTime - (execution.startTime ?? 0)
      execution.progress = Math.min(1, elapsed / recipe.duration)
      
      // 检查是否完成
      // Check if completed
      if (execution.progress >= 1) {
        return true
      }
    } else {
      // 立即执行
      // Execute immediately
      execution.progress = 1
      return true
    }
    
    return false
  }
  
  /**
   * 完成配方执行
   * Complete recipe execution
   * 
   * @param panel 面板实例 / Panel instance
   * @param recipe 配方定义 / Recipe definition
   * @returns 产出的卡牌列表 / List of produced cards
   */
  completeExecution(panel: PanelInstance, recipe: RecipeDefinition): GameCard[] {
    const execution = panel.executingRecipe
    if (!execution) {
      return []
    }
    
    // 检查随机条件
    // Check random conditions
    if (recipe.conditions) {
      for (const condition of recipe.conditions) {
        if (condition.type === 'random') {
          const chance = condition.value as number
          if (Math.random() > chance) {
            execution.status = 'failed'
            execution.failureReason = 'Random condition failed'
            return []
          }
        }
      }
    }
    
    // 消耗卡牌
    // Consume cards
    for (const input of recipe.inputs) {
      if (input.consume) {
        const slot = panel.slots.find(s => s.definitionId === input.slotId)
        if (slot && slot.cards.length > 0) {
          const card = slot.cards[0]
          if (this._onCardConsume) {
            this._onCardConsume(card.id)
          }
          slot.cards = slot.cards.slice(1)
        }
      }
    }
    
    // 产出卡牌
    // Produce cards
    const producedCards: GameCard[] = []
    
    for (const output of recipe.outputs) {
      // 检查是否需要从槽位复制卡牌
      // Check if need to copy card from slot
      if (output.copyFromSlot) {
        const sourceSlot = panel.slots.find(s => s.definitionId === output.copyFromSlot)
        if (sourceSlot && sourceSlot.cards.length > 0) {
          const copyCount = output.count ?? 1
          for (let i = 0; i < copyCount; i++) {
            // 复制源卡牌
            // Copy source card
            const sourceCard = sourceSlot.cards[0]
            const copiedCard = this.copyCard(sourceCard)
            if (copiedCard) {
              producedCards.push(copiedCard)
            }
          }
        }
      } else if (this._cardFactory) {
        // 使用卡牌工厂创建新卡牌
        // Use card factory to create new card
        const createCount = output.count ?? 1
        for (let i = 0; i < createCount; i++) {
          const card = this._cardFactory(output)
          producedCards.push(card)
        }
      }
    }
    
    // 将产出的卡牌放入输出槽
    // Put produced cards into output slot
    if (panel.outputSlot && producedCards.length > 0) {
      panel.outputSlot.cards.push(...producedCards)
    }
    
    execution.status = 'completed'
    execution.progress = 1
    
    return producedCards
  }
  
  /**
   * 复制卡牌
   * Copy a card
   * 
   * @param sourceCard 源卡牌 / Source card
   * @returns 复制后的卡牌 / Copied card
   */
  private copyCard(sourceCard: GameCard): GameCard | null {
    // 创建卡牌的深拷贝，生成新的 ID
    // Create deep copy of card with new ID
    const copiedCard: GameCard = {
      ...sourceCard,
      id: `${sourceCard.typeId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    return copiedCard
  }
  
  /**
   * 取消执行
   * Cancel execution
   */
  cancelExecution(panel: PanelInstance): void {
    if (panel.executingRecipe) {
      panel.executingRecipe.status = 'failed'
      panel.executingRecipe.failureReason = 'Cancelled by user'
      panel.executingRecipe = undefined
    }
  }
  
  // ========== 辅助方法 / Helper Methods ==========
  
  /**
   * 获取面板可用的配方列表
   * Get available recipes for panel
   */
  getAvailableRecipes(panelDef: PanelDefinition): RecipeDefinition[] {
    return panelDef.recipes
      .map(id => this._recipes.get(id))
      .filter((r): r is RecipeDefinition => r !== undefined)
  }
  
  /**
   * 获取执行中的配方
   * Get executing recipe
   */
  getExecution(panelId: string): RecipeExecution | undefined {
    return this._executions.get(panelId)
  }
  
  /**
   * 清理已完成的执行
   * Clean up completed executions
   */
  cleanupExecutions(): void {
    for (const [id, execution] of this._executions) {
      if (execution.status === 'completed' || execution.status === 'failed') {
        this._executions.delete(id)
      }
    }
  }
}
