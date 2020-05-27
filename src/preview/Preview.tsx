import * as React from "react";
import { PresentationProps } from "../nodes";
import {
  normalizeJsx,
  InternalSlide,
  InternalSlideObject,
} from "../normalizer";
import { layoutToInches, POINTS_TO_INCHES } from "../util";

const SlideObjectPreview = ({
  object,
  dimensions,
  slideWidth,
}: {
  object: InternalSlideObject;
  dimensions: [number, number];
  slideWidth: number;
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
      }}
    >
      {object.kind === "text" ? (
        <div
          style={{
            fontSize:
              ((object.style.fontSize * POINTS_TO_INCHES) / dimensions[0]) *
              slideWidth,
            color: `#${object.style.color}`,
            fontFamily: object.style.fontFace,
            display: "flex",
            alignItems: object.style.verticalAlign,
          }}
        >
          {object.text}
        </div>
      ) : object.kind === "image" ? (
        <img
          src={object.url}
          style={{
            width: "100%",
            height: "100%",
            objectFit: object.style.backgroundSize,
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: `#${object.style.backgroundColor}`,
          }}
        ></div>
      )}
    </div>
  );
};

const useResize = (myRef) => {
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
}: {
  slide: InternalSlide;
  dimensions: [number, number];
  slideStyle?: React.CSSProperties;
}) => {
  const ref = React.useRef();
  const { width } = useResize(ref);
  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        height: width / (dimensions[0] / dimensions[1]),
        backgroundColor: slide.backgroundColor ?? "white",
        position: "relative",
        ...slideStyle,
      }}
    >
      {slide.objects.map((o) => (
        <SlideObjectPreview
          object={o}
          dimensions={dimensions}
          slideWidth={width}
        />
      ))}
    </div>
  );
};

const Preview = (props: {
  children: React.ReactElement<PresentationProps>;
  slideStyle?: React.CSSProperties;
}) => {
  if (!props.children) {
    return null;
  }

  const arr = Array.isArray(props.children) ? props.children : [props.children];
  if (arr.length === 0) {
    return null;
  } else if (arr.length > 1) {
    console.warn(
      "attempted to render more than one presentation in a single Preview node"
    );
    return null;
  }

  const normalized = normalizeJsx(arr[0]);

  return (
    <div
      style={{
        width: "100%",
      }}
    >
      {normalized.slides.map((slide) => (
        <SlidePreview
          slide={slide}
          dimensions={layoutToInches(normalized.layout)}
          slideStyle={props.slideStyle}
        />
      ))}
    </div>
  );
};
export default Preview;
