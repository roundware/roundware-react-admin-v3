import React from "react";
import { Card, CardContent } from "@material-ui/core";
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
interface Props {
  sessions: GetListResult<Record>;
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
    <div style={{ width: "100%", height: 120 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            // @ts-ignore
            data={getClientTypeData(props.sessions.data)}
            dataKey="total"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={50}
            fill="#8884d8"
            width={400}
            height={400}
            labelLine
            label={renderCustomizedLabel}
          >
            {/* @ts-ignore */}
            {getClientTypeData(props.sessions.data).map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                name={entry.name}
                fill={COLORS[index % COLORS.length]}
              ></Cell>
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ClientTypeChart;
