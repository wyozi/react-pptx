import * as React from "react";
import "./index";
import { render } from "./renderer";
import fs = require("fs");

describe("test render", () => {
  it("ok", async () => {
    const test = (
      <presentation>
        <slide>
          <text style={{ x: 0, y: 0, w: 1, h: 0.2 }}>Hello world</text>
          <shape
            shape="rect"
            style={{ x: 0, y: 2, w: 3, h: 3, backgroundColor: "#FF0000" }}
          >
            Foo bar
          </shape>
        </slide>
        <slide>
          <image
            url="https://www.abeautifulsite.net/uploads/2014/08/tinypng-logo.png?width=600&key=a909caf7ff544565d9e4befbd97e4e2652440001d7b5a53df36123e6cd7ef5cf"
            style={{ x: 0, y: 0, w: 2, h: 2 }}
          />
        </slide>
        <slide>
          <text style={{ x: 0, y: 0, w: 1, h: 0.2 }}>Hello world</text>
        </slide>
      </presentation>
    );
    const rendered = await render(test);
    fs.writeFileSync("test.pptx", rendered);
  }, 25000);
});
