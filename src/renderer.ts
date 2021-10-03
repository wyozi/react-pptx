// Renderer renders normalized nodes into pptxgenjs presentations

import pptxgen from "pptxgenjs";
import fetch from "cross-fetch";
import type PptxGenJs from "pptxgenjs";
import { PresentationProps } from "./nodes";
import {
  normalizeJsx,
  InternalSlide,
  InternalSlideObject,
  InternalTextPart,
} from "./normalizer";

const renderTextParts = (parts: InternalTextPart[]): PptxGenJs.TextProps[] => {
  const containsBullet = parts.some(({ bullet }) => !!bullet);
  return parts.map(({ style, link, ...part }) => {
    const options: PptxGenJs.TextPropsOptions = {
      ...part,
      ...style,
      hyperlink: link,
      bullet: part.bullet,
      color: style?.color ?? undefined,
    };
    // For a mix of bullet points and non-bullet points, we have to add
    // breakLine to all items for pptxgenjs to recognise it.
    if (containsBullet && !link) {
      options.breakLine = options.breakLine ?? true;
    }
    return {
      text: part.text,
      options,
    };
  });
};

const renderSlideObject = async (
  pres: PptxGenJs,
  slide: PptxGenJs.Slide,
  object: InternalSlideObject
) => {
  if (object.kind === "line") {
    const style = object.style;

    // If x2 > x1, we need to swap the x values and enable flipH to achieve desired line
    let x, w, flipH;
    if (object.x1 < object.x2) {
      x = object.x1;
      w = object.x2 - x;
      flipH = false;
    } else {
      x = object.x2;
      w = object.x1 - x;
      flipH = true;
    }

    // If y2 > y1, we need to swap the y values and enable flipV to achieve desired line
    let y, h, flipV;
    if (object.y1 < object.y2) {
      y = object.y1;
      h = object.y2 - y;
      flipV = false;
    } else {
      y = object.y2;
      h = object.y1 - y;
      flipV = true;
    }

    slide.addShape('line', {
      x, y, w, h, flipH, flipV,
      line: {
        width: style.width ?? undefined,
        color: style.color ?? undefined,
      },
    })
    return
  }

  const { x, y, w, h } = object.style;
  if (object.kind === "text") {
    const { color, verticalAlign, ...style } = object.style;
    slide.addText(renderTextParts(object.text), {
      ...style,
      color: color ?? undefined,
      valign: verticalAlign,
      breakLine: true,
    });
  } else if (object.kind === "image") {
    let data = "";
    if (object.src.kind === "data") {
      data = `data:${object.src[object.src.kind]}`;
    } else {
      const req = await fetch(object.src[object.src.kind]);

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
    }

    let sizing;
    if (object.style.sizing && object.style.sizing.fit) {
      const imageWidth =
        object.style.sizing.imageWidth ??
        (typeof w === "number" ? w : parseInt(w, 10));
      const imageHeight =
        object.style.sizing.imageHeight ??
        (typeof h === "number" ? h : parseInt(h, 10));
      if (isNaN(imageWidth) || isNaN(imageHeight)) {
        throw new TypeError(
          "when using sizing.fit, width and height must be specified numerically, either in style itself or in sizing.width/height!"
        );
      }
      sizing = { type: object.style.sizing.fit, w: imageWidth, h: imageHeight };
    }

    slide.addImage({
      data,
      x,
      y,
      w,
      h,
      sizing: object.style.sizing ? sizing : undefined,
    });
  } else if (object.kind === "shape") {
    const style = object.style;
    const shapeType = pres.ShapeType[object.type];

    // react-pptx deprecated string-only bgcolor, but we still
    // support it because it makes sense in our use-contexts
    const backgroundColor =
      typeof style.backgroundColor === "string"
        ? { color: style.backgroundColor }
        : style.backgroundColor ?? undefined;

    if (object.text) {
      slide.addText(renderTextParts(object.text), {
        shape: shapeType,
        x,
        y,
        w,
        h,
        fill: backgroundColor,
        line: {
          size: style.borderWidth ?? undefined,
          color: style.borderColor ?? undefined,
        },
        breakLine: true,
      });
    } else {
      slide.addShape(shapeType, {
        x,
        y,
        w,
        h,
        fill: backgroundColor,
        line: {
          size: style.borderWidth ?? undefined,
          color: style.borderColor ?? undefined,
        },
      });
    }
  }
};

const renderSlide = async (
  pres: PptxGenJs,
  slide: PptxGenJs.Slide,
  node: InternalSlide
) => {
  slide.hidden = node.hidden;
  if (node.backgroundColor) slide.background = { fill: node.backgroundColor };
  if (node.backgroundImage) {
    slide.background = {
      [node.backgroundImage.kind]:
        node.backgroundImage[node.backgroundImage.kind],
    };
  }

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
  const pres = new pptxgen();

  let layout = "LAYOUT_16x9";
  if (normalized.layout === "16x10") {
    layout = "LAYOUT_16x10";
  } else if (normalized.layout === "4x3") {
    layout = "LAYOUT_4x3";
  } else if (normalized.layout === "wide") {
    layout = "LAYOUT_WIDE";
  }
  pres.layout = layout;

  const fileProps = ["author", "company", "revision", "subject", "title"];
  for (const propName in fileProps) {
    if (normalized[propName]) {
      pres[propName] = normalized[propName];
    }
  }

  await Promise.all(
    normalized.slides.map((slideNode) => {
      const slide = pres.addSlide();
      return renderSlide(pres, slide, slideNode);
    })
  );

  return pres.write({ outputType: opts?.outputType ?? "nodebuffer" });
};
