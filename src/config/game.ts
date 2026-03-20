export const gameConfig = {
  viewport: {
    width: 2560,
    height: 1440,
    minScale: 0.5,
    maxScale: 2,
    defaultScale: 1,
    boundaryMargin: 200
  },

  perspective: {
    maxRotateX: 45,
    animationDuration: 300
  },

  grid: {
    originX: 0,
    originY: 0,
    cellWidth: 80,
    cellHeight: 107
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