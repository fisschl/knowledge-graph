import { BitmapText, Container, Graphics, TextStyle } from "pixi.js";

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
  data: Record<string, any>;
  circle = new Graphics();
  text = new BitmapText();
  textBackground = new Graphics();
  /** 标签是否允许显示(缩放隐藏由外部 setLabelVisible 控制,drawText 需据此推导可见性) */
  labelVisible = true;

  constructor(options: { data: Record<string, any> }) {
    super();
    this.cullable = true;
    this.data = options.data;
    this.addChild(this.circle);
    this.drawCircle();
    this.eventMode = "static";
    this.text.anchor.set(0, 0.5);
    this.text.position.set(defaultNodeStyle.radius + 6, 0);
    this.textBackground.position.set(defaultNodeStyle.radius + 6, 0);
    this.addChild(this.textBackground, this.text);
    this.drawText();
  }

  drawCircle() {
    this.circle
      .clear()
      .circle(0, 0, defaultNodeStyle.radius)
      .fill({ color: defaultNodeStyle.fill })
      .stroke({ width: defaultNodeStyle.strokeWidth, color: defaultNodeStyle.stroke });
  }

  drawText() {
    const { label } = this.data;
    const hasLabel = !!label;
    // 可见性 = 缩放显隐状态 && 确有 label,避免 drawText 覆盖掉缩放隐藏
    this.text.visible = this.labelVisible && hasLabel;
    this.textBackground.visible = this.text.visible;
    this.text.text = label;
    this.text.style = defaultLabelStyle;
    this.textBackground
      .clear()
      .rect(
        -this.text.anchor.x * this.text.width,
        -this.text.height / 2,
        this.text.width,
        this.text.height,
      )
      .fill({ color: 0xffffff, alpha: 0.7 });
  }

  /**
   * 外部(如缩放)控制标签显隐:更新状态并即时应用,隐藏时连文本背景一起
   */
  setLabelVisible(visible: boolean) {
    this.labelVisible = visible;
    const hasLabel = !!this.data.label;
    this.text.visible = visible && hasLabel;
    this.textBackground.visible = this.text.visible;
  }
}
