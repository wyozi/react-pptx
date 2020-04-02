import * as pptxgen from "pptxgenjs";
import fetch from "node-fetch";
import { SlideElement, VisualElement } from "./augmentations";

const renderSlideNode = async (
  slide: pptxgen.default.Slide,
  node: VisualElement
) => {
  const { x, y, w, h } = node.props.style;
  if (node.type === "text") {
    slide.addText(node.props.children ?? "", {
      x,
      y,
      w,
      h
    });
  } else if (node.type === "image") {
    const req = await fetch(node.props.url);
    const contentType = req.headers.raw()["content-type"][0];
    const blob = await req.buffer();
    const data = `data:${contentType};base64,${blob.toString("base64")}`;
    slide.addImage({
      data,
      x,
      y,
      w,
      h
    });
  }
};

const renderSlide = async (
  slide: pptxgen.default.Slide,
  { props }: SlideElement
) => {
  if (props.hidden !== undefined) {
    slide.hidden = props.hidden;
  }
  if (Array.isArray(props.children)) {
    return Promise.all(
      props.children.map(slideNode => renderSlideNode(slide, slideNode))
    );
  } else {
    return renderSlideNode(slide, props.children);
  }
};

export const render = async ({
  props
}: React.ReactElement<
  React.JSX.IntrinsicElements["presentation"]
>): Promise<any> => {
  const pres = new (pptxgen as any)();

  if (props.layout) {
    let layout = "LAYOUT_16x9";
    if (props.layout === "16x10") {
      layout = "LAYOUT_16x10";
    } else if (props.layout === "4x3") {
      layout = "LAYOUT_4x3";
    } else if (props.layout === "wide") {
      layout = "LAYOUT_WIDE";
    }
    pres.layout = layout;
  }

  if (props.children) {
    const arr = Array.isArray(props.children)
      ? props.children
      : [props.children];
    await Promise.all(
      arr.map(slideElement => {
        const slide = pres.addSlide();
        return renderSlide(slide, slideElement);
      })
    );
  }

  return pres.write("nodebuffer");
};
