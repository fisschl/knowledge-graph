import { BitmapText, Container, FederatedPointerEvent, Graphics, TextStyle } from "pixi.js";
import { effect, effectScope } from "vue";

const defaultLabelStyle = new TextStyle({
  fontFamily: "Noto Sans SC",
  fontSize: 12,
  fill: "#303133",
});

export const defaultNodeStyle = {
  fill: 0xeaf1fe,
  stroke: 0x5b8ff9,
  radius: 12,
  strokeWidth: 2,
};

export interface GraphNodeOptions {
  data: Record<string, any>;
  disableLabel?: boolean;
}

export class GraphNode extends Container {
  constructor(public readonly options: GraphNodeOptions) {
    super();
    const circle = new Graphics()
      .circle(0, 0, defaultNodeStyle.radius)
      .fill({ color: defaultNodeStyle.fill })
      .stroke({
        width: defaultNodeStyle.strokeWidth,
        color: defaultNodeStyle.stroke,
      });
    this.addChild(circle);
    this.eventMode = "static";
    const text = new BitmapText();
    text.anchor.set(0, 0.5);
    text.position.set(defaultNodeStyle.radius + 6, 0);
    const textBackground = new Graphics();
    textBackground.position.set(defaultNodeStyle.radius + 6, 0);
    this.addChild(textBackground, text);
    const scope = effectScope();
    scope.run(() => {
      effect(() => {
        const { label } = options.data;
        const isVisible = label && !options.disableLabel;
        text.visible = isVisible;
        textBackground.visible = isVisible;
      });
      effect(() => {
        const { label } = options.data;
        text.text = label;
        text.style = defaultLabelStyle;
        textBackground
          .clear()
          .rect(-text.anchor.x * text.width, -text.height / 2, text.width, text.height)
          .fill({ color: 0xffffff, alpha: 0.7 });
      });
      effect(() => {
        const { x, y } = options.data;
        this.position.set(x || 0, y || 0);
      });
    });
    this.on("pointerdown", (event) => {
      const world = findAncestor(this, "world");
      if (!world) return;
      const local = world.toLocal(event.global);
      const { data } = options;
      const dragOffsetX = (data.x || 0) - (local?.x || 0);
      const dragOffsetY = (data.y || 0) - (local?.y || 0);

      const onDragMove = (event: FederatedPointerEvent) => {
        const local = world.toLocal(event.global);
        if (!local) return;
        data.x = local.x + dragOffsetX;
        data.y = local.y + dragOffsetY;
      };

      const stage = findAncestor(world, "root");
      if (!stage) return;
      const endDrag = () => {
        stage.off("pointermove", onDragMove);
        stage.off("pointerup", endDrag);
        stage.off("pointerleave", endDrag);
      };

      stage.on("pointermove", onDragMove);
      stage.on("pointerup", endDrag);
      stage.on("pointerleave", endDrag);
    });
    this.on("destroyed", () => scope.stop());
  }
}

export function findAncestor(ele: Container, label: string): Container | undefined {
  if (ele.label === label) return ele;
  if (!ele.parent) return undefined;
  return findAncestor(ele.parent, label);
}
