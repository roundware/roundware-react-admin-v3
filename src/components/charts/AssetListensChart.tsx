 
 
import { Box, Slider, Toolbar, Typography } from "@mui/material";
import { capitalize, uniqBy } from "lodash";
import React, { useEffect, useMemo, useState } from "react";
import { useRedirect } from "react-admin";
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Label,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { IListenEvent } from "types/listenEvents";
import { isWithinRange } from "../../utils";
import { CenteredLoading } from "../Layout/Dashboard";

interface Props {
  listenEvents: IListenEvent[];
  viewRange: [Date, Date];
}

const AssetListensChart = ({ listenEvents, viewRange }: Props): JSX.Element => {
  const redirect = useRedirect();

  const [viewIndexRange, setViewIndexRange] = useState([0, 0]);

  const perAssetListens = useMemo(() => {
    const listensPerAsset = listenEvents
      .filter((r) => {
        const date = new Date(r.start_time);
        return isWithinRange(date, viewRange);
      })
      .reduce((acc, listen) => {
        const asset = listen.asset_id;
        if (!acc[asset]) {
          acc[asset] = {
            assetId: asset,
            total: 0,
          };
        }
        acc[asset].total += 1;
        return acc;
      }, {} as { [key: string]: { assetId: number; total: number } });

    return uniqBy(Object.values(listensPerAsset), "assetId").sort((a, b) =>
      a.total > b.total ? -1 : 1
    );
  }, [listenEvents, viewRange]);

  useEffect(() => {
    setViewIndexRange([0, perAssetListens.length]);
  }, [perAssetListens]);

  return (
    <>
      <Toolbar>
        <Typography variant="body2" color="textSecondary">
          Listens by Asset
        </Typography>
      </Toolbar>
      {!listenEvents.length ? (
        <CenteredLoading />
      ) : (
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <ComposedChart
              data={perAssetListens.slice(viewIndexRange[0], viewIndexRange[1])}
            >
              <Legend align="center" verticalAlign="top" />
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop stopColor="#8884d8" stopOpacity={1} />
                  <stop stopColor="#1a1a20" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="assetId" type="category" fontSize={12}>
                <Label value="Asset" dy={10} />
              </XAxis>
              <YAxis dataKey={"total"} type="number">
                <Label value={`Listens`} angle={-90} dx={-10} />
              </YAxis>

              <CartesianGrid strokeDasharray={"3 3 "} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                formatter={(value, name) => [
                  value,
                  capitalize(name.toString()),
                ]}
                active
              />

              <Bar
                dataKey="total"
                barSize={20}
                fill="#413ea0"
                onClick={(data) => {
                  redirect(
                    `list`,
                    `listenEvents?filter={"asset_id":${data.assetId}}`
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      <Box px={8} pr={3} py={4}>
        <Slider
          value={viewIndexRange}
          onChange={(e, value) => setViewIndexRange(value as number[])}
          valueLabelDisplay="off"
          min={0}
          max={perAssetListens.length}
          step={1}
        />
      </Box>
    </>
  );
};

export default AssetListensChart;
