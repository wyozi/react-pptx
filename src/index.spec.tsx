import * as React from "react";
import "./index";
import { renderPPTX } from "./index";
import fs = require("fs");

describe("test render", () => {
  it("ok", async () => {
    const test = (
      <presentation>
        <slide>
          <text x={0} y={0} w={1} h={0.2}>
            Hello world
          </text>
        </slide>
      </presentation>
    );
    fs.writeFileSync("ok.pptx", await renderPPTX(test));
  });
});
