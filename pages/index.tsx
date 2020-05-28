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

console.log(monaco);

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
  noLib: true
});

const code = `ReactPPTX.render(
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
        url="https://source.unsplash.com/random/800x600"
        style={{ x: "10%", y: "10%", w: "80%", h: "80%" }}
      />
    </Slide>
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
            ReactPPTX.render(doc, { outputType: "blob" }).then((blob) => {
              const a = document.createElement("a");
              const url = URL.createObjectURL(blob);
              a.href = url;
              a.download = "presentation.pptx";
              a.click();
              URL.revokeObjectURL(url);
            });
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
