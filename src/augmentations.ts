export {}; // ensure this is a module

export type SlideElement = React.ReactElement<
  React.JSX.IntrinsicElements["slide"]
>;
export type VisualElement =
  | React.ReactElement<React.JSX.IntrinsicElements["text"], "text">
  | React.ReactElement<React.JSX.IntrinsicElements["image"], "image">;

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
      };
      image: VisualProps & {
        url: string;
      };
    }
  }
}
