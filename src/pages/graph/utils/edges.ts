import { schemeObservable10 } from "d3-scale-chromatic";
import { Container, Graphics } from "pixi.js";
import { defaultNodeStyle } from "./nodes";

/** 缺失 type 的边共用的默认颜色 */
const DEFAULT_EDGE_COLOR = 0xc0c4cc;

/**
 * 边配色随数据生成而非写死枚举:收集 type 集合,排序后循环取色板。
 * 排序保证同一类型集合在数据乱序/脱敏重命名后颜色映射保持稳定
 */
const buildTypeColors = (edges: Record<string, any>[]) => {
  const types = new Set<string>();
  for (const edge of edges) if (edge.type) types.add(edge.type);
  const colors = schemeObservable10.map((hex) => Number.parseInt(hex.slice(1), 16));
  const result = new Map<string, number>();
  Array.from(types)
    .sort()
    .forEach((type, index) => {
      result.set(type, colors[index % colors.length]);
    });
  return result;
};

/** 箭头尺寸(长度/半宽),与 12px 节点、1px 细线相称 */
const ARROW_LENGTH = 6;
const ARROW_HALF_WIDTH = 4;

/** 线段终点自 target 圆心回缩一个节点外半径:节点不透明且盖在边上,箭头尖贴圆边才不会被埋掉 */
const EDGE_END_OFFSET = defaultNodeStyle.radius + defaultNodeStyle.strokeWidth / 2;

export class EdgesLayer extends Container {
  edges: Record<string, any>[] = [];
  graphics = new Graphics();
  typeColors?: Map<string, number>;

  constructor() {
    super();
    this.alpha = 0.6;
    this.addChild(this.graphics);
  }

  /**
   * 写入边数据并同步给 linkForce。
   * 调用前 simulation 必须已 nodes():links setter 会立即按当前节点数组解析 source/target 引用
   */
  setEdges(edges: Record<string, any>[]) {
    this.edges = edges;
    this.typeColors = buildTypeColors(edges);
  }

  drawEdges() {
    const { graphics } = this;
    graphics.clear();
    for (const edge of this.edges) {
      // edge.source/target 已被 forceLink 替换为节点数据对象引用,直接读坐标
      const sx = edge.source.x || 0;
      const sy = edge.source.y || 0;
      const tx = edge.target.x || 0;
      const ty = edge.target.y || 0;
      const dx = tx - sx;
      const dy = ty - sy;
      const len = Math.hypot(dx, dy);
      // 不足以探出节点圆周的边(重合/自环)没有方向,整条跳过
      if (len <= EDGE_END_OFFSET) continue;
      const ux = dx / len;
      const uy = dy / len;
      const tipX = tx - ux * EDGE_END_OFFSET;
      const tipY = ty - uy * EDGE_END_OFFSET;
      const color = this.typeColors?.get(edge.type) ?? DEFAULT_EDGE_COLOR;
      graphics.moveTo(sx, sy);
      graphics.lineTo(tipX, tipY);
      graphics.stroke({ color });
      // 箭头三角形:尖贴 target 圆边,两底角沿边的垂直方向展开
      const baseX = tipX - ux * ARROW_LENGTH;
      const baseY = tipY - uy * ARROW_LENGTH;
      const px = -uy * ARROW_HALF_WIDTH;
      const py = ux * ARROW_HALF_WIDTH;
      graphics.moveTo(tipX, tipY);
      graphics.lineTo(baseX + px, baseY + py);
      graphics.lineTo(baseX - px, baseY - py);
      graphics.closePath();
      graphics.fill({ color });
    }
  }
}
