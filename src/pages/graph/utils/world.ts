import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import { Application, Container, FederatedPointerEvent, type ApplicationOptions } from "pixi.js";
import { EdgesLayer } from "./edges";
import { ForceLayout } from "./layout";
import { Node } from "./nodes";

/**
 * 将点随机放到以原点为圆心、radius 为半径的圆周上(角度直接随机取,不追求均匀分布)
 */
const placeOnCircle = (point: Record<string, any>, radius: number) => {
  const angle = Math.random() * Math.PI * 2;
  point.x = radius * Math.cos(angle);
  point.y = radius * Math.sin(angle);
};

export class ForceGraph extends Application {
  edgesLayer = new EdgesLayer();
  nodes = new Map<string, Node>();
  world = new Container();
  zoomBehavior?: ZoomBehavior<HTMLCanvasElement, unknown>;
  layout = new ForceLayout();

  constructor() {
    super();
    this.world.addChild(this.edgesLayer);
    this.stage.addChild(this.world);
    this.stage.eventMode = "static";
  }

  async setData(options: { nodes: Record<string, any>[]; edges: Record<string, any>[] }) {
    // 上一份数据的视图还挂在 world 里,先整体移除再重建
    this.world.removeChild(...this.nodes.values());
    this.nodes.clear();

    // 初始播种:随机散布在大圆周上,半径随节点数线性增长(2πR = n·SEED_ARC),不钳制屏幕
    const radius = (options.nodes.length * 100) / (Math.PI * 2);
    for (const data of options.nodes) placeOnCircle(data, radius);

    for (const data of options.nodes) {
      const node = new Node({ data });
      this.nodes.set(data.id, node);
      this.world.addChild(node);
      const { stage, canvas } = this;

      node.on("pointerdown", (event) => {
        // 记录抓取点相对圆心的偏移,按住标签拖动时节点不跳变
        const local = this.world.toLocal(event.global);
        const dragOffsetX = (data.x || 0) - (local?.x || 0);
        const dragOffsetY = (data.y || 0) - (local?.y || 0);

        const onDragMove = (event: FederatedPointerEvent) => {
          const local = this.world.toLocal(event.global);
          if (!local) return;
          data.x = local.x + dragOffsetX;
          data.y = local.y + dragOffsetY;
          node.position.set(data.x, data.y);
          this.edgesLayer.drawEdges();
        };

        const endDrag = () => {
          stage.off("pointermove", onDragMove);
          stage.off("pointerup", endDrag);
          canvas.removeEventListener("pointerleave", endDrag);
        };

        stage.on("pointermove", onDragMove);
        stage.on("pointerup", endDrag);
        canvas.addEventListener("pointerleave", endDrag);
      });
    }

    this.edgesLayer.setEdges(options.edges);
    await this.layout.execute(options);
    for (const node of this.nodes.values()) {
      const { x, y } = node.data;
      node.position.set(x, y);
    }
    this.edgesLayer.drawEdges();
  }

  destroy() {
    this.layout.stop();
    super.destroy();
  }

  async init(options: Partial<ApplicationOptions>) {
    await super.init(options);

    // hitArea 依赖 renderer,init 之后才存在
    this.stage.hitArea = this.renderer.screen;

    const { screen } = this;
    const { position, scale } = this.world;

    this.zoomBehavior = zoom<HTMLCanvasElement, unknown>()
      .filter((event) => {
        // 滚轮/双击等非起拖事件走 d3 默认过滤,缩放行为不变
        if (!["mousedown", "touchstart", "pointerdown"].includes(event.type))
          return (!event.ctrlKey || event.type === "wheel") && !event.button;
        if (event.button) return false;
        const { canvas, stage } = this;
        const { left, top } = canvas.getBoundingClientRect();
        const x = event.clientX - left;
        const y = event.clientY - top;
        const { rootBoundary } = this.renderer.events;
        return rootBoundary.hitTest(x, y) === stage;
      })
      .on("zoom", (event) => {
        const { x, y, k } = event.transform;
        position.set(x, y);
        scale.set(k);
      });

    select(this.canvas).call(this.zoomBehavior);
    // 初始 transform 把模拟原点对齐画布中心,默认螺旋播种围绕中心展开
    select(this.canvas).call(
      this.zoomBehavior.transform,
      zoomIdentity.translate(screen.width / 2, screen.height / 2),
    );
  }
}
