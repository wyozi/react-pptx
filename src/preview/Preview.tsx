import * as React from "react";
import { PresentationProps } from "../nodes";
import {
  normalizeJsx,
  InternalSlide,
  InternalSlideObject,
  HexColor,
  ComplexColor,
  InternalShape,
  InternalTextPart,
  InternalImage,
  InternalTextPartBaseStyle,
  InternalMasterSlide,
} from "../normalizer";
import { layoutToInches, POINTS_TO_INCHES } from "../util";

const normalizedColorToCSS = (color: HexColor | ComplexColor) => {
  if (typeof color === "string") {
    return `#${color}`;
  } else {
    const r = parseInt(color.color.substring(0, 2), 16);
    const g = parseInt(color.color.substring(2, 4), 16);
    const b = parseInt(color.color.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${1 - color.alpha / 100})`;
  }
};

const SlideObjectShape = ({ shape }: { shape: InternalShape }) => {
  const baseStyle = {
    width: "100%",
    height: "100%",
    backgroundColor: shape.style.backgroundColor
      ? normalizedColorToCSS(shape.style.backgroundColor)
      : undefined,
  };

  if (shape.type === "rect") {
    return <div style={baseStyle} />;
  } else if (shape.type === "ellipse") {
    return <div style={{ ...baseStyle, borderRadius: "100%" }} />;
  } else {
    return (
      <div
        style={{
          ...baseStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: `rgba(0, 0, 0, 0) repeating-linear-gradient(45deg, yellow,  yellow 10px, black 10px, black 20px) repeat scroll 0% 0%`,
            padding: 5,
            textAlign: "center",
          }}
        >
          <span style={{ backgroundColor: "white", padding: 2 }}>
            no preview for "{shape.type}"
          </span>
        </div>
      </div>
    );
  }
};

interface ListParts {
  listType?: Exclude<InternalTextPart["bullet"], undefined | boolean>["type"];
  parts: InternalTextPart[];
}

const getTextStyleForPart = (
  style: Partial<InternalTextPartBaseStyle>,
  dimensions: [number, number],
  slideWidth: number
): React.CSSProperties => {
  const pointsToPx = (points: number) =>
    ((points * POINTS_TO_INCHES) / dimensions[0]) * slideWidth;

  let margin: string | undefined = undefined;
  if (style.margin !== undefined) {
    if (Array.isArray(style.margin)) {
      margin = style.margin
        .map((marginItem) => `${pointsToPx(marginItem)}px`)
        .join(", ");
    } else {
      margin = `0 ${pointsToPx(style.margin)}px`;
    }
  }
  
  let verticalAlign: "start" | "center" | "end" | undefined;
  switch (style.verticalAlign) {
    case "top":
      verticalAlign = "start"
      break;
    case "middle":
      verticalAlign = "center"
      break;
    case "bottom":
      verticalAlign = "end"
      break;
  }

  const textDecorationParts: string[] = [];
  if (style.underline) {
    textDecorationParts.push("underline");
  }
  if (style.strike) {
    textDecorationParts.push("line-through");
  }
  const textDecoration = textDecorationParts.length
    ? textDecorationParts.join(" ")
    : undefined;

  return {
    fontSize: style.fontSize ? pointsToPx(style.fontSize) : undefined,
    color: style.color ? normalizedColorToCSS(style.color) : undefined,
    fontFamily: style.fontFace ?? undefined,
    fontWeight: style.bold ? "bold" : undefined,
    fontStyle: style.italic ? "italic" : undefined,
    padding: margin,
    lineHeight: style.lineSpacing
      ? `${pointsToPx(style.lineSpacing)}px`
      : undefined,
    letterSpacing: style.charSpacing
      ? `${pointsToPx(style.charSpacing)}px`
      : undefined,
    textDecoration,
    marginTop: style.paraSpaceBefore
      ? `${pointsToPx(style.paraSpaceBefore)}px`
      : undefined,
    marginBottom: style.paraSpaceAfter
      ? `${pointsToPx(style.paraSpaceAfter)}px`
      : undefined,
    transform: style.rotate ? `rotate(${style.rotate}deg)` : undefined,
    alignItems: verticalAlign,
    backgroundColor: style.backgroundColor ? normalizedColorToCSS(style.backgroundColor) : undefined
  };
};

const TextPreview = ({
  parts,
  dimensions,
  slideWidth,
  subscript,
  superscript,
}: {
  parts: InternalTextPart[];
  dimensions: [number, number];
  slideWidth: number;
  subscript: boolean | undefined;
  superscript: boolean | undefined;
}) => {
  // Perform a first pass to collect any consecutive bullet points into the same
  // <ul> or <ol>
  const listsOfParts: ListParts[] = parts.reduce(
    (collectedSoFar: ListParts[], part) => {
      if (!part.bullet) {
        return [...collectedSoFar, { parts: [part] }];
      }
      const previousItem = collectedSoFar[collectedSoFar.length - 1];
      const bulletType = part.bullet === true ? "bullet" : part.bullet.type;
      if (previousItem && previousItem.listType === bulletType) {
        previousItem.parts.push(part);
        return collectedSoFar;
      } else {
        return [...collectedSoFar, { listType: bulletType, parts: [part] }];
      }
    },
    []
  );
  let children = (
    <>
      {listsOfParts.reduce((elements, { listType, parts }, index) => {
        if (!listType) {
          const nonListParts = parts.map((part, partIndex) => {
            const style = getTextStyleForPart(
              part.style,
              dimensions,
              slideWidth
            );
            if (part.link) {
              if ((part.link as any).url) {
                return (
                  <a
                    key={`${index}-${partIndex}`}
                    title={part.link.tooltip}
                    href={(part.link as any).url}
                    style={style}
                  >
                    {part.text}
                  </a>
                );
              } else if ((part.link as any).slide) {
                // Not supported yet
                return (
                  <a
                    key={`${index}-${partIndex}`}
                    title={part.link.tooltip}
                    style={{ ...style, cursor: "not-allowed" }}
                  >
                    {part.text}
                  </a>
                );
              }
            } else if (part.style.subscript) {
              return (
                <sub key={`${index}-${partIndex}`} style={style}>
                  {part.text}
                </sub>
              );
            } else if (part.style.superscript) {
              return (
                <sup key={`${index}-${partIndex}`} style={style}>
                  {part.text}
                </sup>
              );
            } else {
              return (
                <span key={`${index}-${partIndex}`} style={style}>
                  {part.text}
                </span>
              );
            }
          });
          return [...elements, ...nonListParts];
        } else {
          const listParts = parts.map((part, partIndex) => {
            const style = getTextStyleForPart(
              part.style,
              dimensions,
              slideWidth
            );
            return (
              <li key={partIndex} style={style}>
                {part.text}
              </li>
            );
          });
          const listElement =
            listType === "number" ? (
              <ol key={index}>{listParts}</ol>
            ) : (
              <ul key={index}>{listParts}</ul>
            );
          return [...elements, listElement];
        }
      }, [])}
    </>
  );
  if (superscript) {
    children = <sup>{children}</sup>;
  } else if (subscript) {
    children = <sub>{children}</sub>;
  }
  return <div>{children}</div>;
};

const constrainObjectFit = (
  sizing: InternalImage["style"]["sizing"]
): "contain" | "cover" | undefined => {
  const fit = sizing?.fit;
  if (fit === "contain" || fit === "cover") {
    return fit;
  } else {
    return undefined;
  }
};

const calculatePercentage = (value: any, total: number) =>
  typeof value === "number"
    ? (value / total) * 100
    : parseInt(value, 10);

const SlideObjectPreview = ({
  object,
  dimensions,
  slideWidth,
  drawBoundingBoxes,
}: {
  object: InternalSlideObject;
  dimensions: [number, number];
  slideWidth: number;
  drawBoundingBoxes: boolean;
}) => {
  if (object.kind === 'line') {
    const { x1, x2, y1, y2 } = object;
    const thickness = object.style.width ?? 1;

    // from https://stackoverflow.com/a/8673281/13065068
    const length = Math.sqrt(((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1)));
    const centerX = ((x1 + x2) / 2) - (length / 2);
    const centerY = ((y1 + y2) / 2);
    const angle = Math.atan2((y1 - y2), (x1 - x2)) * (180 / Math.PI);

    return (
      <div
        style={{
          position: "absolute",
          left: `${calculatePercentage(centerX, dimensions[0])}%`,
          top: `${calculatePercentage(centerY, dimensions[1])}%`,
          width: `${calculatePercentage(length, dimensions[0])}%`,
          transform: `rotate(${angle}deg) translateY(${thickness / 2}px)`,
          height: thickness,
          backgroundColor: object.style.color ? normalizedColorToCSS(object.style.color) : undefined
        }}
      >
      </div>
    )
  }
  const xPercentage = calculatePercentage(object.style.x, dimensions[0]);
  const yPercentage = calculatePercentage(object.style.y, dimensions[1]);
  const wPercentage = calculatePercentage(object.style.w, dimensions[0]);
  const hPercentage = calculatePercentage(object.style.h, dimensions[1]);
  return (
    <div
      style={{
        position: "absolute",
        left: `${xPercentage}%`,
        top: `${yPercentage}%`,
        width: `${wPercentage}%`,
        height: `${hPercentage}%`,
        outline: drawBoundingBoxes ? "1px solid red" : undefined,
        boxSizing: "border-box",
      }}
    >
      {object.kind === "text" ? (
        <div
          style={{
            ...getTextStyleForPart(object.style, dimensions, slideWidth),
            height: "100%",
            display: "flex",
            textAlign: object.style.align,
            justifyContent: object.style.align,
          }}
        >
          <TextPreview
            parts={object.text}
            subscript={object.style.subscript}
            superscript={object.style.superscript}
            dimensions={dimensions}
            slideWidth={slideWidth}
          />
        </div>
      ) : object.kind === "image" ? (
        <img
          src={
            object.src.kind === "data"
              ? `data:${object.src[object.src.kind]}`
              : object.src[object.src.kind]
          }
          style={{
            width: "100%",
            height: "100%",
            objectFit: constrainObjectFit(object.style.sizing),
          }}
        />
      ) : (
        <SlideObjectShape shape={object} />
      )}
    </div>
  );
};

const useResize = (myRef: any) => {
  const [width, setWidth] = React.useState(0);
  const [height, setHeight] = React.useState(0);

  React.useEffect(() => {
    const handleResize = () => {
      setWidth(myRef.current.offsetWidth);
      setHeight(myRef.current.offsetHeight);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [myRef]);

  return { width, height };
};
const SlidePreview = ({
  slide,
  masterSlide,
  dimensions,
  slideStyle,
  drawBoundingBoxes,
}: {
  slide: InternalSlide;
  masterSlide?: InternalMasterSlide;
  dimensions: [number, number];
  slideStyle?: React.CSSProperties;
  drawBoundingBoxes: boolean;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const { width } = useResize(ref);
  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        height: width / (dimensions[0] / dimensions[1]),
        backgroundColor: slide.backgroundColor
          ? normalizedColorToCSS(slide.backgroundColor)
          : "white",
        backgroundImage:
          slide.backgroundImage && slide.backgroundImage?.kind === "path"
            ? `url("${slide.backgroundImage.path}")`
            : `url("data:${slide.backgroundImage?.data}")`,
        position: "relative",
        ...slideStyle,
      }}
    >
      {masterSlide?.objects?.map((o, i) => (
        <SlideObjectPreview
          key={i}
          object={o}
          dimensions={dimensions}
          slideWidth={width}
          drawBoundingBoxes={drawBoundingBoxes}
        />
      ))}
      {slide.objects.map((o, i) => (
        <SlideObjectPreview
          key={i}
          object={o}
          dimensions={dimensions}
          slideWidth={width}
          drawBoundingBoxes={drawBoundingBoxes}
        />
      ))}
    </div>
  );
};

const Preview = (props: {
  children: React.ReactElement<PresentationProps>;
  slideStyle?: React.CSSProperties;
  drawBoundingBoxes?: boolean;
}): JSX.Element | null => {
  if (!props.children) {
    return null;
  }

  const presentationNode = React.Children.only(props.children);

  try {
    const normalized = normalizeJsx(presentationNode);

    return (
      <div
        style={{
          width: "100%",
        }}
      >
        {normalized.slides.map((slide, i) => (
          <SlidePreview
            key={i}
            slide={slide}
            masterSlide={(slide.masterName && normalized.masterSlides[slide.masterName]) || undefined}
            dimensions={layoutToInches(normalized.layout)}
            slideStyle={props.slideStyle}
            drawBoundingBoxes={!!props.drawBoundingBoxes}
          />
        ))}
      </div>
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(e);
    return (
      <div
        style={{
          width: "100%",
          color: "orange",
        }}
      >
        invalid JSX: {e.toString()}
      </div>
    );
  }
};
export default Preview;
