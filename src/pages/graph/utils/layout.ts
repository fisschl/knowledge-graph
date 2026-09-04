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
  private simulation?: Simulation<any, any>;

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
      .alphaDecay(0.03);
    this.simulation.nodes(data.nodes);
    linkForce.links(data.edges);
    this.simulation.stop();
    return new Promise<void>((resolve) => this.nextTick(resolve));
  }

  private nextTick(resolve: () => void) {
    if (!this.simulation || this.simulation.alpha() <= this.simulation.alphaMin()) return resolve();
    for (let i = 0; i < 10; i++) this.simulation.tick();
    requestAnimationFrame(() => this.nextTick(resolve));
  }

  stop() {
    this.simulation?.stop();
    this.simulation = undefined;
  }
}
