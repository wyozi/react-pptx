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
