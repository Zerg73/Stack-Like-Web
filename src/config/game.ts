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
  },

  time: {
    /** 固定 tick 间隔（毫秒）/ Fixed tick interval (ms) */
    fixedTickInterval: 20,
    
    /** 游戏日开始时间（小时）/ Game day start hour */
    gameDayStartHour: 4,
    
    /** 每月天数 / Days per month */
    daysPerMonth: 30,
    
    /** 每年月数 / Months per year */
    monthsPerYear: 12,
    
    /** 年计数器重置周期（年）/ Year counter reset cycle (years) */
    yearResetCycle: 100,
    
    /** 速度配置 / Speed configuration */
    speeds: {
      normal: { secondsPerGameMinute: 10, label: '标准', labelEn: 'Normal' },
      fast1: { secondsPerGameMinute: 5, label: '快速', labelEn: 'Fast' },
      fast2: { secondsPerGameMinute: 1, label: '极速', labelEn: 'Turbo' }
    }
  }
} as const

export type GameConfig = typeof gameConfig
