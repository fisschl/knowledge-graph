import { BitmapText, Container, Graphics, TextStyle } from "pixi.js";
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

export class GraphNode extends Container {
  constructor(options: {
    data: MaybeRefOrGetter<Record<string, any>>;
    disableLabel?: MaybeRefOrGetter<boolean>;
  }) {
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
        const { label } = toValue(options.data);
        const isVisible = label && !toValue(options.disableLabel);
        text.visible = isVisible;
        textBackground.visible = isVisible;
      });
      effect(() => {
        const { label } = toValue(options.data);
        text.text = label;
        text.style = defaultLabelStyle;
        textBackground
          .clear()
          .rect(-text.anchor.x * text.width, -text.height / 2, text.width, text.height)
          .fill({ color: 0xffffff, alpha: 0.7 });
      });
    });
    this.on("destroyed", () => scope.stop());
  }
}
