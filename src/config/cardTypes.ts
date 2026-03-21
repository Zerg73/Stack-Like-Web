export interface CardTypeConfig {
  id: string
  nameKey: string      // i18n key for name
  color: string
  stackable: boolean       // 是否允许堆叠
  stackWith?: string[]     // 可堆叠的其他类型ID（可选）
}

export interface CardItemConfig {
  typeId: string
  nameKey: string      // i18n key for name
  emoji: string
}

export const cardTypes: CardTypeConfig[] = [
  { id: 'material', nameKey: 'cardTypes.material', color: '#8b5cf6', stackable: true },
  { id: 'unit', nameKey: 'cardTypes.unit', color: '#3b82f6', stackable: false },
  { id: 'building', nameKey: 'cardTypes.building', color: '#f59e0b', stackable: false },
]

export const cardItems: CardItemConfig[] = [
  { typeId: 'material', nameKey: 'cardItems.wood', emoji: '🪵' },
  { typeId: 'material', nameKey: 'cardItems.stone', emoji: '🪨' },
  { typeId: 'material', nameKey: 'cardItems.wheat', emoji: '🌾' },
  { typeId: 'material', nameKey: 'cardItems.apple', emoji: '🍎' },
  { typeId: 'material', nameKey: 'cardItems.gem', emoji: '💎' },
  { typeId: 'material', nameKey: 'cardItems.brick', emoji: '🧱' },
  { typeId: 'material', nameKey: 'cardItems.furniture', emoji: '🪑' },
  { typeId: 'material', nameKey: 'cardItems.tree', emoji: '🌲' },
  { typeId: 'unit', nameKey: 'cardItems.farmer', emoji: '👨‍🌾' },
  { typeId: 'unit', nameKey: 'cardItems.swordsman', emoji: '⚔️' },
  { typeId: 'unit', nameKey: 'cardItems.archer', emoji: '🏹' },
  { typeId: 'unit', nameKey: 'cardItems.shieldBearer', emoji: '🛡️' },
  { typeId: 'unit', nameKey: 'cardItems.warhorse', emoji: '🐴' },
  { typeId: 'unit', nameKey: 'cardItems.werewolf', emoji: '🐺' },
  { typeId: 'unit', nameKey: 'cardItems.mage', emoji: '🧙' },
  { typeId: 'unit', nameKey: 'cardItems.princess', emoji: '👸' },
  { typeId: 'building', nameKey: 'cardItems.cottage', emoji: '🏠' },
  { typeId: 'building', nameKey: 'cardItems.castle', emoji: '🏰' },
  { typeId: 'building', nameKey: 'cardItems.church', emoji: '⛪' },
  { typeId: 'building', nameKey: 'cardItems.tower', emoji: '🗼' },
  { typeId: 'building', nameKey: 'cardItems.temple', emoji: '🏛️' },
  { typeId: 'building', nameKey: 'cardItems.barracks', emoji: '⚔️' },
  { typeId: 'building', nameKey: 'cardItems.barn', emoji: '🌾' },
  { typeId: 'building', nameKey: 'cardItems.attic', emoji: '🏯' },
]

export function getCardType(id: string): CardTypeConfig | undefined {
  return cardTypes.find(t => t.id === id)
}

export function getCardColor(typeId: string): string {
  const type = getCardType(typeId)
  return type?.color ?? '#6b7280'
}

export function getItemsByType(typeId: string): CardItemConfig[] {
  return cardItems.filter(item => item.typeId === typeId)
}

export function getRandomCardItem(): CardItemConfig {
  return cardItems[Math.floor(Math.random() * cardItems.length)]
}

// 检查两个卡牌类型是否可以堆叠
export function canStackTypes(typeId1: string, typeId2: string): boolean {
  const type1 = getCardType(typeId1)
  const type2 = getCardType(typeId2)
  
  if (!type1?.stackable || !type2?.stackable) return false
  
  // 同类型可以堆叠
  if (typeId1 === typeId2) return true
  
  // 检查是否在 stackWith 列表中
  if (type1.stackWith?.includes(typeId2)) return true
  if (type2.stackWith?.includes(typeId1)) return true
  
  return false
}
