import pptxgen from "pptxgenjs";
import fetch from "cross-fetch";
import type PptxGenJs from "pptxgenjs";
import { PresentationProps } from "./nodes";
import { normalizeJsx, InternalSlide, InternalSlideObject } from "./normalizer";

const renderSlideObject = async (
  pres: PptxGenJs,
  slide: PptxGenJs.ISlide,
  object: InternalSlideObject
) => {
  const { x, y, w, h } = object.style;
  if (object.kind === "text") {
    const style = object.style;
    slide.addText(object.text, {
      x,
      y,
      w,
      h,
      color: style.color,
      fontFace: style.fontFace,
      fontSize: style.fontSize,
      align: style.align,
      valign: style.verticalAlign,
    });
  } else if (object.kind === "image") {
    const req = await fetch(object.url);

    let data: string;
    if ("buffer" in req) {
      // node-fetch
      const contentType = (req as any).headers.raw()["content-type"][0];
      const buffer: Buffer = await (req as any).buffer();
      data = `data:${contentType};base64,${buffer.toString("base64")}`;
    } else {
      const blob = await req.blob();

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      data = await new Promise<string>((resolve) => {
        reader.onloadend = function () {
          resolve(reader.result as string);
        };
      });
    }

    slide.addImage({
      data,
      x,
      y,
      w,
      h,
      type: object.style.backgroundSize
    });
  } else if (object.kind === "shape") {
    const style = object.style;
    const shapeType = pres.ShapeType[object.type];
    if (object.text) {
      slide.addText(object.text, {
        shape: shapeType,
        x,
        y,
        w,
        h,
        fill: style.backgroundColor,
      });
    } else {
      slide.addShape(shapeType, {
        x,
        y,
        w,
        h,
        fill: style.backgroundColor,
      });
    }
  }
};

const renderSlide = async (
  pres: PptxGenJs,
  slide: PptxGenJs.ISlide,
  node: InternalSlide
) => {
  slide.hidden = node.hidden;
  if (node.backgroundColor) slide.bkgd = node.backgroundColor;

  return Promise.all(
    node.objects.map((object) => renderSlideObject(pres, slide, object))
  );
};

export interface RenderOptions {
  outputType:
    | "arraybuffer"
    | "base64"
    | "binarystring"
    | "blob"
    | "nodebuffer"
    | "uint8array";
}

export const render = async (
  node: React.ReactElement<PresentationProps>,
  opts?: RenderOptions
): Promise<string | Blob | ArrayBuffer | Buffer | Uint8Array> => {
  const normalized = normalizeJsx(node);
  const pres: PptxGenJs = new pptxgen();

  let layout = "LAYOUT_16x9";
  if (normalized.layout === "16x10") {
    layout = "LAYOUT_16x10";
  } else if (normalized.layout === "4x3") {
    layout = "LAYOUT_4x3";
  } else if (normalized.layout === "wide") {
    layout = "LAYOUT_WIDE";
  }
  pres.layout = layout;

  await Promise.all(
    normalized.slides.map((slideNode) => {
      const slide = pres.addSlide();
      return renderSlide(pres, slide, slideNode);
    })
  );

  return pres.write(opts?.outputType ?? "nodebuffer");
};
