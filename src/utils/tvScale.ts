/**
 * TV 界面响应式缩放工具
 * 以 1920×1080 为基准，按实际屏幕比例换算尺寸
 * 只在横屏 TV 环境下使用，初始化一次即可
 */
import { windowSizeTools } from './windowSizeTools'

const BASE_W = 1920
const BASE_H = 1080

const getScale = () => {
  const { width, height } = windowSizeTools.getSize()
  const w = width  > 0 ? width  : BASE_W
  const h = height > 0 ? height : BASE_H
  return { scaleW: w / BASE_W, scaleH: h / BASE_H }
}

/** 水平方向缩放：间距、左右 padding、宽度 */
export const sw = (n: number): number => {
  const { scaleW } = getScale()
  return Math.round(n * scaleW)
}

/** 垂直方向缩放：高度、上下 padding */
export const sh = (n: number): number => {
  const { scaleH } = getScale()
  return Math.round(n * scaleH)
}

/** 字体缩放：取宽高缩放的较小值，避免字体过大撑破布局 */
export const sf = (n: number): number => {
  const { scaleW, scaleH } = getScale()
  return Math.round(n * Math.min(scaleW, scaleH))
}

/** 圆角缩放：跟随宽度方向 */
export const sr = (n: number): number => sw(n)
