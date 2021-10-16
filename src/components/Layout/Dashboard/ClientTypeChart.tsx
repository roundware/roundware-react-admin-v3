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
import { COLORS } from "./BrowsersChart";

interface Props {
  sessions: GetListResult<Record> | null;
}

const getKeyName = (clientType: string) => {
  clientType = clientType?.toLowerCase();
  if (clientType.indexOf(`iphone`) !== -1) return `iPhone`;
  if (clientType.indexOf(`ipad`) !== -1) return `iPad`;
  if (clientType.indexOf(`xiaomi`) !== -1) return `Android`;
  if (clientType.indexOf(`android`) !== -1) return `Android`;
  if (clientType.indexOf(`samsung`) !== -1) return `Android`;
  if (clientType.indexOf(`plus`) !== -1) return `Android`;
  if (clientType.indexOf(`redmi`) !== -1) return `Android`;
  if (clientType.indexOf(`google`) !== -1) return `Android`;
  if (clientType.indexOf(`pixel`) !== -1) return `Android`;
  if (clientType.indexOf(`lge`) !== -1) return `Android`;
  if (clientType.indexOf(`zte`) !== -1) return `Android`;
  if (clientType.indexOf(`web`) !== -1) return `Web`;
  return `Other`;
};

const getClientTypeData = (sessions: { client_type: string }[]) => {
  const clientTypeMap = new Map<string, number>();
  sessions.forEach((s) => {
    const keyName = getKeyName(s?.client_type || "Other");
    let total = clientTypeMap.get(keyName);
    if (total === undefined) total = 1;
    else total += 1;
    clientTypeMap.set(keyName, total);
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

const ClientTypeChart = (props: Props) => {
  return (
    <Card style={{ width: "100%" }}>
      <CardHeader title="Platforms" />
      <CardContent>
        {props.sessions ? (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart height={400} width={400}>
                <Pie
                  // @ts-ignore
                  data={getClientTypeData(props.sessions.data)}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  fill="#8884d8"
                  labelLine
                  height={400}
                  width={400}
                  outerRadius={80}
                  label={renderCustomizedLabel}
                >
                  {/* @ts-ignore */}
                  {getClientTypeData(props.sessions.data).map(
                    (entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        name={entry.name}
                        fill={COLORS[index]}
                      ></Cell>
                    )
                  )}
                </Pie>
                <Tooltip />
                <Legend
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
