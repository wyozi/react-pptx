// Normalizer converts and normalizes JSX Presentation trees into internal nodes
// that roughly match what pptxgenjs will want to ingest

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
  TextBulletProps,
  isTextLink,
  isTextBullet,
  isLine,
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

const DEFAULT_FONT_SIZE = 18;
const DEFAULT_FONT_FACE = "Arial";

type PptxGenJsTextStyles = Pick<
  PptxGenJs.TextPropsOptions,
  | "bold"
  | "italic"
  | "paraSpaceAfter"
  | "paraSpaceBefore"
  | "fontSize"
  | "charSpacing"
  | "fontFace"
  | "margin"
  | "lineSpacing"
  | "underline"
  | "subscript"
  | "superscript"
  | "strike"
  | "rotate"
>;
export interface InternalTextPartBaseStyle extends PptxGenJsTextStyles {
  color: HexColor | null;
}

type PptxGenJsTextOptions = Pick<
  PptxGenJs.TextPropsOptions,
  "rtlMode" | "lang" | "breakLine"
>;

export type InternalTextPart = PptxGenJsTextOptions & {
  text: string;
  // Must be partial, because parent node should override non-specified properties
  style: Partial<InternalTextPartBaseStyle>;
  link?: { tooltip?: string } & (
    | {
        url: string;
      }
    | {
        slide: number;
      }
  );
  bullet?: Exclude<PptxGenJs.TextBaseProps["bullet"], boolean>;
};
export type InternalText = ObjectBase & {
  kind: "text";
  text: InternalTextPart[];
  style: InternalTextPartBaseStyle & {
    align?: "left" | "right" | "center";
    verticalAlign?: "top" | "bottom" | "middle";
  };
};
export type InternalImage = ObjectBase & {
  kind: "image";
  src: InternalImageSrc;
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
export type InternalLine = {
  kind: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  style: {
    color: HexColor | null;
    width: number | null;
  };
};

export type InternalSlideObject = InternalText | InternalImage | InternalShape | InternalLine;

export type InternalImageSrc =
  | { kind: "data"; data: string }
  | { kind: "path"; path: string };

export type InternalSlide = {
  objects: InternalSlideObject[];
  backgroundColor: HexColor | null;
  backgroundImage: InternalImageSrc | null;
  hidden: boolean;
};

export type InternalPresentation = {
  slides: InternalSlide[];
  layout: "16x9" | "16x10" | "4x3" | "wide";
  author?: string;
  company?: string;
  revision?: string;
  subject?: string;
  title?: string;
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
    return flattenChildren(t).reduce<InternalTextPart[]>(
      (
        textParts,
        el:
          | string
          | number
          | ReactElement<TextLinkProps>
          | ReactElement<TextBulletProps>
      ) => {
        if (React.isValidElement(el)) {
          let bullet;
          if (isTextBullet(el)) {
            // We know the intention is for a bullet, so pass on true if no customisation required
            const { children, style, rtlMode, lang, ...bulletProps } = el.props;
            bullet = Object.keys(bulletProps).length ? bulletProps : true;

            const normalizedChildren = normalizeText(children);
            const normalizedParentColor = style?.color
              ? normalizeHexColor(style.color)
              : undefined;
            const parentStyle = {
              ...(style || {}),
              color: normalizedParentColor,
            };

            // Make `breakLine = false` for all child components except the last one
            // (so every child will sit within the same bullet point)
            const childParts = normalizedChildren.map((childPart, index) => ({
              rtlMode,
              lang,
              bullet: index === 0 ? bullet : undefined,
              ...childPart,
              style: {
                ...parentStyle,
                ...childPart.style,
              },
              breakLine: index + 1 >= normalizedChildren.length,
            }));
            return textParts.concat(childParts);
          }

          let link;
          if (isTextLink(el)) {
            // props extracted here again so that ts can infer them as TextLinkProps
            const { props } = el;
            if ("url" in props) {
              link = { url: props.url, tooltip: props.tooltip };
            } else if (props.slide) {
              link = { slide: props.slide, tooltip: props.tooltip };
            }
          }
          const { children, style, rtlMode, lang } = el.props;
          return textParts.concat({
            text: children,
            rtlMode,
            lang,
            link,
            bullet,
            style: {
              ...(style || {}),
              color: style?.color ? normalizeHexColor(style.color) : undefined,
            },
          });
        } else {
          return textParts.concat({
            text: el.toString(),
            style: {},
          });
        }
      },
      []
    );
  } else if (Array.isArray(t)) {
    return t.reduce(
      (prev: InternalTextPart[], cur) => prev.concat(normalizeText(cur)),
      [] as InternalTextPart[]
    );
  } else if (["number", "string"].includes(typeof t)) {
    return [
      {
        text: t.toString(),
        style: {},
      },
    ];
  } else {
    throw new TypeError(
      "Invalid TextChild found; only strings/numbers/arrays of them are accepted"
    );
  }
};

const PERCENTAGE_REGEXP = /^\d+%$/;
export const normalizeCoordinate = (
  x: string | number | null | undefined,
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

  if (isLine(node)) {
    return {
      kind: "line",
      x1: node.props.x1,
      y1: node.props.y1,
      x2: node.props.x2,
      y2: node.props.y2,
      style: {
        color: node.props.style.color
          ? normalizeHexColor(node.props.style.color)
          : null,
        width: node.props.style.width ?? null,
      },
    };
  }

  let { x, y, w, h } = node.props.style;
  x = normalizeCoordinate(x, 0);
  y = normalizeCoordinate(y, 0);
  w = normalizeCoordinate(w, 1);
  h = normalizeCoordinate(h, 1);
  const normalizedCoordinates = { x, y, w, h };

  if (isText(node)) {
    const style = node.props.style;
    return {
      kind: "text",
      text:
        node.props.children !== undefined
          ? normalizeText(node.props.children)
          : [],
      style: {
        ...style,
        ...normalizedCoordinates,
        color: style.color ? normalizeHexColor(style.color) : null,
        fontFace: style.fontFace ?? DEFAULT_FONT_FACE,
        fontSize: style.fontSize ?? DEFAULT_FONT_SIZE,
      },
    };
  } else if (isImage(node)) {
    return {
      kind: "image",
      src: node.props.src,
      style: {
        ...normalizedCoordinates,
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
        ...normalizedCoordinates,
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
    author: props.author,
    company: props.company,
    revision: props.revision,
    subject: props.subject,
    title: props.title,
  };
  if (props.children) {
    pres.slides = flattenChildren(props.children).map(normalizeSlide);
  }
  return pres;
};
