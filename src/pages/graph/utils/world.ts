import { Application, Container, Matrix } from "pixi.js";
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

const deltaZoomWheel = (event: WheelEvent) => {
  const { deltaY, deltaMode, ctrlKey } = event;
  const modeValue = deltaMode === 1 ? 0.05 : deltaMode ? 1 : 0.002;
  return deltaY * modeValue * (ctrlKey ? 10 : 1);
};

export class ForceGraphWorld extends Container {
  constructor(options: ForceGraphWorldOptions) {
    super();
    this.label = "world";
    const { canvas, screen } = options.application;
    // 初始变换:世界居中于画布中心
    const transform = reactive({ x: screen.width / 2, y: screen.height / 2, k: 1 });

    /**
     * 滚轮缩放:以光标为锚。用 Pixi Matrix 的 applyInverse 求光标下的世界坐标,
     * 缩放后把该点重新对齐到光标处(等价 M' = T(p)·S(k1/k)·T(-p)·M)
     */
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const k1 = transform.k * Math.pow(2, -deltaZoomWheel(event));
      const matrix = new Matrix(transform.k, 0, 0, transform.k, transform.x, transform.y);
      // 光标下的世界坐标
      const { x: wx, y: wy } = matrix.applyInverse({ x: px, y: py });
      transform.k = k1;
      transform.x = px - wx * k1;
      transform.y = py - wy * k1;
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const startX = event.clientX;
      const startY = event.clientY;
      // 按下时的基准位移,平移在此之上累加
      const startTransformX = transform.x;
      const startTransformY = transform.y;

      const onPointerMove = (event: PointerEvent) => {
        transform.x = startTransformX + (event.clientX - startX);
        transform.y = startTransformY + (event.clientY - startY);
      };
      addEventListener("pointermove", onPointerMove);
      const onPointerUp = () => {
        removeEventListener("pointermove", onPointerMove);
        removeEventListener("pointerup", onPointerUp);
        removeEventListener("pointercancel", onPointerUp);
      };
      addEventListener("pointerup", onPointerUp);
      addEventListener("pointercancel", onPointerUp);
    };
    canvas.addEventListener("pointerdown", onPointerDown);

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

    this.on("destroyed", () => {
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("pointerdown", onPointerDown);
      scope.stop();
    });
  }
}
