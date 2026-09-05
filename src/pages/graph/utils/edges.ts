import { schemeObservable10 } from "d3-scale-chromatic";
import { Container, Mesh, MeshGeometry } from "pixi.js";
import type { EffectScope } from "vue";
import { effect, effectScope, watchEffect } from "vue";
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

/** 每边顶点数:线段矩形 4 + 箭头三角 3;索引 9 个(矩形两个三角形 + 箭头一个) */
const VERTS_PER_EDGE = 7;

export interface EdgesLayerOptions {
  edges: Record<string, any>[];
}

export class EdgesLayer extends Container {
  constructor(public readonly options: EdgesLayerOptions) {
    super();
    this.alpha = 0.6;
    const scope = effectScope();
    const edgesMesh = new Map<string, EdgesTypeMesh>();
    scope.run(() => {
      const groups = computed(() => {
        return Map.groupBy(options.edges, (edge) => edge.type);
      });
      const colors = computed(() => {
        const colorsList = schemeObservable10.map((hex) => Number.parseInt(hex.slice(1), 16));
        const colors = new Map<string, number>();
        Array.from(groups.value.keys()).forEach((type, index) => {
          colors.set(type, colorsList[index % colorsList.length]);
        });
        return colors;
      });
      effect(() => {
        Array.from(edgesMesh.keys())
          .filter((type) => !colors.value.has(type))
          .forEach((type) => {
            const mesh = edgesMesh.get(type)!;
            this.removeChild(mesh);
            mesh.destroy();
            edgesMesh.delete(type);
          });
        for (const [type, group] of groups.value.entries()) {
          const mesh = edgesMesh.get(type);
          const color = colors.value.get(type) ?? DEFAULT_EDGE_COLOR;
          if (mesh) {
            const { options } = mesh;
            options.color = color;
            options.edges = group;
          } else {
            const options = reactive({
              type,
              color: color,
              edges: group,
            });
            const mesh = new EdgesTypeMesh(options);
            edgesMesh.set(type, mesh);
            this.addChild(mesh);
          }
        }
      });
    });
    this.on("destroyed", () => scope.stop());
  }
}

interface GraphEdgeOptions {
  edge: Record<string, any>;
  positions: Float32Array;
  /**
   * 这条边在其所处的类型组中的索引
   */
  index: number;
  update: () => void;
}

export class GraphEdge {
  scope: EffectScope;
  constructor(public readonly options: GraphEdgeOptions) {
    this.scope = effectScope();
    this.scope.run(() => {
      // watchEffect:拖动时源/目标点 x=y 两次写入合并为一次 flush,每条相邻边每次移动只算 1 次
      watchEffect(() => {
        const base = options.index * VERTS_PER_EDGE * 2;
        const { edge, positions } = options;
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
        // 箭头底边:线段矩形只延伸到这里,与三角形共用这条底边拼成一个多边形
        const baseX = tipX - ux * ARROW_LENGTH;
        const baseY = tipY - uy * ARROW_LENGTH;
        // 线段矩形:从源点延伸到箭头底边,沿边方向垂直展开半宽 EDGE_HALF_WIDTH
        const nx = -uy * EDGE_HALF_WIDTH;
        const ny = ux * EDGE_HALF_WIDTH;
        positions.set(
          [sx + nx, sy + ny, sx - nx, sy - ny, baseX + nx, baseY + ny, baseX - nx, baseY - ny],
          base,
        );
        // 箭头三角形:尖贴 target 圆边,两底角沿边的垂直方向展开,与矩形底边相接
        const px = -uy * ARROW_HALF_WIDTH;
        const py = ux * ARROW_HALF_WIDTH;
        positions.set([tipX, tipY, baseX + px, baseY + py, baseX - px, baseY - py], base + 8);
        options.update();
      });
    });
  }
  destroy() {
    this.scope.stop();
  }
}

interface EdgesTypeMeshOptions {
  type: string;
  edges: Record<string, any>[];
  color: number;
}

export class EdgesTypeMesh extends Mesh {
  constructor(public readonly options: EdgesTypeMeshOptions) {
    const geometry = new MeshGeometry({});
    super({ geometry });
    const scope = effectScope();
    /**
     * 存储边实例对象。需要与 edges 数组保持同步。
     */
    const graphEdges: GraphEdge[] = [];
    scope.run(() => {
      const length = computed(() => {
        const { length } = options.edges;
        return length;
      });
      const positions = computed(() => {
        const positions = new Float32Array(length.value * VERTS_PER_EDGE * 2);
        return markRaw(positions);
      });
      const indices = computed(() => {
        const indices = new Uint32Array(length.value * 9);
        for (let i = 0; i < length.value; i++) {
          const v = i * VERTS_PER_EDGE;
          indices.set([v, v + 1, v + 2, v + 2, v + 1, v + 3, v + 4, v + 5, v + 6], i * 9);
        }
        return markRaw(indices);
      });
      effect(() => {
        geometry.positions = positions.value;
        geometry.indices = indices.value;
      });
      effect(() => {
        const { edges } = options;
        if (graphEdges.length > edges.length) {
          const list = graphEdges.splice(edges.length);
          list.forEach((edge) => edge.destroy());
        }
        edges.forEach((edge, index) => {
          const instance = graphEdges[index];
          if (instance) {
            const { options } = instance;
            options.edge = edge;
            options.positions = positions.value;
            options.index = index;
          } else {
            const options = reactive<GraphEdgeOptions>({
              edge,
              positions: positions.value,
              index,
              update: () => this.updateGeometry(),
            });
            graphEdges[index] = new GraphEdge(options);
          }
        });
      });
      effect(() => {
        this.tint = options.color;
      });
    });
    this.on("destroyed", () => {
      scope.stop();
      const { geometry } = this;
      geometry.destroy();
      graphEdges.forEach((item) => item.destroy());
    });
  }

  /** 同一 flush/帧内至多排一次 rAF:首个边触发后其余边直接短路,免去每边一次 cancel+rAF 的调用抖动 */
  fraPending = false;
  updateGeometry() {
    if (this.fraPending) return;
    this.fraPending = true;
    requestAnimationFrame(() => {
      this.fraPending = false;
      // destroy 后(或 destroy 进行中)排到的回调不再触碰已销毁的 geometry
      if (this.destroyed) return;
      const { geometry } = this;
      geometry.getBuffer("aPosition").update();
    });
  }
}
