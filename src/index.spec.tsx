import * as React from "react";
import { render } from "./index";
import fs = require("fs");

describe("test render", () => {
  it("ok", async () => {
    const test = (
      <presentation>
        <slide>
          <text style={{ x: 3, y: 1, w: 3, h: 0.5, fontSize: 32 }}>Hello there!</text>
          <shape
            type="rect"
            style={{ x: 3, y: 1.55, w: 3, h: 0.1, backgroundColor: "#FF0000" }}
          />
        </slide>
        <slide>
          <image
            url="http://www.fillmurray.com/460/300"
            style={{ x: "10%", y: "10%", w: "80%", h: "80%" }}
          />
        </slide>
      </presentation>
    );
    const rendered = await render(test);
    fs.writeFileSync("test.pptx", rendered);
  }, 25000);
});
