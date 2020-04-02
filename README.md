# react-pptx

React wrapper for PptxGenJS. 

```jsx
import * as ReactPPTX from "react-pptx";
import fs from "fs";

ReactPPTX.renderPPTX(
  <presentation>
    <slide>
      <text x={0} y={0} w={1} h={0.2}>
        Hello world
      </text>
    </slide>
    <slide>
      <image
        url="https://www.abeautifulsite.net/uploads/2014/08/tinypng-logo.png?width=600&key=a909caf7ff544565d9e4befbd97e4e2652440001d7b5a53df36123e6cd7ef5cf"
        x={0}
        y={2}
        w={4}
        h={4}
      />
    </slide>
  </presentation>
).then(buffer => fs.writeFile("presentation.pptx", buffer));
```