import {
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Toolbar,
  Typography,
} from "@material-ui/core";
import React from "react";
import { GetListResult, Record, useRedirect } from "react-admin";
import {
  Legend,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface Props {
  assets: GetListResult<Record> | null;
}
const getMediaTypes = (assets: GetListResult<Record>) => {
  const chartDataMap = new Map<string, number>();

  assets.data.forEach((s) => {
    let keyName = s.media_type;
    let total = chartDataMap.get(keyName);
    if (total === undefined) total = 1;
    else total += 1;
    chartDataMap.set(keyName, total);
  });

  let chartData: { media_type: string; total: number }[] = [];

  chartDataMap.forEach((val, key) => {
    chartData.push({
      media_type: key,
      total: val,
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
  media_type,
  index,
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
      {`${media_type} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const AssetMediaTypesChart = ({ assets }: Props) => {
  const redirect = useRedirect();

  const handleOnClick = (payload: any) => {
    redirect(
      `list`,
      `assets?filter=${JSON.stringify({
        media_type: payload?.media_type,
      })}`
    );
  };
  return (
    <Card>
      <CardHeader title="Media Types" />

      <CardContent>
        {!assets ? (
          <CircularProgress />
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart width={400} height={400}>
                <Pie
                  data={getMediaTypes(assets)}
                  cx="50%"
                  cy="50%"
                  dataKey="total"
                  nameKey="media_type"
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  width={400}
                  height={400}
                  labelLine
                  onClick={handleOnClick}
                >
                  {getMediaTypes(assets).map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      name={entry.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  formatter={(value: any, name: any) => {
                    return `${name?.payload?.media_type} (${name?.payload?.total})`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssetMediaTypesChart;
