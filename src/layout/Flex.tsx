import { Allocator, Node, JustifyContent } from "stretch-layout";
import { SlideProps } from "../nodes";
import React from "react";

const allocator = new Allocator();
/*const node = new Node(allocator, {width: 100, height: 100, justifyContent: JustifyContent.Center});
node.addChild(new Node(allocator, {width: '50%', height: '50%'}));
const layout = node.computeLayout();

console.log(layout.width, layout.height);*/
const Flex = ({ children }: { children: SlideProps["children"] }) => {
  const node = new Node(allocator, {
    width: 100,
    height: 100,
  });

  const elementsAndNodes = React.Children.map(children, (c) => {
    const childNode = new Node(allocator, { width: "50%", height: "50%" });
    node.addChild(childNode);
    return [c, childNode];
  });

  const layout = node.computeLayout(undefined);
  console.log(layout);

  return null;
};
export default Flex;