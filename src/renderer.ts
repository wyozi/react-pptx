import * as pptxgen from "pptxgenjs";
import { SlideElement, VisualElement } from "./augmentations";

const renderSlideNode = (slide: pptxgen.Slide, node: VisualElement) => {
  if (node.type === "text") {
    const { x, y, w, h } = node.props;
    slide.addText(node.props.children ?? "", {
      x,
      y,
      w,
      h
    });
  }
};

const renderSlide = (slide: pptxgen.Slide, node: SlideElement) => {
  renderSlideNode(slide, node.props.children as any);
};

export const renderPPTX = async ({
  props: { children }
}: React.ReactElement<
  React.JSX.IntrinsicElements["presentation"]
>): Promise<any> => {
  const pres = new pptxgen();

  if (children) {
    const arr = Array.isArray(children) ? children : [children];
    arr.forEach(slideElement => {
      const slide = pres.addNewSlide();
      renderSlide(slide, slideElement);
    });
  }

  return new Promise(resolve =>
    pres.save(
      "pres.pptx",
      (buf: any) => {
        resolve(buf);
      },
      "nodebuffer"
    )
  );
};
