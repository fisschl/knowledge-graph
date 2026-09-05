import { select } from "d3-selection";
import { zoom, zoomIdentity } from "d3-zoom";
import { Application, Container } from "pixi.js";
import { effect } from "vue";
import { EdgesLayer } from "./edges";
import { GraphNode } from "./nodes";

/** 缩放低于该阈值时隐藏节点标签,避免缩小后文字过小不可读 */
const LABEL_MIN_SCALE = 0.5;

export interface ForceGraphWorldOptions {
  nodes: Record<string, any>[];
  edges: Record<string, any>[];
  application: Application;
}

export class ForceGraphWorld extends Container {
  constructor(options: ForceGraphWorldOptions) {
    super();
    this.label = "world";
    const transform = reactive({ x: 0, y: 0, k: 1 });
    const translator = zoom<HTMLCanvasElement, unknown>()
      .filter((event) => {
        // 滚轮/双击等非起拖事件走 d3 默认过滤,缩放行为不变
        if (!["mousedown", "touchstart", "pointerdown"].includes(event.type))
          return (!event.ctrlKey || event.type === "wheel") && !event.button;
        if (event.button) return false;
        const { canvas, stage } = options.application;
        const { left, top } = canvas.getBoundingClientRect();
        const x = event.clientX - left;
        const y = event.clientY - top;
        const { rootBoundary } = options.application.renderer.events;
        return rootBoundary.hitTest(x, y) === stage;
      })
      .on("zoom", (event) => {
        const { x, y, k } = event.transform;
        transform.x = x;
        transform.y = y;
        transform.k = k;
      });
    const { canvas, screen } = options.application;
    select(canvas).call(translator);
    select(canvas).call(
      translator.transform,
      zoomIdentity.translate(screen.width / 2, screen.height / 2),
    );

    const nodes = new Map<string, GraphNode>();
    const edgesLayer = new EdgesLayer(
      reactive({
        edges: options.edges,
      }),
    );
    this.addChild(edgesLayer);

    const scope = effectScope();
    scope.run(() => {
      effect(() => {
        const { x, y, k } = transform;
        this.position.set(x, y);
        this.scale.set(k);
      });

      const dataCache = computed(() => {
        const dataCache = new Map<string, Record<string, any>>();
        options.nodes.forEach((node) => dataCache.set(node.id, node));
        return dataCache;
      });

      const disableLabel = computed(() => transform.k < LABEL_MIN_SCALE);

      effect(() => {
        Array.from(nodes.keys())
          .filter((key) => !dataCache.value.has(key))
          .forEach((key) => {
            const instance = nodes.get(key)!;
            this.removeChild(instance);
            instance.destroy({ children: true });
            nodes.delete(key);
          });
        for (const [id, data] of dataCache.value.entries()) {
          const instance = nodes.get(id);
          if (instance) {
            const { options } = instance;
            options.data = data;
          } else {
            const options = reactive({
              data,
              disableLabel,
            });
            const instance = new GraphNode(options);
            nodes.set(id, instance);
            this.addChild(instance);
          }
        }
      });
      effect(() => {
        edgesLayer.options.edges = options.edges;
      });
    });

    this.on("destroyed", () => scope.stop());
  }
}
