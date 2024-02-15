import PointModel from "./PointModel";

interface QueryModel {
  id: string;
  point: PointModel;
  results: string[];
  text: string;
}

export default QueryModel;
