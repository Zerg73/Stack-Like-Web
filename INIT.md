# Stack Like - 堆叠大陆游戏

## 项目概述

纯客户端 Web 游戏，使用 TypeScript + Vue 实现类似堆叠大陆和密教模拟器的方块交互玩法。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 (Composition API) |
| 语言 | TypeScript |
| 构建工具 | Vite |
| 状态管理 | Pinia |
| 样式方案 | UnoCSS |
| 存档格式 | JSON |
| MOD存储 | IndexedDB |

## 项目结构

```
src/
├── assets/           # 静态资源
├── components/      # Vue 通用组件
│   ├── game/         # 游戏核心组件
│   └── ui/           # UI 组件
├── composables/      # Vue Composables
├── game/             # 游戏核心逻辑
│   ├── core/         # 核心引擎
│   ├── map/          # 地图系统
│   ├── block/        # 方块系统
│   └── render/       # 渲染系统
├── mod/              # MOD 系统
│   ├── loader/       # MOD 加载器
│   ├── parser/       # 配置解析
│   └── registry/     # MOD 注册表
├── stores/           # Pinia 状态管理
├── types/            # TypeScript 类型定义
├── utils/            # 工具函数
└── views/            # 页面视图
```

## 核心系统

### 1. 渲染系统
- 基于 Vue + CSS Transform 实现 2D 渲染
- 支持 X 轴视角旋转（平滑动画）
- 视口裁剪：只渲染可见区域方块
- 目标帧率：60fps
- 支持缩放适应不同屏幕

### 2. 地图系统
- 固定尺寸地图（初始 1920×1080）
- 支持多地图切换
- 切换方式类似堆叠大陆

### 3. 方块系统
- 方块尺寸：3:4 长条矩形
- 分层结构：
  - 桌面层 (Desktop Layer)
  - 方块层 (Block Layer)
  - 方块详情层 (Detail Layer)
  - 菜单层 (Menu Layer)

### 4. UI 交互
- 点击/拖拽双支持
- 响应式设计：PC + 移动端
- 非模态详情窗口
- 快捷键系统（PC端可配置）

### 5. MOD 系统
- MOD 配置格式：TS + JSON + Vue
- 版本控制和依赖管理
- MOD 管理界面（游戏开始前配置）
- 支持文件夹或 mod.json 导入

### 6. 存档系统
- JSON 格式存档
- 支持导入/导出
- IndexedDB 存储 MOD 数据

## 游戏内容（待实现）

- [ ] 时间系统
- [ ] 季节系统
- [ ] 多种方块类型
- [ ] 随机事件
- [ ] 快捷键配置

## 开发命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 预览构建
npm run preview
```

## 配置说明

### UnoCSS
配置位于 `uno.config.ts`，使用 UnoCSS presetUno 和 WebFonts。

### Pinia Store
- `gameStore` - 游戏状态管理
- `modStore` - MOD 管理
- `mapStore` - 地图状态
- `uiStore` - UI 状态

## 待讨论事项

1. 方块具体类型和属性
2. 时间/季节系统机制
3. MOD 依赖解析规则
4. 存档加密需求
