import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactPPTX from "react-pptx";
import { Presentation, Slide, Image, Text, Shape } from "react-pptx";
import Preview from "react-pptx/preview";
import { transform } from "buble";

const primitives = { Presentation, Slide, Image, Text, Shape };

const transpile = (code, callback, onError) => {
  try {
    const result = transform(code, {
      objectAssign: "Object.assign",
      transforms: {
        dangerousForOf: true,
        dangerousTaggedTemplateString: true,
      },
    });

    const res = new Function(
      "React",
      "ReactPPTX",
      ...Object.keys(primitives),
      result.code
    );

    res(
      React,
      { render: (doc) => callback(doc) },
      ...Object.values(primitives)
    );
  } catch (e) {
    if (onError) {
      onError(e);
    }
  }
};

(self as any).MonacoEnvironment = {
  getWorkerUrl: function (moduleId, label) {
    if (label === "json") {
      return "./json.worker.js";
    }
    if (label === "css") {
      return "./css.worker.js";
    }
    if (label === "html") {
      return "./html.worker.js";
    }
    if (label === "typescript" || label === "javascript") {
      return "./ts.worker.js";
    }
    return "./editor.worker.js";
  },
};

import * as monaco from "monaco-editor/esm/vs/editor/editor.main.js";

const editor = monaco.editor.create(
  document.getElementById("code-input-container"),
  {
    value: `ReactPPTX.render(
  <Presentation>
    <Slide>
      <Text style={{ x: 3, y: 1, w: 3, h: 0.5, fontSize: 32 }}>
        Hello there!
      </Text>
      <Shape
        type="rect"
        style={{ x: 3, y: 1.55, w: 3, h: 0.1, backgroundColor: "#FF0000" }}
      />
    </Slide>
    <Slide>
      <Image
        url="http://www.fillmurray.com/460/300"
        style={{ x: "10%", y: "10%", w: "80%", h: "80%" }}
      />
    </Slide>
  </Presentation>
)`,
    language: "javascript",
  }
);

const Previewer = () => {
  const [doc, setDoc] = React.useState(null);
  React.useEffect(() => {
    const run = () => {
      const code = editor.getValue();
      transpile(
        code,
        function (doc) {
          setDoc(doc);
        },
        function (err) {
          console.log(err);
        }
      );
    };
    run();
    editor.onDidChangeModelContent((event) => {
      run();
    });
  }, []);
  return (
    <div>
      {doc && (
        <button
          onClick={() => {
            ReactPPTX.render(doc, {outputType: "blob"}).then((blob) => console.log(blob));
          }}
        >
          download
        </button>
      )}
      <Preview slideStyle={{ border: "1px solid black" }}>{doc}</Preview>
    </div>
  );
};

ReactDOM.render(<Previewer />, document.getElementById("output"));
