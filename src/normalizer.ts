import type PptxGenJs from "pptxgenjs";
import Color from "color";
import { flattenChildren, isReactElementOrElementArray } from "./util";
import {
  PresentationProps,
  SlideProps,
  VisualProps,
  isText,
  isImage,
  isShape,
  TextChild,
  TextLinkProps,
} from "./nodes";
import React, { ReactElement } from "react";

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

export type InternalTextPart = {
  text: string;
  link?: { tooltip?: string } & (
    | {
        url: string;
      }
    | {
        slide: number;
      }
  );
};
export type InternalText = ObjectBase & {
  kind: "text";
  text: InternalTextPart[];
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
    sizing: {
      fit: "contain" | "cover" | "crop";
      imageWidth?: number;
      imageHeight?: number;
    } | null;
  };
};
export type InternalShape = ObjectBase & {
  kind: "shape";
  type: keyof typeof PptxGenJs.ShapeType;
  text: InternalTextPart[] | null;
  style: {
    backgroundColor: HexColor | ComplexColor | null;
    borderColor: HexColor | null;
    borderWidth: number | null;
  };
};

export type InternalSlideObject = InternalText | InternalImage | InternalShape;

export type InternalSlide = {
  objects: InternalSlideObject[];
  backgroundColor: HexColor | null;
  backgroundImage: string | null;
  hidden: boolean;
};

export type InternalPresentation = {
  slides: InternalSlide[];
  layout: "16x9" | "16x10" | "4x3" | "wide";
};

export const normalizeHexColor = (colorString: string): HexColor => {
  return Color(colorString).hex().substring(1).toUpperCase();
};
export const normalizeHexOrComplexColor = (
  colorString: string
): HexColor | ComplexColor => {
  const clr = Color(colorString);

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

export const normalizeText = (t: TextChild): InternalTextPart[] => {
  if (isReactElementOrElementArray(t)) {
    return flattenChildren(t).map(
      (el: string | number | ReactElement<TextLinkProps>) => {
        if (React.isValidElement(el)) {
          const { props } = el;
          let link;
          if ((props as any).url) {
            link = { url: (props as any).url, tooltip: props.tooltip };
          } else if ((props as any).slide) {
            link = { slide: (props as any).slide, tooltip: props.tooltip };
          }
          return {
            text: props.children,
            link: link,
          };
        } else {
          return {
            text: el.toString(),
          };
        }
      }
    );
  } else if (Array.isArray(t)) {
    return t.reduce(
      (prev: InternalTextPart[], cur) => prev.concat(normalizeText(cur)),
      [] as InternalTextPart[]
    );
  } else if (typeof t === "number") {
    return [{ text: t.toString() }];
  } else if (typeof t === "string") {
    return [{ text: t }];
  } else {
    throw new TypeError(
      "Invalid TextChild found; only strings/numbers/arrays of them are accepted"
    );
  }
};

const PERCENTAGE_REGEXP = /^\d+%$/;
export const normalizeCoordinate = (
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
          : [],
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
        sizing: node.props.style.sizing ?? null,
      },
    };
  } else if (isShape(node)) {
    return {
      kind: "shape",
      type: node.props.type,
      text:
        node.props.children !== undefined
          ? normalizeText(node.props.children)
          : null,
      style: {
        x,
        y,
        w,
        h,
        backgroundColor: node.props.style.backgroundColor
          ? normalizeHexOrComplexColor(node.props.style.backgroundColor)
          : null,
        borderColor: node.props.style.borderColor
          ? normalizeHexColor(node.props.style.borderColor)
          : null,
        borderWidth: node.props.style.borderWidth ?? null,
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
      : null,
    backgroundImage: props?.style?.backgroundImage ?? null,
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
