import { forceCollide, forceManyBody, forceSimulation, forceX, forceY } from "d3-force";
import { forceLink } from "d3-force";

export const forceLayout = async (options: {
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
  simulation.stop();
  // 布局在画布/世界创建前完成:每批 tick 后让出事件循环,浏览器可趁机渲染/响应输入,
  // 8ms 比 rAF 帧周期(16.7ms)更短,且不依赖 rAF(后台标签页挂起不会卡死布局)
  while (simulation.alpha() > simulation.alphaMin()) {
    for (let i = 0; i < 10; i++) simulation.tick();
    await new Promise((resolve) => setTimeout(resolve, 8));
  }
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
