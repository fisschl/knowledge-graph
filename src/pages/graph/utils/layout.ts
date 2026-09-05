import { forceCollide, forceManyBody, forceSimulation, forceX, forceY } from "d3-force";
import { forceLink } from "d3-force";

export const forceLayout = (options: {
  nodes: Record<string, any>[];
  edges: Record<string, any>[];
}) => {
  const linkForce = forceLink<any, any>()
    .id((node) => node.id)
    .distance(200);
  const simulation = forceSimulation<Record<string, any>>([])
    .force("link", linkForce)
    .force("charge", forceManyBody().strength(-200))
    .force("collide", forceCollide(40))
    .force("x", forceX(0).strength(0.02))
    .force("y", forceY(0).strength(0.02))
    .alphaDecay(0.03);
  simulation.nodes(options.nodes);
  linkForce.links(options.edges);
  const nextTick = (resolve: () => void) => {
    if (!simulation || simulation.alpha() <= simulation.alphaMin()) return resolve();
    for (let i = 0; i < 10; i++) simulation.tick();
    requestAnimationFrame(() => nextTick(resolve));
  };
  simulation.stop();
  return new Promise<void>((resolve) => nextTick(resolve));
};
