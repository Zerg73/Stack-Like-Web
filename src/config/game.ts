export const gameConfig = {
  viewport: {
    // 地图尺寸（也是 ground 区域尺寸）
    // Map size (also ground area size)
    width: 2560,
    height: 1440,
    
    minScale: 0.5,
    maxScale: 2,
    defaultScale: 1
  },

  perspective: {
    maxRotateX: 45,
    animationDuration: 300
  },

  card: {
    width: 80,       // 卡牌宽度 / Card width
    height: 107      // 卡牌高度（3:4比例）/ Card height (3:4 ratio)
  },

  controls: {
    zoomStep: 0.1,
    panSpeed: 1
  },

  minimap: {
    width: 200,
    height: 112,
    padding: 16
  },

  shortcuts: {
    zoomIn: '=',
    zoomOut: '-',
    zoomReset: '0',
    panUp: 'ArrowUp',
    panDown: 'ArrowDown',
    panLeft: 'ArrowLeft',
    panRight: 'ArrowRight',
    rotateView: 'r',
    togglePause: ' '
  }
} as const

export type GameConfig = typeof gameConfig
