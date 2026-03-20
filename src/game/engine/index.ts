/**
 * 游戏引擎模块
 * 
 * 提供统一的游戏引擎 API，业务代码只与引擎层交互
 */

export { GameEngine, STACK_OFFSET } from './GameEngine'
export { CoordinateModule } from './CoordinateModule'
export { StackModule } from './StackModule'
export { DragModule } from './DragModule'

// 导出类型
export type { DragContext } from './DragModule'
