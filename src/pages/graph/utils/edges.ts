import { schemeObservable10 } from "d3-scale-chromatic";
import { Container, Mesh, MeshGeometry } from "pixi.js";
import { defaultNodeStyle } from "./nodes";

/** 缺失 type 的边共用的默认颜色 */
const DEFAULT_EDGE_COLOR = 0xc0c4cc;

/** 箭头尺寸(长度/半宽),与 12px 节点、1px 细线相称 */
const ARROW_LENGTH = 6;
const ARROW_HALF_WIDTH = 4;

/** 线段终点自 target 圆心回缩一个节点外半径:节点不透明且盖在边上,箭头尖贴圆边才不会被埋掉 */
const EDGE_END_OFFSET = defaultNodeStyle.radius + defaultNodeStyle.strokeWidth / 2;

/** 线半宽,等价原 Graphics stroke({ color }) 的默认 width 1 */
const EDGE_HALF_WIDTH = 0.5;

/** 每边顶点数:线段 quad 4 + 箭头三角 3;索引 9 个(quad 两个三角形 + 箭头一个) */
const VERTS_PER_EDGE = 7;

/**
 * 把一条边写进 positions 中它自己的顶点槽(base 由 typeIndex 推导):线段 quad + 箭头三角。
 * 过短/自环边写全零退化顶点,零面积三角形在光栅化阶段被丢弃,等价于不画
 */
const writeEdge = (edge: Record<string, any>, positions: Float32Array) => {
  const base = edge.typeIndex * VERTS_PER_EDGE * 2;
  // edge.source/target 已被 forceLink 替换为节点数据对象引用,直接读坐标
  const sx = edge.source.x || 0;
  const sy = edge.source.y || 0;
  const tx = edge.target.x || 0;
  const ty = edge.target.y || 0;
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.hypot(dx, dy);
  // 不足以探出节点圆周的边(重合/自环)没有方向,整条跳过
  if (len <= EDGE_END_OFFSET) {
    positions.fill(0, base, base + VERTS_PER_EDGE * 2);
    return;
  }
  const ux = dx / len;
  const uy = dy / len;
  const tipX = tx - ux * EDGE_END_OFFSET;
  const tipY = ty - uy * EDGE_END_OFFSET;
  // 线段 quad:沿边方向,垂直展开半宽 EDGE_HALF_WIDTH
  const nx = -uy * EDGE_HALF_WIDTH;
  const ny = ux * EDGE_HALF_WIDTH;
  positions.set(
    [sx + nx, sy + ny, sx - nx, sy - ny, tipX + nx, tipY + ny, tipX - nx, tipY - ny],
    base,
  );
  // 箭头三角形:尖贴 target 圆边,两底角沿边的垂直方向展开
  const baseX = tipX - ux * ARROW_LENGTH;
  const baseY = tipY - uy * ARROW_LENGTH;
  const px = -uy * ARROW_HALF_WIDTH;
  const py = ux * ARROW_HALF_WIDTH;
  positions.set([tipX, tipY, baseX + px, baseY + py, baseX - px, baseY - py], base + 8);
};

export class EdgesLayer extends Container {
  /**
   * 各类型边的集合,键为 type,值为该类型的边数组
   */
  types = new Map<string, Record<string, any>[]>();
  /**
   * 各类型边的颜色映射,键为 type,值为该类型的颜色值
   */
  color = new Map<string, number>();
  /**
   * 各类型边对应的 Mesh 对象,键为 type,值为该类型的 Mesh
   */
  mesh = new Map<string, Mesh>();
  /**
   * 各类型边对应的顶点数据,键为 type,值为该类型的 positions 数组
   */
  positions = new Map<string, Float32Array>();

  /**
   * 邻接表,键为节点 id,值为该节点的邻接边数组,边携带 typeIndex(type 分组内下标)
   */
  adjacency = new Map<string, Record<string, any>[]>();

  constructor() {
    super();
    this.alpha = 0.6;
  }

  /**
   * 将一条边加入邻接表。
   * @param edge 边对象，包含 source 和 target 节点引用
   */
  setAdjacency(edge: Record<string, any>) {
    for (const item of [edge.source, edge.target]) {
      if (!item) continue;
      const nodeId = typeof item === "string" ? item : item.id;
      if (!nodeId) continue;
      const list = this.adjacency.get(nodeId);
      if (list) list.push(edge);
      else this.adjacency.set(nodeId, [edge]);
    }
  }

  /**
   * 写入边数据并同步给 linkForce。
   * 调用前 simulation 必须已 nodes():links setter 会立即按当前节点数组解析 source/target 引用
   */
  setEdges(edges: Record<string, any>[]) {
    const types = new Set<string>();
    for (const edge of edges) if (edge.type) types.add(edge.type);
    const colors = schemeObservable10.map((hex) => Number.parseInt(hex.slice(1), 16));
    Array.from(types)
      .sort()
      .forEach((type, index) => {
        this.color.set(type, colors[index % colors.length]);
      });

    // geometry 持有 GPU 缓冲,Mesh.destroy 不代管,需显式销毁
    for (const mesh of this.mesh.values()) {
      mesh.geometry.destroy();
      mesh.destroy();
    }
    // 换数据时全部重建:残留旧 type 的分组会让新边追加到旧数组后面,画出指向旧节点坐标的幽灵边
    this.types.clear();
    this.color.clear();
    this.mesh.clear();
    this.positions.clear();
    this.adjacency.clear();

    // 将边按类型分组存入 this.types
    for (const edge of edges) {
      const group = this.types.get(edge.type);
      if (group) group.push(edge);
      else this.types.set(edge.type, [edge]);
    }

    for (const list of this.types.values()) {
      list.forEach((edge, index) => {
        // 字段名必须避开 index:d3-force 的 link.initialize 会覆写 link.index 为全局下标
        edge.typeIndex = index;
        this.setAdjacency(edge);
      });
    }

    for (const [type, group] of this.types) {
      // 为每种类型的边创建顶点和索引缓冲区，并生成对应的 Mesh 对象
      const positions = new Float32Array(group.length * VERTS_PER_EDGE * 2);
      const indices = new Uint32Array(group.length * 9);
      for (let i = 0; i < group.length; i++) {
        const v = i * VERTS_PER_EDGE;
        indices.set([v, v + 1, v + 2, v + 2, v + 1, v + 3, v + 4, v + 5, v + 6], i * 9);
      }
      const mesh = new Mesh({ geometry: new MeshGeometry({ positions, indices }) });
      mesh.tint = this.color.get(type) ?? DEFAULT_EDGE_COLOR;
      this.addChild(mesh);
      this.mesh.set(type, mesh);
      this.positions.set(type, positions);
    }
  }

  /** 全量覆写并上传:布局完成后的单次绘制 */
  drawEdges() {
    for (const [type, edges] of this.types) {
      const mesh = this.mesh.get(type);
      const positions = this.positions.get(type);
      if (!mesh || !positions) continue;
      edges.forEach((edge) => writeEdge(edge, positions));
      mesh.geometry.getBuffer("aPosition").update();
    }
  }

  /** 只覆写节点 id 的邻接边并重传所在桶:拖动期的局部绘制 */
  drawEdgesOf(id: string) {
    const edges = this.adjacency.get(id);
    if (!edges) return;
    const touched = new Set<Mesh>();
    for (const edge of edges) {
      const positions = this.positions.get(edge.type);
      const mesh = this.mesh.get(edge.type);
      if (!positions || !mesh) continue;
      writeEdge(edge, positions);
      touched.add(mesh);
    }
    for (const mesh of touched) mesh.geometry.getBuffer("aPosition").update();
  }
}
