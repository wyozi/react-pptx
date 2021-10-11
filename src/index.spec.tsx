import * as React from "react";
import { render } from "./index";
import PPTX2Json from "pptx2json";
import fs = require("fs");
import { Presentation, Slide, Shape, Text, Image, Line, MasterSlide } from "./nodes";

describe("test render", () => {
  it("ok", async () => {
    // Test using a separate component for master slides
    const MasterSlides = () => {
      return (
        <MasterSlide name="MASTER_SLIDE">
          <Shape type="rect" style={{ x: 0, y: 5, w: "100%", h: 0.65, backgroundColor: '#003b75' }} />
        </MasterSlide>
      )
    }

    const test = (
      <Presentation>
        <MasterSlides />
        <Slide masterName="MASTER_SLIDE">
          <Text style={{ x: 3, y: 1, w: 3, h: 0.5, fontSize: 32 }}>
            Hello there!
            <Text.Link url="https://www.youtube.com/watch?v=6IqKEeRS90A">
              I am a link
            </Text.Link>
            <Text.Link
              slide={2}
              tooltip="and I'm a tooltip!"
              style={{
                color: "orange",
                bold: true,
              }}
            >
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
          <Line
            x1={0}
            y1={3}
            x2={5}
            y2={4.5}
            style={{
              color: 'red',
              width: 2
            }}
          />
          <Line
            x1={5}
            y1={4.5}
            x2={10}
            y2={3}
            style={{
              color: 'orange',
              width: 2
            }}
          />
          <Line
            x1={10}
            y1={4.5}
            x2={0}
            y2={3}
            style={{
              color: 'blue',
              width: 5
            }}
          />
        </Slide>
        <Slide style={{ backgroundColor: "rgba(255, 127, 0, 0.4)" }}>
          <Text style={{ x: 3, y: 1, w: 3, h: 0.5, fontSize: 16 }}>
            Text before bullet
            <Text.Bullet>Adding bullet 1</Text.Bullet>
            <Text.Bullet style={{ italic: true }}>
              Adding italic bullet 2
            </Text.Bullet>
            Text after bullet
          </Text>
          <Text style={{ x: 3, y: 2.5, w: 3, h: 0.5, fontSize: 16 }}>
            <Text.Bullet type="number">Adding bullet</Text.Bullet>
            <Text.Bullet type="number" style={{ bold: true }}>
              Adding bold bullet
            </Text.Bullet>
          </Text>
          <Text
            style={{ x: 3, y: 3.5, w: 3, h: 0.5, fontSize: 16, bold: true }}
          >
            Some bold text
          </Text>
          <Text
            style={{ x: 3, y: 4, w: 3, h: 0.5, fontSize: 16, italic: true }}
          >
            Some italic text
          </Text>
        </Slide>
        <Slide>
          <Image
            src={{
              kind: "path",
              path:
                "https://raw.githubusercontent.com/gitbrent/PptxGenJS/master/demos/common/images/tokyo-subway-route-map.jpg",
            }}
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
            src={{
              kind: "path",
              path:
                "https://raw.githubusercontent.com/gitbrent/PptxGenJS/master/demos/common/images/tokyo-subway-route-map.jpg",
            }}
            style={{
              x: 0.2,
              y: 2,
              w: 3,
              h: 2,
              sizing: { fit: "contain", imageWidth: 3, imageHeight: 1.54 },
            }}
          />
          <Image
            src={{
              kind: "data",
              data:
                "image/gif;base64,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",
            }}
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
            src={{
              kind: "path",
              path:
                "https://raw.githubusercontent.com/gitbrent/PptxGenJS/master/demos/common/images/tokyo-subway-route-map.jpg",
            }}
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
            backgroundImage: {
              kind: "path",
              path:
                "https://raw.githubusercontent.com/gitbrent/PptxGenJS/master/demos/common/images/starlabs_bkgd.jpg",
            },
          }}
        >
          <Image
            src={{ kind: "path", path: "http://www.fillmurray.com/460/300" }}
            style={{ x: "10%", y: "10%", w: "80%", h: "80%" }}
          />
        </Slide>
      </Presentation>
    );
    const rendered = await render(test, { outputType: "nodebuffer" });
    fs.writeFileSync("test.pptx", rendered as Buffer);
  }, 25000);
});

describe("e2e renders", () => {
  it("includes metadata tags", async () => {
    const json = await renderToJson(
      <Presentation author="Author"
        company="Company"
        revision="Revision"
        subject="Subject"
        title="Title"
      />
    )
    expect(json['docProps/app.xml'].Properties.Company).toEqual(["Company"]);
    expect(json['docProps/core.xml']['cp:coreProperties']['dc:creator']).toEqual(["Author"]);
    expect(json['docProps/core.xml']['cp:coreProperties']['cp:lastModifiedBy']).toEqual(["Author"]);
    expect(json['docProps/core.xml']['cp:coreProperties']['dc:title']).toEqual(["Title"]);
    expect(json['docProps/core.xml']['cp:coreProperties']['dc:subject']).toEqual(["Subject"]);
    expect(json['docProps/core.xml']['cp:coreProperties']['cp:revision']).toEqual(["Revision"]);
  });
});

async function renderToJson(node: Parameters<typeof render>[0]) {
  const rendered = await render(node, { outputType: "nodebuffer" });

  const pptx2json = new PPTX2Json();
  return await pptx2json.buffer2json(rendered);
}