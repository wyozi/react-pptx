import * as pptxgenjs from "pptxgenjs";
export {}; // ensure this is a module

export type SlideElement = React.ReactElement<
  React.JSX.IntrinsicElements["slide"]
>;
type TextElement = React.ReactElement<React.JSX.IntrinsicElements["text"], "text">;
export type VisualElement =
  | TextElement
  | React.ReactElement<React.JSX.IntrinsicElements["image"], "image">
  | React.ReactElement<React.JSX.IntrinsicElements["shape"], "shape">;

type VisualProps = {
  style: {
    x: number | string;
    y: number | string;
    w: number | string;
    h: number | string;
  }
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      presentation: {
        children?: SlideElement | SlideElement[];
        layout?: "16x9" | "16x10" | "4x3" | "wide";
      };
      slide: {
        children?: VisualElement | VisualElement[];
        hidden?: boolean;
      };
      text: VisualProps & {
        children?: string;
        style: {
          color?: string;
          fontFace?: string;
          fontSize?: number;
          align?: "left" | "right" | "center",
          verticalAlign?: "top" | "bottom" | "middle", 
        }
      };
      image: VisualProps & {
        url: string;
      };
      shape: VisualProps & {
        type: keyof typeof pptxgenjs.default.ShapeType;
        children?: string;
        style: {
          backgroundColor: string;
        }
      };
    }
  }
}
