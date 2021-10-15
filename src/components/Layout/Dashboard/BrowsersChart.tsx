import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
} from "@material-ui/core";
import { GetListResult, Record } from "react-admin";
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Cell,
  Sector,
  Label,
} from "recharts";
// @ts-ignore
import randomMC from "random-material-color";

interface Props {
  sessions: GetListResult<Record> | null;
}

const getclientSystemData = (sessions: { client_system: string }[]) => {
  const clientSystemMap = new Map<string, number>();
  sessions.forEach((s) => {
    let total = clientSystemMap.get(
      s.client_system?.split(` `)[0] || "Unknown"
    );
    if (total === undefined) total = 1;
    else total += 1;
    clientSystemMap.set(s.client_system?.split(` `)[0] || "Unknown", total);
  });
  let chartData: {
    name: string;
    total: number;
  }[] = [];
  clientSystemMap.forEach((value, key) => {
    chartData.push({
      name: key,
      total: value,
    });
  });
  return chartData;
};
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"].reverse();

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
  payload,
  fill,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill={fill}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {`${payload.name} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

const BrowsersChart = (props: Props) => {
  return (
    <Card style={{ width: "100%" }}>
      <CardHeader title="Browsers" />
      <CardContent>
        {props.sessions ? (
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  // @ts-ignore
                  data={getclientSystemData(props.sessions.data)}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  height={150}
                  fill="#8884d8"
                  labelLine
                >
                  {/* @ts-ignore */}
                  {getclientSystemData(props.sessions.data).map(
                    (entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        name={entry.name}
                        fill={randomMC.getColor()}
                      ></Cell>
                    )
                  )}
                </Pie>
                <Tooltip />
                <Legend
                  height={50}
                  overflow="scroll"
                  verticalAlign="bottom"
                  formatter={(value: any, name: any) => {
                    return `${name?.payload?.name} (${name?.payload?.total})`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <CircularProgress />
        )}
      </CardContent>
    </Card>
  );
};

export default BrowsersChart;
