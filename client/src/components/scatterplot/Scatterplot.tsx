import {
  CartesianGrid,
  Cell,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
} from "recharts";
import React, { useContext, useEffect, useState } from "react";
import PointModel from "../../models/PointModel";
import PlaygroundContext from "../../context/PlaygroundContext";

interface AxesDomain {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const Scatterplot: React.FC<{
  points: PointModel[];
  onClick: (id: string) => void;
}> = (props) => {
  const { chunkIndex, activeQuery, queries } = useContext(PlaygroundContext);
  const [axesDomain, setAxesDomain] = useState<AxesDomain>();
  const [queryPoint, setQueryPoint] = useState<PointModel>();

  useEffect(() => {
    if (!axesDomain && props.points) {
      const xs = props.points.map((p) => p.x);
      const ys = props.points.map((p) => p.y);
      setAxesDomain({
        minX: 0.95 * Math.min(...xs),
        maxX: 1.05 * Math.max(...xs),
        minY: 0.95 * Math.min(...ys),
        maxY: 1.05 * Math.max(...ys),
      });
    }
  }, [props.points]);

  useEffect(() => {
    if (!activeQuery) {
      setQueryPoint(undefined);
    }
    const query = queries.find((q) => q.id === activeQuery);
    setQueryPoint(query?.point);
  }, [activeQuery]);

  const renderCustomBarLabel = (entry: any) => {
    return (
      <text
        x={entry.x}
        y={entry.y}
        textAnchor="middle"
        dy={-6}
        className={pointStyle(entry.id)}
        fontSize={10}
      >
        {chunkIndex[entry.id]}
      </text>
    );
  };

  const pointStyle = (id: string) => {
    if (
      queries.find((q) => q.id === activeQuery)?.results.includes(id) &&
      id in chunkIndex
    ) {
      return "cursor-pointer fill-yellow-500 stroke-1 stroke-black";
    }
    if (id in chunkIndex) {
      return "cursor-pointer fill-blue-700";
    }
    return "cursor-pointer fill-blue-400 hover:fill-blue-700 stroke-1 stroke-gray-100";
  };

  return (
    <ScatterChart
      width={700}
      height={400}
      margin={{
        top: 20,
        bottom: 20,
        right: 20,
      }}
    >
      <CartesianGrid />
      <XAxis
        type="number"
        dataKey="x"
        domain={axesDomain && [axesDomain.minX, axesDomain.maxX]}
        tickFormatter={() => ""}
      />
      <YAxis
        type="number"
        dataKey="y"
        domain={axesDomain && [axesDomain.minY, axesDomain.maxY]}
        tickFormatter={() => ""}
      />
      <Scatter data={props.points}>
        {props.points.map((entry, index) => (
          <Cell
            key={`cell-${index}`}
            className={pointStyle(entry.id)}
            onClick={() => props.onClick(entry.id)}
          />
        ))}
      </Scatter>
      <Scatter
        data={props.points.filter((p) => p.id in chunkIndex)}
        shape={renderCustomBarLabel}
      />
      {queryPoint && (
        <Scatter data={[queryPoint]}>
          <Cell
            key={`query`}
            className={"cursor-pointer fill-orange-600 stroke-1 stroke-black"}
          />
          ))
        </Scatter>
      )}
    </ScatterChart>
  );
};

export default Scatterplot;
