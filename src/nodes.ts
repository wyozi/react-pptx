import type PptxGenJs from "pptxgenjs";

type VisualBaseProps = {
  style: {
    x: number | string;
    y: number | string;
    w: number | string;
    h: number | string;
  };
};

export type TextProps = VisualBaseProps & {
  children?: string;
  style: {
    color?: string;
    fontFace?: string;
    fontSize?: number;
    align?: "left" | "right" | "center";
    verticalAlign?: "top" | "bottom" | "middle";
  };
};
export const Text: React.FC<TextProps> = ("text" as unknown) as React.FC;
export const isText = (
  el: React.ReactElement
): el is React.FunctionComponentElement<TextProps> => {
  return el.type === "text";
};

export type ImageProps = VisualBaseProps & {
  url: string;
};
export const Image: React.FC<ImageProps> = ("image" as unknown) as React.FC;
export const isImage = (
  el: React.ReactElement
): el is React.FunctionComponentElement<ImageProps> => {
  return el.type === "image";
};

export type ShapeProps = VisualBaseProps & {
  type: keyof typeof PptxGenJs.ShapeType;
  children?: string;
  style: {
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
  children?:
    | React.ReactElement<VisualProps>
    | React.ReactElement<VisualProps>[];
  hidden?: boolean;
};
export const Slide: React.FC<SlideProps> = ("slide" as unknown) as React.FC;

export type PresentationProps = {
  children?: React.ReactElement<SlideProps> | React.ReactElement<SlideProps>[];
  layout?: "16x9" | "16x10" | "4x3" | "wide";
};
export const Presentation: React.FC<PresentationProps> = ("presentation" as unknown) as React.FC;
