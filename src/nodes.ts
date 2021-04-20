import type PptxGenJs from "pptxgenjs";
import React from "react";
import {
  InternalImageSrc,
  InternalPresentation,
  InternalText,
  InternalTextPartBaseStyle,
} from "./normalizer";
import { ChildElement } from "./util";

type VisualBaseProps = {
  style?: {
    x: number | string;
    y: number | string;
    w: number | string;
    h: number | string;
  };
};

interface TextNodeBaseStyle {
  bold?: InternalTextPartBaseStyle["bold"];
  color?: string;
  fontFace?: string;
  fontSize?: number;
  italic?: InternalTextPartBaseStyle["italic"];
}

export type TextLinkProps = {
  children: string;
  tooltip?: string;
  style?: TextNodeBaseStyle;
} & (
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

export type TextBulletProps = {
  children: string;
  style?: TextNodeBaseStyle;
} & Omit<
  Exclude<PptxGenJs.TextBaseProps["bullet"], boolean | undefined>,
  "style"
>;
const TextBullet: React.FC<TextBulletProps> = ("text-bullet" as unknown) as React.FC;
export const isTextBullet = (
  el: React.ReactElement
): el is React.FunctionComponentElement<TextBulletProps> => {
  return el.type === "text-bullet";
};

export type TextChild =
  | string
  | number
  | ChildElement<TextLinkProps>
  | ChildElement<TextBulletProps>
  | TextChild[];

export type TextProps = {
  children?: TextChild;
  style?: Partial<Exclude<VisualBaseProps["style"], undefined>> &
    TextNodeBaseStyle & {
      align?: InternalText["style"]["align"];
      verticalAlign?: InternalText["style"]["verticalAlign"];
    };
};
const TextFn: React.FC<TextProps> = () => null;
TextFn.prototype.isPptxTextElement = true;
TextFn.prototype.Link = TextLink;
TextFn.prototype.Bullet = TextBullet;
export const Text = Object.assign(TextFn, {
  Link: TextLink,
  Bullet: TextBullet,
});

// We add a random symbol-ish to the prototype for use in isText
// For some reason a normal el.type == Text doesn't work here when
// the result is bundled
(Text.prototype as any).isPptxTextElement = true;
export const isText = (
  el: React.ReactElement
): el is React.FunctionComponentElement<TextProps> => {
  return el.type instanceof Function && el.type.prototype.isPptxTextElement;
};

export type ImageProps = VisualBaseProps & {
  src: InternalImageSrc;
  style?: {
    /**
     * @deprecated no longer has any effect and will be removed soon! Use imageFit instead
     */
    backgroundSize?: "contain" | "cover";

    sizing?: {
      fit: "contain" | "cover" | "crop";
      imageWidth?: number;
      imageHeight?: number;
    };
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
    backgroundColor?: string;
    borderWidth?: number;
    borderColor?: string;
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
    backgroundImage?: InternalImageSrc;
  };
};
export const Slide: React.FC<SlideProps> = ("slide" as unknown) as React.FC;

export type PresentationProps = {
  children?: ChildElement<SlideProps>;
  layout?: InternalPresentation["layout"];
};
export const Presentation: React.FC<PresentationProps> = ("presentation" as unknown) as React.FC;
