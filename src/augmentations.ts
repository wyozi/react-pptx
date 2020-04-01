export {}; // ensure this is a module

export type SlideElement = React.ReactElement<React.JSX.IntrinsicElements["slide"]>;
export type VisualElement = React.ReactElement<React.JSX.IntrinsicElements["text"]>;

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
    }
  }
}
