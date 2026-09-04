import { CanvasTextMetrics, Container, Graphics, Text, TextStyle } from "pixi.js";

const defaultLabelStyle = new TextStyle({
  fontFamily: "Noto Sans SC",
  fontSize: 12,
  fill: "#303133",
});

export class TextLabel extends Container {
  text: Text;
  background = new Graphics();
  metrics: CanvasTextMetrics;
  anchor: number;

  constructor(options: { text: string; anchor: number }) {
    super();
    this.text = new Text({ text: options.text, style: defaultLabelStyle });
    this.metrics = CanvasTextMetrics.measureText(options.text, this.text.style);
    this.anchor = options.anchor;
    this.text.anchor.set(options.anchor, 0.5);
    this.addChild(this.background, this.text);
    this.drawBackground();
  }

  drawBackground() {
    this.background
      .clear()
      .rect(
        -this.anchor * this.metrics.width,
        -this.metrics.height / 2,
        this.metrics.width,
        this.metrics.height,
      )
      .fill({ color: 0xffffff, alpha: 0.7 });
  }

  setText(text: string) {
    this.metrics = CanvasTextMetrics.measureText(text, this.text.style);
    this.text.text = text;
    this.drawBackground();
  }
}

export const defaultNodeStyle = {
  fill: 0xeaf1fe,
  stroke: 0x5b8ff9,
  radius: 12,
  strokeWidth: 2,
};

export class Node extends Container {
  data: Record<string, any>;
  circle = new Graphics();
  textLabel: TextLabel;

  constructor(options: { data: Record<string, any> }) {
    super();
    this.data = options.data;
    this.drawCircle();
    this.textLabel = new TextLabel({ text: options.data.label || options.data.id, anchor: 0 });
    this.textLabel.position.set(defaultNodeStyle.radius + 6, 0);
    this.addChild(this.circle, this.textLabel);
    this.eventMode = "static";
  }

  drawCircle() {
    this.circle
      .clear()
      .circle(0, 0, defaultNodeStyle.radius)
      .fill({ color: defaultNodeStyle.fill })
      .stroke({ width: defaultNodeStyle.strokeWidth, color: defaultNodeStyle.stroke });
  }
}
