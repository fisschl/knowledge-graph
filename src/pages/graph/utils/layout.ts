import {
  forceCollide,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
} from "d3-force";
import { forceLink } from "d3-force";

export class ForceLayout {
  simulation?: Simulation<Record<string, any>, undefined>;

  execute(data: { nodes: Record<string, any>[]; edges: Record<string, any>[] }): Promise<void> {
    this.stop();
    const linkForce = forceLink<any, any>()
      .id((node) => node.id)
      .distance(200);
    this.simulation = forceSimulation<Record<string, any>>([])
      .force("link", linkForce)
      .force("charge", forceManyBody().strength(-200))
      .force("collide", forceCollide(40))
      .force("x", forceX(0).strength(0.02))
      .force("y", forceY(0).strength(0.02))
      .alphaDecay(0.03)
    this.simulation.nodes(data.nodes);
    linkForce.links(data.edges);
    return new Promise<void>((resolve) => {
      // 模拟可能已收敛停住,重新加热;alpha 降到阈值自动停表并触发 end
      this.simulation?.on("end", resolve);
      this.simulation?.alpha(1).restart();
    });
  }

  stop() {
    // 只停表不 resolve:销毁后视图同步不应再执行
    this.simulation?.stop();
  }
}
