/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Card, CardContent, CardHeader } from "@mui/material";
import React from "react";
import { GetListResult, Record } from "react-admin";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CenteredLoading } from ".";

interface Props {
  sessions: GetListResult<Record> | null;
}
const getKeyName = (system: string) => {
  system = system?.toLowerCase();
  if (system.indexOf(`linux`) !== -1) return `Linux`;
  if (system.indexOf(`mac`) !== -1) return `Mac OS`;
  if (system.indexOf(`window`) !== -1) return `Windows`;
  if (system.indexOf(`ios`) !== -1) return `iOS`;
  if (system.indexOf(`android`) !== -1) return `Android`;
  if (system.indexOf(`iphone os`) !== -1) return `iOS`;
  return `Other`;
};
const getclientSystemData = (sessions: { client_system: string }[]) => {
  const clientSystemMap = new Map<string, number>();
  sessions.forEach((s) => {
    const keyName = getKeyName(s?.client_system || `Other`);
    let total = clientSystemMap.get(keyName);
    if (total === undefined) total = 1;
    else total += 1;
    clientSystemMap.set(keyName, total);
  });
  const chartData: {
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
export const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  `#e91e63`,
  `#9c27b0`,
].reverse();

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  payload,
  fill,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill={fill}
      fontSize={12}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {`${payload.name} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

const BrowsersChart = (props: Props): JSX.Element => {
  return (
    <Card style={{ width: "100%" }}>
      <CardHeader title="Operating Systems" />
      <CardContent>
        {props.sessions ? (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer height="100%" width="100%">
              <PieChart width={400} height={400}>
                <Pie
                  // @ts-ignore
                  data={getclientSystemData(props.sessions.data)}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  fill="#8884d8"
                  height={400}
                  width={400}
                  outerRadius={80}
                  labelLine
                  label={renderCustomizedLabel}
                >
                  {/* @ts-ignore */}
                  {getclientSystemData(props.sessions.data).map(
                    (entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        name={entry.name}
                        fill={COLORS[index]}
                      ></Cell>
                    )
                  )}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  height={40}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => {
                    return `${name?.payload?.name} (${name?.payload?.total})`;
                  }}
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <CenteredLoading />
        )}
      </CardContent>
    </Card>
  );
};

export default BrowsersChart;
