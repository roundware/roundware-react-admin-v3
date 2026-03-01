 
import { Box, Card, CardContent, CardHeader, Typography } from "@mui/material";
import { useChartsData } from "components/charts/ChartsData";
import React from "react";
import { useRedirect } from "react-admin";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { IAsset } from "types/asset";
import { ResourceList } from "../../App";
import { CenteredLoading } from "../Layout/Dashboard";

const getMediaTypes = (assets: IAsset[]) => {
  const chartDataMap = new Map<string, number>();

  assets.forEach((s) => {
    const keyName = s.media_type;
    let total = chartDataMap.get(keyName);
    if (total === undefined) total = 1;
    else total += 1;
    chartDataMap.set(keyName, total);
  });

  const chartData: { media_type: string; total: number }[] = [];

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

const AssetMediaTypesChart = (): JSX.Element => {
  const { assets, assetsAllFetchedRange } = useChartsData();
  const redirect = useRedirect();

   
  const handleOnClick = (payload: any) => {
    if (ResourceList.includes(`assets`))
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
          <CenteredLoading />
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
        <Box display="flex" justifyContent="center" mt={2}>
          <Typography
            variant="caption"
            color="textSecondary"
            textAlign={"center"}
            width="100%"
          >
            Data from {assetsAllFetchedRange?.[0]?.toLocaleDateString()} to{" "}
            {assetsAllFetchedRange?.[1]?.toLocaleDateString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AssetMediaTypesChart;
