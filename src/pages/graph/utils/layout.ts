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

  setData(options: { nodes: Record<string, any>[]; edges: Record<string, any>[] }) {
    this.simulation.nodes(options.nodes);
    this.linkForce.links(options.edges);
    // 模拟可能已收敛停住,重新加热
    this.simulation?.alpha(1).restart();
  }

  destroy() {
    this.simulation.stop();
  }
}
