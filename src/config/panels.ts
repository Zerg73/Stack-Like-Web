/**
 * 面板配置文件
 * Panel Configuration File
 * 
 * 定义游戏中的所有面板
 * Defines all panels in the game
 */

import type { PanelDefinition } from '@/game/types/panel'

/**
 * 面板定义列表
 * Panel definitions list
 */
export const panelDefinitions: PanelDefinition[] = [
  {
    id: 'research',
    nameKey: 'panels.research.name',
    descriptionKey: 'panels.research.description',
    icon: '📚',
    slots: [
      {
        id: 'book',
        nameKey: 'panels.research.slots.book',
        type: 'input',
        matchRule: {
          category: 'knowledge',
          requiredAspects: { knowledge: 1 }
        },
        required: true,
        maxCards: 1
      },
      {
        id: 'funds',
        nameKey: 'panels.research.slots.funds',
        type: 'input',
        matchRule: {
          category: 'funds'
        },
        required: false,
        maxCards: 1
      }
    ],
    outputSlot: {
      id: 'output',
      nameKey: 'panels.research.slots.output',
      type: 'output',
      matchRule: {},
      required: false,
      maxCards: 3
    },
    recipes: ['research_basic', 'research_advanced']
  },
  {
    id: 'crafting',
    nameKey: 'panels.crafting.name',
    descriptionKey: 'panels.crafting.description',
    icon: '🔨',
    slots: [
      {
        id: 'worker',
        nameKey: 'panels.crafting.slots.worker',
        type: 'input',
        matchRule: {
          category: 'unit'
        },
        required: true,
        maxCards: 1
      },
      {
        id: 'material',
        nameKey: 'panels.crafting.slots.material',
        type: 'input',
        matchRule: {
          category: 'material'
        },
        required: true,
        maxCards: 1
      }
    ],
    outputSlot: {
      id: 'output',
      nameKey: 'panels.crafting.slots.output',
      type: 'output',
      matchRule: {},
      required: false,
      maxCards: 2
    },
    recipes: ['craft_duplicate']
  },
  {
    id: 'ritual',
    nameKey: 'panels.ritual.name',
    descriptionKey: 'panels.ritual.description',
    icon: '🔮',
    slots: [
      {
        id: 'offering',
        nameKey: 'panels.ritual.slots.offering',
        type: 'input',
        matchRule: {
          requiredAspects: { mystery: 2 }
        },
        required: true,
        maxCards: 3
      },
      {
        id: 'influence',
        nameKey: 'panels.ritual.slots.influence',
        type: 'input',
        matchRule: {
          category: 'influence'
        },
        required: false,
        maxCards: 1
      }
    ],
    outputSlot: {
      id: 'output',
      nameKey: 'panels.ritual.slots.output',
      type: 'output',
      matchRule: {},
      required: false,
      maxCards: 3
    },
    recipes: ['ritual_summon', 'ritual_sacrifice']
  }
]

/**
 * 根据 ID 获取面板定义
 * Get panel definition by ID
 */
export function getPanelDefinition(id: string): PanelDefinition | undefined {
  return panelDefinitions.find(p => p.id === id)
}

export default panelDefinitions
