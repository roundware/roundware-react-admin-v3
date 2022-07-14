import { Card, CardContent, CardHeader } from "@mui/material";
import React from "react";
import { GetListResult, RaRecord } from "react-admin";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CenteredLoading } from ".";
import { COLORS } from "./BrowsersChart";

interface Props {
  sessions: GetListResult<RaRecord> | null;
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
  const chartData: {
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
  payload,
  fill,
}: Record<string, number | string | { payload: { name: string } }>) => {
  const radius = +innerRadius + (+outerRadius - +innerRadius) * 1.3;
  const x = +cx + radius * Math.cos(-+midAngle * RADIAN);
  const y = +cy + radius * Math.sin(-+midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill={fill.toString()}
      fontSize={12}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      {`${payload.name} (${(+percent * 100).toFixed(0)}%)`}
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
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
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
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => {
                    return `${name?.payload?.name} (${name?.payload?.total})`;
                  }}
                />
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

export default ClientTypeChart;
