import React from "react";
import { Composition, registerRoot } from "remotion";
import { Promo, TOTAL } from "./Promo";

const Root: React.FC = () =>
  React.createElement(React.Fragment, null,
    React.createElement(Composition, {
      id: "RevelaPromo", component: Promo as React.FC<any>, durationInFrames: TOTAL, fps: 30,
      width: 1920, height: 1080, defaultProps: { bgm: true, vertical: false },
    }),
    React.createElement(Composition, {
      id: "RevelaStory", component: Promo as React.FC<any>, durationInFrames: TOTAL, fps: 30,
      width: 1080, height: 1920, defaultProps: { bgm: true, vertical: true },
    }),
  );

registerRoot(Root);
