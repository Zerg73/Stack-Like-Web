export interface Position {
  x: number
  y: number
}

export interface CardStack {
  id: string
  cards: GameCard[]
}

export interface GameCard {
  id: string
  typeId: string
  name: string       // 原始名称（用于存档兼容）
  nameKey: string    // i18n key（用于翻译）
  emoji: string
  x: number       // 世界坐标 X（像素）
  y: number       // 世界坐标 Y（像素）
  data: Record<string, unknown>
  stackId: string
}

export interface ViewportState {
  scale: number
  translateX: number
  translateY: number
  rotateX: number
}

export interface SelectionState {
  selectedStacks: string[]
  isMultiSelect: boolean
}

export interface DragState {
  isPanning: boolean
  startX: number
  startY: number
  startTranslateX: number
  startTranslateY: number
}

export interface GameMap {
  id: string
  name: string
  width: number
  height: number
  stacks: CardStack[]
}

// 拖拽放置结果
export interface DropResult {
  type: 'move' | 'merge' | 'separate' | 'none'
  sourceStackId?: string
  targetStackId?: string
  newPosition?: { x: number; y: number }
}
