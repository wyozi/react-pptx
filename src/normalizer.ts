import type PptxGenJs from "pptxgenjs";
import Color from "color";
import { flattenChildren } from "./util";
import {
  PresentationProps,
  SlideProps,
  VisualProps,
  isText,
  isImage,
  isShape,
  TextChild,
} from "./nodes";
import React from "react";

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
  const clr = Color(colorString);
  if (!clr) {
    throw new TypeError(`Failed to parse '${colorString}' into a color`);
  }

  return clr.hex().substring(1).toUpperCase();
};
const normalizeHexOrComplexColor = (
  colorString: string
): HexColor | ComplexColor => {
  const clr = Color(colorString);
  if (!clr) {
    throw new TypeError(`Failed to parse '${colorString}' into a color`);
  }

  const hexColor = clr.hex().substring(1).toUpperCase();

  if (clr.alpha() === 1) {
    return hexColor;
  } else {
    return {
      type: "solid",
      color: hexColor,
      // Alpha is actually transparency (ie. 0=opaque, 1=fully transparent)
      alpha: 100 - Math.round(clr.alpha() * 100),
    };
  }
};

const normalizeText = (t: TextChild): string => {
  if (Array.isArray(t)) {
    return t.map(normalizeText).join("");
  } else if (typeof t === "number") {
    return t.toString();
  } else if (typeof t === "string") {
    return t;
  } else {
    throw new TypeError(
      "Invalid TextChild found; only strings/numbers/arrays of them are accepted"
    );
  }
};

const PERCENTAGE_REGEXP = /^\d+%$/;
const normalizeCoordinate = (
  x: string | number | null,
  _default: number
): string | number => {
  if (typeof x === "string") {
    if (!PERCENTAGE_REGEXP.test(x)) {
      throw new TypeError(
        `"${x}" is invalid position; string positions must be of format '[0-9]+%'`
      );
    }
    return x;
  } else if (typeof x === "number") {
    return x;
  }
  return _default;
};

const normalizeSlideObject = (
  node: React.ReactElement<VisualProps>
): InternalSlideObject | null => {
  if (!node.props.style) {
    throw new TypeError(`A ${node.type} object is missing style attribute`);
  }

  let { x, y, w, h } = node.props.style;
  x = normalizeCoordinate(x, 0);
  y = normalizeCoordinate(y, 0);
  w = normalizeCoordinate(w, 1);
  h = normalizeCoordinate(h, 1);

  if (isText(node)) {
    const style = node.props.style;
    return {
      kind: "text",
      text:
        node.props.children !== undefined
          ? normalizeText(node.props.children)
          : "",
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
      text:
        node.props.children !== undefined
          ? normalizeText(node.props.children)
          : "",
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
  } else {
    throw new Error("unknown slide object");
  }
};

const isPresent = <T>(x: T | null): x is T => {
  return x !== null;
};
const normalizeSlide = ({
  props,
}: React.ReactElement<SlideProps>): InternalSlide => {
  const slide: InternalSlide = {
    hidden: props.hidden ?? false,
    backgroundColor: props?.style?.backgroundColor
      ? normalizeHexColor(props.style.backgroundColor)
      : undefined,
    objects: [],
  };
  if (props.children) {
    slide.objects = flattenChildren(props.children)
      .map(normalizeSlideObject)
      .filter(isPresent);
  }
  return slide;
};
export const normalizeJsx = ({
  props,
}: React.ReactElement<PresentationProps>): InternalPresentation => {
  const pres: InternalPresentation = {
    layout: props.layout ?? "16x9",
    slides: [],
  };
  if (props.children) {
    pres.slides = flattenChildren(props.children).map(normalizeSlide);
  }
  return pres;
};
