import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactPPTX from "react-pptx";
import {
  Presentation,
  Slide,
  MasterSlide,
  Image,
  Text,
  Shape,
  Line,
  normalizeJsx,
} from "react-pptx";
import Preview from "react-pptx/preview";
import { transform } from "buble";

declare var __LATEST_GIT_TAG__: string;
declare var __LATEST_GIT_COMMIT_HASH__: string;

const primitives = { Presentation, Slide, MasterSlide, Image, Text, Shape, Line };

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
    if (label === "typescript") {
      return "./ts.worker.js";
    }
    return "./editor.worker.js";
  },
};

import "monaco-editor/esm/vs/editor/browser/controller/coreCommands.js";
import "monaco-editor/esm/vs/editor/contrib/hover/hover.js";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import "monaco-editor/esm/vs/language/typescript/monaco.contribution";
import "monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution";

// @ts-ignore
import coreDefs from "!!raw-loader!../node_modules/typescript/lib/lib.es5.d.ts";
monaco.languages.typescript.typescriptDefaults.addExtraLib(
  coreDefs as any,
  "file:///node_modules/@types/deflib/index.d.ts"
);
// @ts-ignore
import reactTypes from "!!raw-loader!../node_modules/@types/react/index.d.ts";
monaco.languages.typescript.typescriptDefaults.addExtraLib(
  reactTypes as any,
  "file:///node_modules/@types/react/index.d.ts"
);
// @ts-ignore
import nodesTypes from "!!raw-loader!../dist/nodes.d.ts";
monaco.languages.typescript.typescriptDefaults.addExtraLib(
  `export declare function fdsfsdfs(a: number, b: number): number
  declare global {
    ${(nodesTypes as any).replace(/export declare/, "declare")}
  }`,
  "file:///node_modules/@types/react-pptx-nodes/index.d.ts"
);
monaco.languages.typescript.typescriptDefaults.addExtraLib(
  `export declare function add(a: number, b: number): number
  declare global {
    namespace ReactPPTX {
      declare function render(node: React.ReactElement<PresentationProps>):
    }
  }`,
  "file:///node_modules/@types/react-pptx/index.d.ts"
);
monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  jsx: monaco.languages.typescript.JsxEmit.Preserve,
  noLib: true,
});

const code = `ReactPPTX.render(
  <Presentation>
    <Slide>
      <Text style={{
        x: 3, y: 1, w: 3, h: 0.5, fontSize: 32, bold: true
      }}>
        Hello there!
      </Text>
      <Shape
        type="rect"
        style={{
          x: 3, y: 1.55, w: 3, h: 0.1,
          backgroundColor: "#FF0000"
        }}
      />
      <Text style={{
        x: 2, y: 2.8, w: 6, h: 0.5, fontSize: 16
      }}>
        <Text.Link url="https://github.com/wyozi/react-pptx">
          here's a link
        </Text.Link> to the repository
        or a
        <Text.Link
          url="https://www.youtube.com/watch?v=6IqKEeRS90A"
          style={{
            color: "orange"
          }}
        >
          video
        </Text.Link>, if you'd like.
      </Text>
      <Line
        x1={1}
        x2={9}
        y1={5}
        y2={5}
        style={{
          color: 'blue',
          width: 2
        }}
      />
    </Slide>
    <Slide style={{ backgroundColor: "#DDDDDD" }}>
      <Text style={{ x: 3, y: 1, w: 3, h: 0.5, fontSize: 32 }}>
        <Text.Bullet>Adding bullet 1</Text.Bullet>
        <Text.Bullet>Adding bullet 2</Text.Bullet>
      </Text>
      <Text style={{ x: 3, y: 3.5, w: 3, h: 0.5, fontSize: 32 }}>
        <Text.Bullet type="number">Adding bullet</Text.Bullet>
        <Text.Bullet type="number">Adding bullet</Text.Bullet>
      </Text>
    </Slide>
    <Slide>
      <Image
        src={{ kind: "path", path: "https://source.unsplash.com/random/800x600" }}
        style={{ x: "10%", y: "10%", w: "80%", h: "80%" }}
      />
    </Slide>
    {[1, 2, 3].map(n => (
      <Slide key={n}>
        <Text style={{x: "50%", y: "50%", w: 1, h: 0.2}}>
          slide {n}
        </Text>
      </Slide>
    ))}
    <>
      {[1, 2, 3].map(n => (
        <Slide key={n}>
          <Text style={{x: "50%", y: "50%", w: 1, h: 0.2}}>
            fragment slide {n}
          </Text>
        </Slide>
      ))}
    </>
  </Presentation>
)`;
const model = monaco.editor.createModel(
  code,
  "typescript",
  monaco.Uri.parse("file:///main.tsx")
);

const editor = monaco.editor.create(
  document.getElementById("code-input-container"),
  {
    model,
    automaticLayout: true,
  }
);

const Previewer = () => {
  const [doc, setDoc] = React.useState(null);
  const [disableDownload, setDisableDownload] = React.useState(false);
  const [showInternal, setShowInternal] = React.useState(false);
  const [showBoundingBoxes, setShowBoundingBoxes] = React.useState(false);
  React.useEffect(() => {
    const run = () => {
      const code = editor.getValue();
      transpile(
        code,
        function (doc) {
          console.log("parsed presentation node: ", doc);
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

  let normalizedDoc;
  try {
    normalizedDoc = doc ? normalizeJsx(doc) : null;
  } catch (e) {
    console.warn("normalization failed ", e);
  }

  return (
    <div>
      <span title={__LATEST_GIT_COMMIT_HASH__}>
        react-pptx {__LATEST_GIT_TAG__}
      </span>
      {doc && (
        <button
          onClick={() => {
            setDisableDownload(true);
            ReactPPTX.render(doc, { outputType: "blob" }).then(
              (blob) => {
                const a = document.createElement("a");
                const url = URL.createObjectURL(blob);
                a.href = url;
                a.download = "presentation.pptx";
                a.click();
                URL.revokeObjectURL(url);
                setDisableDownload(false);
              },
              (err) => {
                console.warn(err);
                setDisableDownload(false);
              }
            );
          }}
          disabled={disableDownload}
        >
          download as .pptx
        </button>
      )}
      <label>
        <input
          type="checkbox"
          checked={showInternal}
          onChange={(e) => setShowInternal(e.target.checked)}
        />
        debug internal structure
      </label>
      <label>
        <input
          type="checkbox"
          checked={showBoundingBoxes}
          onChange={(e) => setShowBoundingBoxes(e.target.checked)}
        />
        bounding boxes
      </label>
      <div style={{ position: "relative" }}>
        {showInternal && (
          <div
            style={{
              position: "absolute",
              backgroundColor: "white",
              right: 0,
              whiteSpace: "pre",
              zIndex: 1,
            }}
          >
            {normalizedDoc ? JSON.stringify(normalizedDoc, undefined, 2) : ""}
          </div>
        )}
        <Preview
          slideStyle={{ border: "1px solid black" }}
          drawBoundingBoxes={showBoundingBoxes}
        >
          {doc}
        </Preview>
      </div>
    </div>
  );
};

ReactDOM.render(<Previewer />, document.getElementById("output"));
