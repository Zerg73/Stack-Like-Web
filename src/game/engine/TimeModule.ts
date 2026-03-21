/**
 * 时间模块
 * Time Module
 * 
 * 负责游戏时间的管理，包括日期、季节、倒计时等
 * Manages game time including date, season, and timers
 */

/** 速度模式 / Speed mode */
export const SpeedMode = {
  Normal: 'normal',   // 标准：10秒现实 = 1游戏分钟 / Normal: 10s real = 1 game minute
  Fast1: 'fast1',     // 快速1：5秒现实 = 1游戏分钟 / Fast1: 5s real = 1 game minute
  Fast2: 'fast2'      // 快速2：1秒现实 = 1游戏分钟 / Fast2: 1s real = 1 game minute
} as const

export type SpeedMode = typeof SpeedMode[keyof typeof SpeedMode]

/** 季节 / Season */
export const Season = {
  Spring: 'spring',
  Summer: 'summer',
  Autumn: 'autumn',
  Winter: 'winter'
} as const

export type Season = typeof Season[keyof typeof Season]

/** 游戏日期 / Game date */
export interface GameDate {
  year: number    // 年（从 1 开始）/ Year (starts from 1)
  month: number   // 月（1-12）/ Month (1-12)
  day: number     // 日（1-30）/ Day (1-30)
  hour: number    // 时（0-23）/ Hour (0-23)
  minute: number  // 分（0-59）/ Minute (0-59)
}

/** 卡牌计时器（运行时） / Card timer (runtime) */
export interface GameTimer {
  id: string
  remainingMinutes: number   // 剩余时间（游戏分钟）/ Remaining time (game minutes)
  totalMinutes: number       // 总时长（游戏分钟）/ Total duration (game minutes)
  onComplete: () => void     // 完成回调 / Completion callback
}

/** 卡牌计时器（存档用） / Card timer (for save data) */
export interface GameTimerSaveData {
  cardId: string
  remainingMinutes: number   // 剩余时间（游戏分钟，整数）/ Remaining time (game minutes, integer)
  totalMinutes: number       // 总时长（游戏分钟，整数）/ Total duration (game minutes, integer)
  actionType: string         // 完成时触发的动作类型 / Action type to trigger on completion
}

/** 时间存档数据 / Time save data */
export interface TimeSaveData {
  year: number
  month: number
  day: number
  speedMode: SpeedMode
  isPaused: boolean
  timers: GameTimerSaveData[]
}

/** Tick 回调类型 / Tick callback type */
export type TickCallback = (gameSeconds: number) => void

/** 时间回调类型 / Time callback type */
export type TimeCallback = (date: GameDate) => void

/** 日终回调类型 / Day end callback type */
export type DayEndCallback = (year: number, month: number, day: number) => void

/** 季节变化回调类型 / Season change callback type */
export type SeasonChangeCallback = (season: Season, date: GameDate) => void

/** 季节名称 / Season names */
export const SeasonNames: Record<Season, string> = {
  [Season.Spring]: '春',
  [Season.Summer]: '夏',
  [Season.Autumn]: '秋',
  [Season.Winter]: '冬'
}

/** 根据月份获取季节 / Get season by month */
export function getSeasonByMonth(month: number): Season {
  if (month >= 1 && month <= 3) return Season.Spring
  if (month >= 4 && month <= 6) return Season.Summer
  if (month >= 7 && month <= 9) return Season.Autumn
  return Season.Winter
}

/**
 * 时间模块
 * Time Module
 * 
 * 负责游戏时间的管理，包括日期、季节、倒计时等
 * Manages game time including date, season, and timers
 */
export class TimeModule {
  // ========== 配置 / Configuration ==========
  
  /** 现实多少秒 = 游戏一分钟（根据速度模式变化） */
  /** How many real seconds = 1 game minute (varies by speed mode) */
  private _secondsPerGameMinute: number = 10
  
  get secondsPerGameMinute(): number {
    return this._secondsPerGameMinute
  }
  
  // ========== 状态（整数，避免浮点精度问题）/ State (integers to avoid floating point issues) ==========
  
  /** 是否暂停 / Is paused */
  isPaused: boolean = true
  
  /** 当前速度模式 / Current speed mode */
  speedMode: SpeedMode = SpeedMode.Normal
  
  /** 
   * 游戏总时间（秒，整数）
   * 每年重置一次防止溢出
   * 
   * Total game time (seconds, integer)
   * Reset yearly to prevent overflow
   */
  private _totalGameSeconds: number = 0
  
  // ========== 日期状态 / Date State ==========
  
  /** 当前年（从 1 开始）/ Current year (starts from 1) */
  private _year: number = 1
  
  /** 当前月（1-12）/ Current month (1-12) */
  private _month: number = 1
  
  /** 当前日（1-30）/ Current day (1-30) */
  private _day: number = 1
  
  /** 当前小时（0-23）/ Current hour (0-23) */
  private _hour: number = 4  // 游戏日从 4:00 开始 / Game day starts at 4:00
  
  /** 当前分钟（0-59）/ Current minute (0-59) */
  private _minute: number = 0
  
  /** 当前秒（0-59，用于内部计算，不显示）/ Current second (0-59, internal use, not displayed) */
  private _second: number = 0
  
  // ========== 上一次事件触发状态 / Last event trigger state ==========
  
  private _lastSeason: Season = Season.Spring
  
  // ========== 计算属性 / Computed Properties ==========
  
  get year(): number { return this._year }
  get month(): number { return this._month }
  get day(): number { return this._day }
  get hour(): number { return this._hour }
  get minute(): number { return this._minute }
  get second(): number { return this._second }
  get totalGameSeconds(): number { return this._totalGameSeconds }
  
  /** 当前季节 / Current season */
  get season(): Season {
    return getSeasonByMonth(this._month)
  }
  
  /** 当前季节名称 / Current season name */
  get seasonName(): string {
    return SeasonNames[this.season]
  }
  
  /** 日期字符串（如"第1年1月1日"）/ Date string (e.g. "Year 1 Month 1 Day 1") */
  get dateString(): string {
    return `第${this._year}年${this._month}月${this._day}日`
  }
  
  /** 时间字符串（如"08:30"）/ Time string (e.g. "08:30") */
  get timeString(): string {
    return `${this._hour.toString().padStart(2, '0')}:${this._minute.toString().padStart(2, '0')}`
  }
  
  /** 是否是新的一天（0:00）/ Is new day (0:00) */
  get isNewDay(): boolean {
    return this._hour === 0 && this._minute === 0
  }
  
  /** 是否是游戏日开始（4:00）/ Is game day start (4:00) */
  get isGameDayStart(): boolean {
    return this._hour === 4 && this._minute === 0
  }
  
  // ========== 控制方法 / Control Methods ==========
  
  /**
   * 暂停游戏
   * Pause game
   */
  pause(): void {
    this.isPaused = true
  }
  
  /**
   * 继续游戏
   * Resume game
   */
  resume(): void {
    this.isPaused = false
  }
  
  /**
   * 切换暂停状态
   * Toggle pause state
   */
  togglePause(): void {
    this.isPaused = !this.isPaused
  }
  
  /**
   * 设置速度模式
   * Set speed mode
   */
  setSpeedMode(mode: SpeedMode): void {
    this.speedMode = mode
    if (mode === SpeedMode.Normal) {
      this._secondsPerGameMinute = 10
    } else if (mode === SpeedMode.Fast1) {
      this._secondsPerGameMinute = 5
    } else if (mode === SpeedMode.Fast2) {
      this._secondsPerGameMinute = 1
    }
  }
  
  /**
   * 切换到下一个速度模式
   * Cycle to next speed mode
   */
  cycleSpeedMode(): void {
    const modes: SpeedMode[] = [SpeedMode.Normal, SpeedMode.Fast1, SpeedMode.Fast2]
    const currentIndex = modes.indexOf(this.speedMode)
    const nextIndex = (currentIndex + 1) % modes.length
    this.setSpeedMode(modes[nextIndex])
  }
  
  // ========== 更新方法 / Update Methods ==========
  
  /**
   * 更新游戏时间（由引擎 FixedUpdate 调用）
   * Update game time (called by engine FixedUpdate)
   * 
   * @param gameSecondsDelta 游戏秒数增量（整数）/ Game seconds delta (integer)
   */
  update(gameSecondsDelta: number): void {
    // 使用整数累加，避免浮点精度问题
    // Use integer addition to avoid floating point precision issues
    this._totalGameSeconds += gameSecondsDelta
    
    // 更新秒
    // Update seconds
    this._second += gameSecondsDelta
    
    // 处理秒进位
    // Handle second overflow
    while (this._second >= 60) {
      this._second -= 60
      this._minute++
      
      // 触发分钟事件
      // Emit minute event
      this.emitMinute()
      
      // 处理分钟进位
      // Handle minute overflow
      if (this._minute >= 60) {
        this._minute = 0
        this._hour++
        
        // 触发小时事件
        // Emit hour event
        this.emitHour()
        
        // 处理小时进位
        // Handle hour overflow
        if (this._hour >= 24) {
          this._hour = 0
          this._day++
          
          // 触发日终事件（自动保存）
          // Emit day end event (auto save)
          this.emitDayEnd()
          
          // 处理日进位
          // Handle day overflow
          if (this._day > 30) {
            this._day = 1
            this._month++
            
            // 触发月末事件
            // Emit month end event
            this.emitMonthEnd()
            
            // 处理月进位
            // Handle month overflow
            if (this._month > 12) {
              this._month = 1
              this._year++
              
              // 触发年末事件
              // Emit year end event
              this.emitYearEnd()
              
              // 重置总秒数计数器防止溢出
              // Reset total seconds counter to prevent overflow
              this._totalGameSeconds = 0
            }
          }
        }
      }
    }
    
    // 检查季节变化
    // Check season change
    const currentSeason = this.season
    if (currentSeason !== this._lastSeason) {
      this._lastSeason = currentSeason
      this.emitSeasonChange()
    }
    
    // 更新倒计时
    // Update timers
    this.updateTimers(gameSecondsDelta)
    
    // 触发 tick 事件
    // Emit tick event
    this.emitTick(gameSecondsDelta)
  }
  
  /**
   * 设置日期时间（用于加载存档）
   * Set date time (for loading save data)
   */
  setDateTime(year: number, month: number, day: number, hour: number = 4, minute: number = 0): void {
    this._year = year
    this._month = month
    this._day = day
    this._hour = hour
    this._minute = minute
    this._second = 0
    this._totalGameSeconds = 0
    
    // 更新上次状态
    // Update last state
    this._lastSeason = this.season
  }
  
  /**
   * 重置时间（新游戏）
   * Reset time (new game)
   */
  reset(): void {
    this._year = 1
    this._month = 1
    this._day = 1
    this._hour = 4
    this._minute = 0
    this._second = 0
    this._totalGameSeconds = 0
    this._lastSeason = Season.Spring
    this.isPaused = true
    this.speedMode = SpeedMode.Normal
    this._secondsPerGameMinute = 10
    this.timers.clear()
  }
  
  // ========== 事件系统 / Event System ==========
  
  private tickCallbacks: Set<TickCallback> = new Set()
  private minuteCallbacks: Set<TimeCallback> = new Set()
  private hourCallbacks: Set<TimeCallback> = new Set()
  private dayEndCallbacks: Set<DayEndCallback> = new Set()
  private monthEndCallbacks: Set<TimeCallback> = new Set()
  private yearEndCallbacks: Set<TimeCallback> = new Set()
  private seasonChangeCallbacks: Set<SeasonChangeCallback> = new Set()
  
  /**
   * 订阅 tick 事件
   * Subscribe to tick event
   * @returns 取消订阅函数 / Unsubscribe function
   */
  onTick(callback: TickCallback): () => void {
    this.tickCallbacks.add(callback)
    return () => this.tickCallbacks.delete(callback)
  }
  
  /**
   * 订阅分钟事件
   * Subscribe to minute event
   */
  onMinute(callback: TimeCallback): () => void {
    this.minuteCallbacks.add(callback)
    return () => this.minuteCallbacks.delete(callback)
  }
  
  /**
   * 订阅小时事件
   * Subscribe to hour event
   */
  onHour(callback: TimeCallback): () => void {
    this.hourCallbacks.add(callback)
    return () => this.hourCallbacks.delete(callback)
  }
  
  /**
   * 订阅日终事件
   * Subscribe to day end event
   */
  onDayEnd(callback: DayEndCallback): () => void {
    this.dayEndCallbacks.add(callback)
    return () => this.dayEndCallbacks.delete(callback)
  }
  
  /**
   * 订阅月末事件
   * Subscribe to month end event
   */
  onMonthEnd(callback: TimeCallback): () => void {
    this.monthEndCallbacks.add(callback)
    return () => this.monthEndCallbacks.delete(callback)
  }
  
  /**
   * 订阅年末事件
   * Subscribe to year end event
   */
  onYearEnd(callback: TimeCallback): () => void {
    this.yearEndCallbacks.add(callback)
    return () => this.yearEndCallbacks.delete(callback)
  }
  
  /**
   * 订阅季节变化事件
   * Subscribe to season change event
   */
  onSeasonChange(callback: SeasonChangeCallback): () => void {
    this.seasonChangeCallbacks.add(callback)
    return () => this.seasonChangeCallbacks.delete(callback)
  }
  
  // 事件触发方法 / Event emit methods
  
  private emitTick(gameSeconds: number): void {
    for (const callback of this.tickCallbacks) {
      try {
        callback(gameSeconds)
      } catch (error) {
        console.error('Tick callback error:', error)
      }
    }
  }
  
  private emitMinute(): void {
    for (const callback of this.minuteCallbacks) {
      try {
        callback(this.getDate())
      } catch (error) {
        console.error('Minute callback error:', error)
      }
    }
  }
  
  private emitHour(): void {
    for (const callback of this.hourCallbacks) {
      try {
        callback(this.getDate())
      } catch (error) {
        console.error('Hour callback error:', error)
      }
    }
  }
  
  private emitDayEnd(): void {
    for (const callback of this.dayEndCallbacks) {
      try {
        callback(this._year, this._month, this._day)
      } catch (error) {
        console.error('Day end callback error:', error)
      }
    }
  }
  
  private emitMonthEnd(): void {
    for (const callback of this.monthEndCallbacks) {
      try {
        callback(this.getDate())
      } catch (error) {
        console.error('Month end callback error:', error)
      }
    }
  }
  
  private emitYearEnd(): void {
    for (const callback of this.yearEndCallbacks) {
      try {
        callback(this.getDate())
      } catch (error) {
        console.error('Year end callback error:', error)
      }
    }
  }
  
  private emitSeasonChange(): void {
    for (const callback of this.seasonChangeCallbacks) {
      try {
        callback(this.season, this.getDate())
      } catch (error) {
        console.error('Season change callback error:', error)
      }
    }
  }
  
  /**
   * 获取当前日期对象
   * Get current date object
   */
  getDate(): GameDate {
    return {
      year: this._year,
      month: this._month,
      day: this._day,
      hour: this._hour,
      minute: this._minute
    }
  }
  
  // ========== 卡牌倒计时 / Card Timers ==========
  
  private timers: Map<string, GameTimer> = new Map()
  
  /**
   * 启动倒计时
   * Start timer
   * 
   * @param id 计时器 ID（通常是卡牌 ID）/ Timer ID (usually card ID)
   * @param durationMinutes 持续时间（游戏分钟，整数）/ Duration (game minutes, integer)
   * @param onComplete 完成回调 / Completion callback
   */
  startTimer(id: string, durationMinutes: number, onComplete: () => void): void {
    this.timers.set(id, {
      id,
      remainingMinutes: Math.floor(durationMinutes),  // 确保整数 / Ensure integer
      totalMinutes: Math.floor(durationMinutes),
      onComplete
    })
  }
  
  /**
   * 取消倒计时
   * Cancel timer
   */
  cancelTimer(id: string): void {
    this.timers.delete(id)
  }
  
  /**
   * 获取倒计时信息
   * Get timer info
   */
  getTimer(id: string): GameTimer | undefined {
    return this.timers.get(id)
  }
  
  /**
   * 获取倒计时进度
   * Get timer progress
   * @returns 0-1 的进度值 / Progress value 0-1
   */
  getTimerProgress(id: string): number {
    const timer = this.timers.get(id)
    if (!timer) return 0
    return 1 - (timer.remainingMinutes / timer.totalMinutes)
  }
  
  /**
   * 获取所有活跃计时器（用于存档）
   * Get all active timers (for save data)
   */
  getAllTimers(): GameTimerSaveData[] {
    const result: GameTimerSaveData[] = []
    for (const [id, timer] of this.timers) {
      result.push({
        cardId: id,
        remainingMinutes: Math.floor(timer.remainingMinutes),
        totalMinutes: timer.totalMinutes,
        actionType: 'unknown'  // 需要外部设置 / Needs external setting
      })
    }
    return result
  }
  
  /**
   * 恢复计时器（用于加载存档）
   * Restore timers (for loading save data)
   */
  restoreTimers(timers: GameTimerSaveData[], getCallback: (actionType: string) => (() => void) | null): void {
    for (const timer of timers) {
      const callback = getCallback(timer.actionType)
      if (callback && timer.remainingMinutes > 0) {
        this.startTimer(timer.cardId, timer.remainingMinutes, callback)
      }
    }
  }
  
  /**
   * 更新所有倒计时
   * Update all timers
   */
  private updateTimers(gameSecondsDelta: number): void {
    const gameMinutesDelta = Math.floor(gameSecondsDelta / 60)
    const remainingSeconds = gameSecondsDelta % 60
    
    // 如果不足一分钟，累积秒数
    // If less than a minute, accumulate seconds
    if (gameMinutesDelta === 0 && remainingSeconds > 0) {
      // 使用浮点数累积，但在比较时使用阈值
      // Use floating point accumulation, but use threshold for comparison
      for (const timer of this.timers.values()) {
        timer.remainingMinutes -= remainingSeconds / 60
      }
    } else {
      // 整数分钟更新
      // Integer minute update
      for (const timer of this.timers.values()) {
        timer.remainingMinutes -= gameMinutesDelta
      }
    }
    
    // 收集完成的计时器
    // Collect completed timers
    const completed: string[] = []
    for (const [id, timer] of this.timers) {
      if (timer.remainingMinutes <= 0) {
        completed.push(id)
      }
    }
    
    // 触发完成的计时器
    // Trigger completed timers
    for (const id of completed) {
      const timer = this.timers.get(id)
      if (timer) {
        this.timers.delete(id)
        try {
          timer.onComplete()
        } catch (error) {
          console.error(`Timer callback error for ${id}:`, error)
        }
      }
    }
  }
  
  // ========== 存档相关 / Save/Load ==========
  
  /**
   * 获取存档数据
   * Get save data
   */
  getSaveData(): TimeSaveData {
    return {
      year: this._year,
      month: this._month,
      day: this._day,
      speedMode: this.speedMode,
      isPaused: this.isPaused,
      timers: this.getAllTimers()
    }
  }
  
  /**
   * 加载存档数据
   * Load save data
   */
  loadSaveData(data: TimeSaveData, getCallback: (actionType: string) => (() => void) | null): void {
    this.setDateTime(data.year, data.month, data.day)
    this.setSpeedMode(data.speedMode)
    this.isPaused = data.isPaused
    
    if (data.timers && getCallback) {
      this.restoreTimers(data.timers, getCallback)
    }
  }
}
