import type { CardStack, GameCard } from '@/game/types'

/**
 * 事件基类
 * 
 * 所有游戏事件都继承自此类，提供通用的事件元数据
 * 参考 Unity 的事件系统设计
 */
export abstract class GameEvent {
  /** 事件触发时间戳 */
  readonly timestamp: number
  
  /** 事件来源组件（可选） */
  readonly source?: string
  
  /** 是否已被处理（可用于阻止事件冒泡） */
  handled: boolean = false

  constructor(source?: string) {
    this.timestamp = Date.now()
    this.source = source
  }

  /**
   * 标记事件已处理
   * 用于阻止事件继续传播
   */
  stopPropagation(): void {
    this.handled = true
  }
}

// ========== 卡牌事件 ==========

/**
 * 卡牌点击事件
 */
export class CardClickEvent extends GameEvent {
  readonly type = 'cardClick' as const
  
  /** 被点击的卡牌 */
  readonly card: GameCard
  
  /** 卡牌所在的堆叠 */
  readonly stack: CardStack
  
  /** 原始鼠标事件 */
  readonly mouseEvent: MouseEvent

  constructor(card: GameCard, stack: CardStack, mouseEvent: MouseEvent, source?: string) {
    super(source)
    this.card = card
    this.stack = stack
    this.mouseEvent = mouseEvent
  }
}

/**
 * 卡牌长按事件
 */
export class CardLongpressEvent extends GameEvent {
  readonly type = 'cardLongpress' as const
  
  /** 长按的卡牌 */
  readonly card: GameCard
  
  /** 卡牌所在的堆叠 */
  readonly stack: CardStack
  
  /** 原始鼠标事件 */
  readonly mouseEvent: MouseEvent

  constructor(card: GameCard, stack: CardStack, mouseEvent: MouseEvent, source?: string) {
    super(source)
    this.card = card
    this.stack = stack
    this.mouseEvent = mouseEvent
  }
}

/**
 * 卡牌拖拽开始事件
 */
export class CardDragStartEvent extends GameEvent {
  readonly type = 'cardDragStart' as const
  
  /** 被拖拽的卡牌 */
  readonly card: GameCard
  
  /** 卡牌所在的堆叠 */
  readonly stack: CardStack
  
  /** 卡牌在堆叠中的索引（0 是最底层） */
  readonly cardIndex: number
  
  /** 原始鼠标事件 */
  readonly mouseEvent: MouseEvent

  constructor(
    card: GameCard, 
    stack: CardStack, 
    cardIndex: number, 
    mouseEvent: MouseEvent, 
    source?: string
  ) {
    super(source)
    this.card = card
    this.stack = stack
    this.cardIndex = cardIndex
    this.mouseEvent = mouseEvent
  }
}

// ========== 堆叠事件 ==========

/**
 * 堆叠点击事件
 */
export class StackClickEvent extends GameEvent {
  readonly type = 'stackClick' as const
  
  /** 被点击的堆叠 */
  readonly stack: CardStack
  
  /** 原始鼠标事件 */
  readonly mouseEvent: MouseEvent

  constructor(stack: CardStack, mouseEvent: MouseEvent, source?: string) {
    super(source)
    this.stack = stack
    this.mouseEvent = mouseEvent
  }
}

/**
 * 堆叠拖拽开始事件
 * 
 * 当从堆叠中拖拽卡牌时触发，包含分离所需的所有信息
 */
export class StackDragStartEvent extends GameEvent {
  readonly type = 'stackDragStart' as const
  
  /** 被拖拽的堆叠 */
  readonly stack: CardStack
  
  /** 被拖拽的卡牌在堆叠中的索引（0 是最底层） */
  readonly cardIndex: number
  
  /** 原始鼠标事件 */
  readonly mouseEvent: MouseEvent

  constructor(
    stack: CardStack, 
    cardIndex: number, 
    mouseEvent: MouseEvent, 
    source?: string
  ) {
    super(source)
    this.stack = stack
    this.cardIndex = cardIndex
    this.mouseEvent = mouseEvent
  }
}

// ========== 事件类型映射（用于 Vue 组件 defineEmits） ==========

/**
 * Card.vue 组件事件类型
 */
export interface CardComponentEvents {
  click: [event: CardClickEvent]
  dragStart: [event: CardDragStartEvent]
}

/**
 * CardStack.vue 组件事件类型
 */
export interface CardStackComponentEvents {
  click: [event: StackClickEvent]
  dragStart: [event: StackDragStartEvent]
}

/**
 * CardGrid.vue 组件事件类型
 */
export interface CardGridComponentEvents {
  cardClick: [event: CardClickEvent]
  cardLongpress: [event: CardLongpressEvent]
  stackDragStart: [event: StackDragStartEvent]
}

// ========== 事件类型守卫 ==========

/** 检查是否是卡牌点击事件 */
export function isCardClickEvent(event: GameEvent): event is CardClickEvent {
  return event instanceof CardClickEvent
}

/** 检查是否是卡牌长按事件 */
export function isCardLongpressEvent(event: GameEvent): event is CardLongpressEvent {
  return event instanceof CardLongpressEvent
}

/** 检查是否是卡牌拖拽开始事件 */
export function isCardDragStartEvent(event: GameEvent): event is CardDragStartEvent {
  return event instanceof CardDragStartEvent
}

/** 检查是否是堆叠点击事件 */
export function isStackClickEvent(event: GameEvent): event is StackClickEvent {
  return event instanceof StackClickEvent
}

/** 检查是否是堆叠拖拽开始事件 */
export function isStackDragStartEvent(event: GameEvent): event is StackDragStartEvent {
  return event instanceof StackDragStartEvent
}
