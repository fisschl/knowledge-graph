import { forceCollide, forceManyBody, forceSimulation, forceX, forceY } from "d3-force";
import { forceLink } from "d3-force";

export class ForceLayout {
  simulation = forceSimulation<Record<string, any>>([])
    .force("charge", forceManyBody().strength(-200))
    .force("collide", forceCollide(40))
    .force("x", forceX(0).strength(0.02))
    .force("y", forceY(0).strength(0.02))
    .alphaDecay(0.01);

  linkForce = forceLink<any, any>()
    .id((node) => node.id)
    .distance(200);

  constructor() {
    this.simulation.force("link", this.linkForce);
  }

  /**
   * 启动布局计算,收敛后 promise 落定。
   * nodes() 必须先于 links():links setter 会立即解析 source/target 节点引用
   */
  execute(data: { nodes: Record<string, any>[]; edges: Record<string, any>[] }): Promise<void> {
    this.simulation.nodes(data.nodes);
    this.linkForce.links(data.edges);
    return new Promise<void>((resolve) => {
      // 模拟可能已收敛停住,重新加热;alpha 降到阈值自动停表并触发 end
      this.simulation.on("end", resolve);
      this.simulation.alpha(1).restart();
    });
  }

  destroy() {
    // 只停表不 resolve:销毁后视图同步不应再执行
    this.simulation.stop();
  }
}
