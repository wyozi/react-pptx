export {}; // ensure this is a module

export type SlideElement = React.ReactElement<
  React.JSX.IntrinsicElements["slide"]
>;
export type VisualElement =
  | React.ReactElement<React.JSX.IntrinsicElements["text"], "text">
  | React.ReactElement<React.JSX.IntrinsicElements["image"], "image">;

type VisualProps = {
  x: number;
  y: number;
  w: number;
  h: number;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      presentation: {
        children?: SlideElement | SlideElement[];
      };
      slide: {
        children?: VisualElement | VisualElement[];
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
