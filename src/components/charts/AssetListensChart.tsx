/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
    Card,
    CardContent,
    CardHeader,
    Slider,
    Typography,
} from "@mui/material";
import { capitalize, uniqBy } from "lodash";
import React, { useEffect, useMemo, useState } from "react";
import { GetListResult, useRedirect } from "react-admin";
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
import { IAsset } from "types/asset";
import { IListenEvent } from "types/listenEvents";
import { CenteredLoading } from "../Layout/Dashboard";

interface Props {
    assets: GetListResult<IAsset> | null;
    listenEvents: GetListResult<IListenEvent>;
}

type BarChartData = {
    assetId: number;
    total: number;
};

const AssetListensChart = ({ assets, listenEvents }: Props): JSX.Element => {
    const [assetViewIndex, setAssetViewIndex] = useState([
        0,
        uniqBy(listenEvents.data, "asset_id").length,
    ]);

    const perAssetListens: BarChartData[] = useMemo(() => {
        if (!assets) return [];

        return assets.data
            .map((asset) => ({
                assetId: asset.id,
                total: listenEvents.data.filter(
                    (listen) => listen.asset_id == asset.id
                ).length,
            }))
            .filter((a) => a.total > 0)
            .sort((a) => a.assetId)
            .sort((a, b) => (a.total > b.total ? -1 : 1))
            .slice(assetViewIndex[0], assetViewIndex[1]);
    }, [assets, listenEvents, assetViewIndex]);

    const redirect = useRedirect();

    return (
        <Card>
            <CardHeader
                title={
                    <>
                        <Typography variant="h5" style={{ flexGrow: 1 }}>
                            Asset Listens
                        </Typography>
                    </>
                }
            />

            <CardContent>
                {!perAssetListens ? (
                    <CenteredLoading />
                ) : (
                    <div style={{ width: "100%", height: 300 }}>
                        <ResponsiveContainer>
                            <ComposedChart data={perAssetListens}>
                                <Legend align="center" verticalAlign="top" />
                                <defs>
                                    <linearGradient
                                        id="colorUv"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            stopColor="#8884d8"
                                            stopOpacity={1}
                                        />
                                        <stop
                                            stopColor="#1a1a20"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="assetId"
                                    type="category"
                                    fontSize={12}
                                >
                                    <Label value="Asset" />
                                </XAxis>
                                <YAxis
                                    dataKey={"total"}
                                    type="number"
                                    label={"Listens"}
                                />

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
                {/* slider that shifts asset view index */}
                <Slider
                    value={assetViewIndex}
                    onChange={(e, newValue) =>
                        setAssetViewIndex(newValue as number[])
                    }
                    valueLabelDisplay="auto"
                    aria-labelledby="range-slider"
                    getAriaValueText={(value) => `${value}`}
                    min={0}
                    max={uniqBy(listenEvents.data, "asset_id").length}
                />
            </CardContent>
        </Card>
    );
};

export default AssetListensChart;
