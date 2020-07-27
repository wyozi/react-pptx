import type PptxGenJs from "pptxgenjs";
import React from "react";
import { InternalPresentation, InternalText } from "./normalizer";
import { ChildElement } from "./util";

type VisualBaseProps = {
  style?: {
    x: number | string;
    y: number | string;
    w: number | string;
    h: number | string;
  };
};

export type TextLinkProps = { children: string; tooltip?: string } & (
  | {
      url: string;
    }
  | {
      slide: number;
    }
);
const TextLink: React.FC<TextLinkProps> = ("text-link" as unknown) as React.FC;
export const isTextLink = (
  el: React.ReactElement
): el is React.FunctionComponentElement<TextLinkProps> => {
  return el.type === "text-link";
};

export type TextChild =
  | string
  | number
  | ChildElement<TextLinkProps>
  | TextChild[];

export type TextProps = VisualBaseProps & {
  children?: TextChild;
  style?: {
    color?: string;
    fontFace?: string;
    fontSize?: number;
    align?: InternalText["style"]["align"];
    verticalAlign?: InternalText["style"]["verticalAlign"];
  };
};
export class Text extends React.Component<TextProps> {
  static Link = TextLink;
}
// We add a random symbol-ish to the prototype for use in isText
// For some reason a normal el.type == Text doesn't work here when
// the result is bundled
(Text.prototype as any).isPptxTextElement = true;
export const isText = (
  el: React.ReactElement
): el is React.ComponentElement<TextProps, Text> => {
  return (
    el.type instanceof Object && (el.type as any).prototype.isPptxTextElement
  );
};

export type ImageProps = VisualBaseProps & {
  url: string;
  style?: {
    backgroundSize?: "contain" | "cover";
  };
};
export const Image: React.FC<ImageProps> = ("image" as unknown) as React.FC;
export const isImage = (
  el: React.ReactElement
): el is React.FunctionComponentElement<ImageProps> => {
  return el.type === "image";
};

export type ShapeProps = VisualBaseProps & {
  type: keyof typeof PptxGenJs.ShapeType;
  children?: TextChild;
  style?: {
    backgroundColor: string;
  };
};
export const Shape: React.FC<ShapeProps> = ("shape" as unknown) as React.FC;
export const isShape = (
  el: React.ReactElement
): el is React.FunctionComponentElement<ShapeProps> => {
  return el.type === "shape";
};

export type VisualProps = TextProps | ImageProps | ShapeProps;
export type Visual = typeof Text | typeof Image | typeof Shape;

export type SlideProps = {
  children?: ChildElement<VisualProps>;
  hidden?: boolean;
  style?: {
    backgroundColor?: string;
  };
};
export const Slide: React.FC<SlideProps> = ("slide" as unknown) as React.FC;

export type PresentationProps = {
  children?: ChildElement<SlideProps>;
  layout?: InternalPresentation["layout"];
};
export const Presentation: React.FC<PresentationProps> = ("presentation" as unknown) as React.FC;
