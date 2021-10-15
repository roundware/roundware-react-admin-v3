import React from "react";
import {
  Card,
  CardContent,
  CircularProgress,
  CardHeader,
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

const getClientTypeData = (sessions: { client_type: string }[]) => {
  const clientTypeMap = new Map<string, number>();
  sessions.forEach((s) => {
    let total = clientTypeMap.get(s.client_type || "Unknown");
    if (total === undefined) total = 1;
    else total += 1;
    clientTypeMap.set(s.client_type || "Unknown", total);
  });
  let chartData: {
    name: string;
    total: number;
  }[] = [];
  clientTypeMap.forEach((value, key) => {
    chartData.push({
      name: key,
      total: value,
    });
  });
  return chartData;
};
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

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
  const radius = innerRadius + (outerRadius - innerRadius) * 1.5;
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
      {`${payload.name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const ClientTypeChart = (props: Props) => {
  return (
    <Card style={{ width: "100%" }}>
      <CardHeader title="Platforms" />
      <CardContent>
        {props.sessions ? (
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  // @ts-ignore
                  data={getClientTypeData(props.sessions.data)}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  fill="#8884d8"
                  height={150}
                  labelLine
                >
                  {/* @ts-ignore */}
                  {getClientTypeData(props.sessions.data).map(
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

export default ClientTypeChart;
