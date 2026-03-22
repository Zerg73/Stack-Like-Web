export interface Position {
  x: number
  y: number
}

/** 建筑运行时数据 / Building runtime data */
export interface BuildingRuntimeData {
  type: 'mine' | 'farm' | 'sawmill' | 'panel'  // 建筑类型 / Building type
  productionTimerId?: string        // 生产计时器 ID / Production timer ID
  productionInterval?: number       // 生产间隔（游戏分钟）/ Production interval (game minutes)
  outputTypeId?: string             // 产出卡牌类型ID / Output card type ID
  outputNameKey?: string            // 产出卡牌名称 key / Output card name key
  outputEmoji?: string              // 产出卡牌 emoji / Output card emoji
  panelId?: string                  // 关联的面板 ID / Associated panel ID
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
  buildingData?: BuildingRuntimeData  // 建筑特有数据 / Building specific data
  isAdjusting?: boolean  // 是否正在调整位置（用于动画）/ Is adjusting position (for animation)
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
