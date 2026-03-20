export interface CardTypeConfig {
  id: string
  name: string
  color: string
  stackable: boolean       // 是否允许堆叠
  stackWith?: string[]     // 可堆叠的其他类型ID（可选）
}

export interface CardItemConfig {
  typeId: string
  name: string
  emoji: string
}

export const cardTypes: CardTypeConfig[] = [
  { id: 'material', name: '素材', color: '#8b5cf6', stackable: true },
  { id: 'unit', name: '单位', color: '#3b82f6', stackable: false },
  { id: 'building', name: '建筑', color: '#f59e0b', stackable: false },
]

export const cardItems: CardItemConfig[] = [
  { typeId: 'material', name: '木材', emoji: '🪵' },
  { typeId: 'material', name: '石材', emoji: '🪨' },
  { typeId: 'material', name: '小麦', emoji: '🌾' },
  { typeId: 'material', name: '苹果', emoji: '🍎' },
  { typeId: 'material', name: '宝石', emoji: '💎' },
  { typeId: 'material', name: '砖块', emoji: '🧱' },
  { typeId: 'material', name: '家具', emoji: '🪑' },
  { typeId: 'material', name: '树木', emoji: '🌲' },
  { typeId: 'unit', name: '农民', emoji: '👨‍🌾' },
  { typeId: 'unit', name: '剑士', emoji: '⚔️' },
  { typeId: 'unit', name: '弓兵', emoji: '🏹' },
  { typeId: 'unit', name: '盾牌兵', emoji: '🛡️' },
  { typeId: 'unit', name: '战马', emoji: '🐴' },
  { typeId: 'unit', name: '狼人', emoji: '🐺' },
  { typeId: 'unit', name: '法师', emoji: '🧙' },
  { typeId: 'unit', name: '公主', emoji: '👸' },
  { typeId: 'building', name: '小屋', emoji: '🏠' },
  { typeId: 'building', name: '城堡', emoji: '🏰' },
  { typeId: 'building', name: '教堂', emoji: '⛪' },
  { typeId: 'building', name: '塔楼', emoji: '🗼' },
  { typeId: 'building', name: '神庙', emoji: '🏛️' },
  { typeId: 'building', name: '兵营', emoji: '⚔️' },
  { typeId: 'building', name: '谷仓', emoji: '🌾' },
  { typeId: 'building', name: '阁楼', emoji: '🏯' },
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
