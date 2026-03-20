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
  name: string
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
  isDragging: boolean
  isPanning: boolean
  isSeparating: boolean        // 是否在分离模式
  startX: number
  startY: number
  startTranslateX: number
  startTranslateY: number
  draggedCardIndex: number     // 被拖拽的卡牌在堆叠中的索引
  sourceStackId: string | null // 源堆叠ID（分离时）
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
  sourceStackId: string
  targetStackId?: string
  newPosition?: { x: number; y: number }
}
