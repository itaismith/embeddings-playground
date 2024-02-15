import React, { useContext } from "react";
import PlaygroundContext from "../../context/PlaygroundContext";
import { useTransition, animated } from "react-spring";
import PlaygroundModel from "../../models/PlaygroundModel";
import PlaygroundButton from "./PlaygroundButton";

const PlaygroundList: React.FC = () => {
  const { playgrounds, activePlayground } = useContext(PlaygroundContext);

  const height = 20;

  const transitions = useTransition<PlaygroundModel, { y: number }>(
    playgrounds.map((playground, i) => ({ ...playground, y: i * height })),
    {
      keys: (playground: PlaygroundModel) => playground.id,
      from: { height, opacity: 0, position: "absolute" },
      leave: { height: 0, opacity: 0 },
      enter: ({ y }: { y: number }) => ({ delay: 200, y, opacity: 1 }),
      update: ({ y }: { y: number }) => ({ delay: 200, y }),
      config: {
        duration: 250,
      },
    },
  );

  return (
    <div className="relative flex-grow overflow-y-scroll scroll-smooth">
      {transitions((props, playground) => {
        return (
          <animated.div
            key={playground.id}
            style={{
              transform: props.y.to((y) => `translate3d(0,${y}px,0)`),
              ...props,
            }}
          >
            <PlaygroundButton playground={playground} />
          </animated.div>
        );
      })}
    </div>
  );
};

export default PlaygroundList;
