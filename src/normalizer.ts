import type PptxGenJs from "pptxgenjs";
import d3 from "d3-color";
import {
  PresentationProps,
  SlideProps,
  VisualProps,
  isText,
  isImage,
  isShape,
} from "./nodes";

export type HexColor = string; // 6-Character hex (without prefix hash)
export type ComplexColor = {
  type: "solid";
  color: HexColor;
  alpha: number; // [0, 100]
};
type Position = number | string; // number (inches) or string (`{percentage}%`)

type ObjectBase = {
  style: {
    x: Position;
    y: Position;
    w: Position;
    h: Position;
  };
};

export type InternalText = ObjectBase & {
  kind: "text";
  text: string;
  style: {
    color: HexColor | null;
    fontFace: string;
    fontSize: number; // In points
    align: "left" | "right" | "center";
    verticalAlign: "top" | "bottom" | "middle";
  };
};
export type InternalImage = ObjectBase & {
  kind: "image";
  url: string;
  style: {
    backgroundSize: "contain" | "cover" | null;
  };
};
export type InternalShape = ObjectBase & {
  kind: "shape";
  type: keyof typeof PptxGenJs.ShapeType;
  text: string | null;
  style: {
    backgroundColor: HexColor | ComplexColor;
  };
};

export type InternalSlideObject = InternalText | InternalImage | InternalShape;

export type InternalSlide = {
  objects: InternalSlideObject[];
  backgroundColor?: HexColor;
  hidden: boolean;
};

export type InternalPresentation = {
  slides: InternalSlide[];
  layout: "16x9" | "16x10" | "4x3" | "wide";
};

const normalizeHexColor = (colorString: string): HexColor => {
  const clr = d3.color(colorString);
  if (!clr) {
    throw new TypeError(`Failed to parse '${colorString}' into a color`);
  }

  return clr.formatHex().substring(1).toUpperCase();
};
const normalizeHexOrComplexColor = (colorString: string): HexColor | ComplexColor => {
  const clr = d3.color(colorString);
  if (!clr) {
    throw new TypeError(`Failed to parse '${colorString}' into a color`);
  }

  const hexColor = clr.formatHex().substring(1).toUpperCase();

  if (clr.opacity === 1) {
    return hexColor;
  } else {
    return {
      type: "solid",
      color: hexColor,
      // Alpha is actually transparency (ie. 0=opaque, 1=fully transparent)
      alpha: 100 - Math.round(clr.opacity * 100),
    };
  }
};

const normalizeSlideObject = (
  node: React.ReactElement<VisualProps>
): InternalSlideObject => {
  const { x, y, w, h } = node.props.style;
  if (isText(node)) {
    const style = node.props.style;
    return {
      kind: "text",
      text: node.props.children ?? "",
      style: {
        x,
        y,
        w,
        h,
        color: style.color ? normalizeHexColor(style.color) : null,
        fontFace: style.fontFace ?? "Arial",
        fontSize: style.fontSize ?? 18,
        align: style.align ?? "left",
        verticalAlign: style.verticalAlign ?? "middle",
      },
    };
  } else if (isImage(node)) {
    return {
      kind: "image",
      url: node.props.url,
      style: {
        x,
        y,
        w,
        h,
        backgroundSize: node.props.style.backgroundSize ?? null,
      },
    };
  } else if (isShape(node)) {
    return {
      kind: "shape",
      type: node.props.type,
      text: node.props.children ?? null,
      style: {
        x,
        y,
        w,
        h,
        backgroundColor: normalizeHexOrComplexColor(
          node.props.style.backgroundColor ?? "#FFFFFF"
        ),
      },
    };
  }
};
const normalizeSlide = ({
  props,
}: React.ReactElement<SlideProps>): InternalSlide => {
  const slide = {
    hidden: props.hidden ?? false,
    backgroundColor: props?.style?.backgroundColor
      ? normalizeHexColor(props.style.backgroundColor)
      : null,
    objects: [],
  };
  if (props.children) {
    const arr = Array.isArray(props.children)
      ? props.children
      : [props.children];
    slide.objects = arr.map(normalizeSlideObject);
  }
  return slide;
};
export const normalizeJsx = ({
  props,
}: React.ReactElement<PresentationProps>): InternalPresentation => {
  const pres = {
    layout: props.layout ?? "16x9",
    slides: [],
  };
  if (props.children) {
    const arr = Array.isArray(props.children)
      ? props.children
      : [props.children];
    pres.slides = arr.map(normalizeSlide);
  }
  return pres;
};
