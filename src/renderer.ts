// Renderer renders normalized nodes into pptxgenjs presentations

import fetch from "cross-fetch";
import type PptxGenJs from "pptxgenjs";
import pptxgen from "pptxgenjs";
import { PresentationProps } from "./nodes";
import {
  ComplexColor,
  HexColor,
  InternalImage,
  InternalMasterSlide,
  InternalSlide,
  InternalSlideObject,
  InternalTextPart,
  InternalTableCell,
  normalizeJsx,
} from "./normalizer";

const normalizedColorToPptxgenShapeFill = (
  color: HexColor | ComplexColor | null | undefined
): pptxgen.ShapeFillProps | undefined => {
  return typeof color === "string" ? { color: color } : color ?? undefined;
};

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

    slide.addShape("line", {
      x,
      y,
      w,
      h,
      flipH,
      flipV,
      line: {
        width: style.width ?? undefined,
        color: style.color ?? undefined,
      },
    });
    return;
  }

  const { x, y, w, h } = object.style;
  if (object.kind === "text") {
    const { color, verticalAlign, backgroundColor, ...style } = object.style;
    slide.addText(renderTextParts(object.text), {
      ...style,
      fill: normalizedColorToPptxgenShapeFill(backgroundColor),
      color: color ?? undefined,
      valign: verticalAlign,
      breakLine: true,
    });
  } else if (object.kind === "image") {
    const { data, sizing } = await processImageData(object);

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
    const backgroundColor = normalizedColorToPptxgenShapeFill(
      style.backgroundColor
    );

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
  } else if (object.kind === "table") {
    const style = object.style;
    const mapped: PptxGenJs.TableRow[] = object.rows.map(
      (row: InternalTableCell[]) =>
        row.map((cell: InternalTableCell) => {
          const { color, verticalAlign, backgroundColor, ...style } =
            cell.style;
          // this is super weird, but works?
          return {
            text: renderTextParts(cell.text),
            options: {
              ...style,
              fill: backgroundColor
                ? normalizedColorToPptxgenShapeFill(backgroundColor)
                : undefined,
              color: color ?? undefined,
              valign: verticalAlign ?? "middle",
              breakLine: true,
              colspan: cell.colSpan,
              rowspan: cell.rowSpan,
            },
          };
        })
    );

    slide.addTable(mapped, {
      x,
      y,
      w,
      h,
      margin: style.margin ?? undefined,
      border: {
        type: "solid",
        pt: style.borderWidth ?? undefined,
        color: style.borderColor ?? undefined,
      },
    });
  }
};

const renderSlide = async (
  pres: PptxGenJs,
  slide: PptxGenJs.Slide,
  node: InternalSlide
) => {
  slide.hidden = node.hidden;
  if (node.backgroundImage?.kind === "data") {
    slide.background = {
      data: node.backgroundImage.data,
    };
  } else if (node.backgroundImage?.kind === "path") {
    slide.background = {
      path: node.backgroundImage.path,
    };
  } else if (node.backgroundColor) {
    slide.background = {
      ...normalizedColorToPptxgenShapeFill(node.backgroundColor),
    };
  }
  if (node.notes) {
    slide.addNotes(node.notes);
  }

  return Promise.all(
    node.objects.map((object) => renderSlideObject(pres, slide, object))
  );
};

const renderMasterSlideObject = async (object: InternalSlideObject) => {
  if (object.kind === "line") {
    throw new Error(
      "Lines are not currently supported master slide objects! Master slides only support a subset of objects at the moment."
    );
  }

  const { x, y, w, h } = object.style;
  if (object.kind === "shape" && object.type === "rect") {
    return {
      rect: {
        x: object.style.x,
        y: object.style.y,
        w: object.style.w,
        h: object.style.h,
        ...(object.style.backgroundColor && {
          fill: normalizedColorToPptxgenShapeFill(object.style.backgroundColor),
        }),
      },
    };
  } else if (object.kind === "image") {
    const { data, sizing } = await processImageData(object);

    return { image: { x, y, w, h, data, sizing } };
  } else {
    throw new Error(
      "Unsupported master slide object found! Master slides only support a small subset of objects at the moment."
    );
  }
};

const renderMasterSlide = async (
  node: InternalMasterSlide
): Promise<PptxGenJs.SlideMasterProps> => {
  const masterSlide: PptxGenJs.SlideMasterProps = {
    title: node.name,
  };
  if (node.backgroundImage?.kind === "data") {
    masterSlide.background = {
      data: node.backgroundImage.data,
    };
  } else if (node.backgroundImage?.kind === "path") {
    masterSlide.background = {
      path: node.backgroundImage.path,
    };
  } else if (node.backgroundColor) {
    masterSlide.background = normalizedColorToPptxgenShapeFill(
      node.backgroundColor
    );
  } else {
    masterSlide.background = { color: "FFFFFF" };
  }
  masterSlide.objects = await Promise.all(
    node.objects.map((object) => renderMasterSlideObject(object))
  );

  return masterSlide;
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

const PRESENTATION_METADATA_PROPS = [
  "author",
  "company",
  "revision",
  "subject",
  "title",
] as const;
export const render = async (
  node: React.ReactElement<PresentationProps>,
  opts?: RenderOptions
): Promise<string | Blob | ArrayBuffer | Buffer | Uint8Array> => {
  const normalized = normalizeJsx(node);
  const pres = new pptxgen();

  // https://gitbrent.github.io/PptxGenJS/docs/usage-pres-options/#custom-slide-layouts
  if (typeof pres.layout === "object" && Object.keys(pres.layout).length > 0) {
    const { width = 0, height = 0 } = pres.layout as {
      width: number;
      height: number;
    };
    const name = `customLayout-${width}x${height}`;
    pres.defineLayout({
      name,
      width,
      height,
    });
    pres.layout = name;
  } else {
    let layout = "LAYOUT_16x9";
    if (normalized.layout === "16x10") {
      layout = "LAYOUT_16x10";
    } else if (normalized.layout === "4x3") {
      layout = "LAYOUT_4x3";
    } else if (normalized.layout === "wide") {
      layout = "LAYOUT_WIDE";
    }
    pres.layout = layout;
  }

  // First render async in order
  const masterSlides = await Promise.all(
    Object.values(normalized.masterSlides).map((masterSlideNode) => {
      return renderMasterSlide(masterSlideNode);
    })
  );

  // .. then add to presentation in order
  for (const masterSlide of masterSlides) {
    pres.defineSlideMaster(masterSlide);
  }

  for (const propName of PRESENTATION_METADATA_PROPS) {
    const metadataValue = normalized[propName];
    if (typeof metadataValue === "string") {
      pres[propName] = metadataValue;
    }
  }

  await Promise.all(
    normalized.slides.map((slideNode) => {
      const slide = pres.addSlide({
        ...(slideNode.masterName && { masterName: slideNode.masterName }),
      });
      return renderSlide(pres, slide, slideNode);
    })
  );

  return pres.write({ outputType: opts?.outputType ?? "nodebuffer" });
};

const processImageData = async (
  object: InternalImage
): Promise<{ data: any; sizing: any }> => {
  const { w, h } = object.style;

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
  return { data, sizing };
};
