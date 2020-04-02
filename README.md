# react-pptx

React wrapper for PptxGenJS.

<img align="right" width="256" height="300" src="./README_Slides.jpg">

```jsx
import * as ReactPPTX from "react-pptx";
import fs from "fs";

ReactPPTX.render(
  <presentation>
    <slide>
      <text style={{ x: 3, y: 1, w: 3, h: 0.5, fontSize: 32 }}>
        Hello there!
      </text>
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
).then(buffer => {
  fs.writeFile("presentation.pptx", buffer);
});
```
