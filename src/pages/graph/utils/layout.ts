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
    if (simulation.alpha() <= simulation.alphaMin()) return resolve();
    for (let i = 0; i < 10; i++) simulation.tick();
    // 布局在画布/世界创建前完成,期间无渲染可等:改用微任务分批替代 rAF 帧等待,
    // 免去每帧 ~16.7ms 的帧周期(真机),并避免后台标签页 rAF 挂起导致布局永不结束
    queueMicrotask(() => nextTick(resolve));
  };
  simulation.stop();
  return new Promise<void>((resolve) => nextTick(resolve));
};

/**
 * 初始播种:随机散布在大圆周上,半径随节点数线性增长(2πR = n·SEED_ARC),不钳制屏幕。
 * 将点随机放到以原点为圆心、radius 为半径的圆周上(角度直接随机取,不追求均匀分布)
 */
export const initialSowing = (nodes: Record<string, any>[]) => {
  const radius = (nodes.length * 100) / (Math.PI * 2);
  for (const data of nodes) {
    const angle = Math.random() * Math.PI * 2;
    data.x = radius * Math.cos(angle);
    data.y = radius * Math.sin(angle);
  }
};
