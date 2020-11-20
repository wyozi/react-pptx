import * as React from "react";
import { render } from "./index";
import fs = require("fs");
import { Presentation, Slide, Shape, Text, Image } from "./nodes";

describe("test render", () => {
  it("ok", async () => {
    const test = (
      <Presentation>
        <Slide style={{ backgroundColor: "#DDDDDD" }}>
          <Text style={{ x: 3, y: 1, w: 3, h: 0.5, fontSize: 32 }}>
            Hello there!
            <Text.Link url="https://www.youtube.com/watch?v=6IqKEeRS90A">
              I am a link
            </Text.Link>
            <Text.Link slide={2} tooltip="and I'm a tooltip!">
              also for hopping to second slide
            </Text.Link>
          </Text>
          <Shape
            type="rect"
            style={{
              x: 3,
              y: 1.55,
              w: 3,
              h: 0.1,
              backgroundColor: "rgba(255, 0, 0, 0.4)",
            }}
          />
        </Slide>
        <Slide>
          <Image
            url="https://raw.githubusercontent.com/gitbrent/PptxGenJS/master/demos/common/images/tokyo-subway-route-map.jpg"
            style={{
              x: 0.2,
              y: 0.2,
              w: 3,
              h: 1.54,
            }}
          />
          <Shape
            type="rect"
            style={{
              x: 0.2,
              y: 2,
              w: 3,
              h: 2,
              borderWidth: 2,
              borderColor: "red",
            }}
          />
          <Image
            url="https://raw.githubusercontent.com/gitbrent/PptxGenJS/master/demos/common/images/tokyo-subway-route-map.jpg"
            style={{
              x: 0.2,
              y: 2,
              w: 3,
              h: 2,
              sizing: { fit: "contain", imageWidth: 3, imageHeight: 1.54 },
            }}
          />
            <Image
                data="image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
                style={{
                    x: 6.4,
                    y: 2,
                    w: 3,
                    h: 2,
                    sizing: { fit: "contain", imageWidth: 3, imageHeight: 2 },
                }}
            />
          <Shape
            type="rect"
            style={{
              x: 3.3,
              y: 2,
              w: 3,
              h: 2,
              borderWidth: 2,
              borderColor: "red",
            }}
          />
          <Image
            url="https://raw.githubusercontent.com/gitbrent/PptxGenJS/master/demos/common/images/tokyo-subway-route-map.jpg"
            style={{
              x: 3.3,
              y: 2,
              w: 3,
              h: 2,
              sizing: { fit: "cover", imageWidth: 3, imageHeight: 1.54 },
            }}
          />
        </Slide>
        <Slide
          style={{
            backgroundImage:
              "https://raw.githubusercontent.com/gitbrent/PptxGenJS/master/demos/common/images/starlabs_bkgd.jpg",
          }}
        >
          <Image
            url="http://www.fillmurray.com/460/300"
            style={{ x: "10%", y: "10%", w: "80%", h: "80%" }}
          />
        </Slide>
      </Presentation>
    );
    const rendered = await render(test, { outputType: "nodebuffer" });
    fs.writeFileSync("test.pptx", rendered as Buffer);
  }, 25000);
});
