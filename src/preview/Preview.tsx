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

const TextPreview = ({ parts }: { parts: InternalTextPart[] }) => {
  return (
    <div>
      {parts.map((part) => {
        if (part.link) {
          if ((part.link as any).url) {
            return (
              <a title={part.link.tooltip} href={(part.link as any).url}>
                {part.text}
              </a>
            );
          } else if ((part.link as any).slide) {
            // Not supported yet
            return (
              <a title={part.link.tooltip} style={{ cursor: "not-allowed" }}>
                {part.text}
              </a>
            );
          }
        } else {
          return <span>{part.text}</span>;
        }
      })}
    </div>
  );
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
  const xPercentage =
    typeof object.style.x === "number"
      ? (object.style.x / dimensions[0]) * 100
      : parseInt(object.style.x, 10);
  const yPercentage =
    typeof object.style.y === "number"
      ? (object.style.y / dimensions[1]) * 100
      : parseInt(object.style.y, 10);
  const wPercentage =
    typeof object.style.w === "number"
      ? (object.style.w / dimensions[0]) * 100
      : parseInt(object.style.w, 10);
  const hPercentage =
    typeof object.style.h === "number"
      ? (object.style.h / dimensions[1]) * 100
      : parseInt(object.style.h, 10);

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
            fontSize:
              ((object.style.fontSize * POINTS_TO_INCHES) / dimensions[0]) *
              slideWidth,
            color: object.style.color
              ? normalizedColorToCSS(object.style.color)
              : undefined,
            fontFamily: object.style.fontFace,
            display: "flex",
            alignItems: object.style.verticalAlign,
            textAlign: object.style.align,
            justifyContent: object.style.align,
          }}
        >
          <TextPreview parts={object.text} />
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
  dimensions,
  slideStyle,
  drawBoundingBoxes,
}: {
  slide: InternalSlide;
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
          ? `#${slide.backgroundColor}`
          : "white",
        position: "relative",
        ...slideStyle,
      }}
    >
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
}) => {
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
