/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
    Card,
    CardContent,
    CardHeader,
    Checkbox,
    FormControl,
    FormControlLabel,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    TextFieldProps,
    Toolbar,
    Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import DateRangeSlider from "components/charts/DateRangeSlider";
import { addDays, isAfter, isBefore, subDays } from "date-fns";
import { useChartData } from "hooks/useChartData";
import { capitalize } from "lodash";
import React, { useMemo } from "react";
import { GetListResult, RaRecord } from "react-admin";
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Label,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { CenteredLoading } from "../Layout/Dashboard";

interface Props {
    assets: GetListResult<RaRecord> | null;
}

const mediaTypes: [`audio`, "photo", "text"] = [`audio`, `photo`, `text`];
const colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
type IAsset = {
    id: number;
    created: Date;
    media_type: "audio" | "photo" | "text";
    [index: string]: Date | number | string;
};

type BarChartData = {
    [index in "audio" | "photo" | "text" | "date"]?: number;
} & {
    audio: number;
    photo: number;
    text: number;
    date: number;
    total: number;
};

export const isWithinRange = (date: Date, range: Date[]): boolean => {
    range = range.sort((a, b) => (a > b ? 1 : -1));

    if (
        isAfter(date, subDays(range[0], 1)) &&
        isBefore(date, addDays(range[1], 1))
    )
        return true;

    return false;
};

const getRecordingsPerDay = (assets: RaRecord[], range: Date[]) => {
    const assetsWithDate = getSanitizedList(assets).filter((s) =>
        isWithinRange(s.created, range)
    );

    const chartDataMap = new Map<string, BarChartData>();

    const initialDefaultData: BarChartData = {
        audio: 0,
        text: 0,
        photo: 0,
        total: 0,
        date: 0,
    };
    assetsWithDate.forEach((s) => {
        const keyName = s.created.toDateString();
        let data = chartDataMap.get(keyName);

        if (data === undefined) {
            data = initialDefaultData;
        }
        data = {
            ...data,
            [s?.media_type]: data[s?.media_type] + 1,
        };

        chartDataMap.set(keyName, data);
    });

    const chartData: BarChartData[] = [];

    chartDataMap.forEach((val, key) => {
        chartData.push({
            ...val,
            date: new Date(key).getTime(),
        });
    });

    return chartData.sort((s1, s2) =>
        (s1?.date || 0) > (s2?.date || 0) ? 1 : -1
    );
};

const getSanitizedList = (assets: RaRecord[]): IAsset[] => [
    ...assets
        .filter((a) => ![1].includes(+a.id))
        .map((s) => ({
            media_type: s?.media_type,
            created: new Date(s?.created),
            id: +s?.id,
        }))
        .sort((a, b) => (a.created > b.created ? 1 : -1)),
];

const AssetsChart = ({ assets }: Props): JSX.Element => {
    const {
        rangeDropdownValue,
        handleOnSelectChange,
        setShowLine,
        dropdownRange,
        setRange,
        range,
        showLine,
        customRange,
        handleOnBarClick,
        setStartDate,
        setEndDate,
        endDate,
        startDate,
        perDateData,
    } = useChartData<IAsset>(
        assets?.data || [],
        getSanitizedList,
        "created",
        getRecordingsPerDay,
        "assets"
    );

    const totals = useMemo(() => {
        const totals = {
            audio: 0,
            text: 0,
            photo: 0,
        };

        perDateData.forEach((s) => {
            mediaTypes.forEach((t) => {
                totals[t] += s[t];
            });
        });

        return totals;
    }, [perDateData]);

    return (
        <Card>
            <CardHeader
                title={
                    <>
                        <Toolbar>
                            <Typography variant="h5" style={{ flexGrow: 1 }}>
                                Assets
                            </Typography>

                            <div>
                                <FormControl style={{ width: 150 }}>
                                    <InputLabel>Range</InputLabel>
                                    <Select
                                        value={rangeDropdownValue}
                                        onChange={(e) =>
                                            handleOnSelectChange(e.target.value)
                                        }
                                        label="Range"
                                    >
                                        <MenuItem value={7}>
                                            Last 7 Days
                                        </MenuItem>
                                        <MenuItem value={30}>
                                            Last 30 Days
                                        </MenuItem>
                                        <MenuItem value={365}>
                                            Last Year
                                        </MenuItem>
                                        <MenuItem value="total">Total</MenuItem>
                                        <MenuItem value="custom">
                                            Custom Range
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </div>
                        </Toolbar>
                        <Toolbar>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        onChange={(e) =>
                                            setShowLine(e.target.checked)
                                        }
                                        checked={showLine}
                                    />
                                }
                                label="Show Line"
                            />
                            {/* <div>
                <ResponsiveContainer>
                  <Legend
                    align="right"
                    verticalAlign="top"
                    payload={mediaTypes?.map((m, i) => ({
                      value: m + ` (${totals[m]})`,
                      id: `ID${i}`,
                      type: `rect`,
                      color: colors[i],
                    }))}
                  />
                </ResponsiveContainer>
              </div> */}
                        </Toolbar>
                    </>
                }
            />

            <CardContent>
                {customRange && (
                    <>
                        <Grid
                            container
                            justifyContent="center"
                            spacing={2}
                            style={{ marginBottom: 16 }}
                        >
                            <Grid item xs={5}>
                                <DatePicker
                                    label="Start Date"
                                    value={startDate}
                                    views={["year", "month", "day"]}
                                    onChange={(date) => {
                                        if (date) setStartDate(date);
                                    }}
                                    renderInput={(props: TextFieldProps) => (
                                        <TextField {...props} />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={5}>
                                <DatePicker
                                    label="End Date"
                                    value={endDate}
                                    onChange={(date) => {
                                        if (date) setEndDate(date);
                                    }}
                                    renderInput={(props: TextFieldProps) => (
                                        <TextField {...props} />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </>
                )}
                {!assets ? (
                    <CenteredLoading />
                ) : (
                    <div style={{ width: "100%", height: 300 }}>
                        <ResponsiveContainer>
                            <ComposedChart data={perDateData}>
                                <Legend
                                    align="center"
                                    verticalAlign="top"
                                    // @ts-ignore
                                    payload={mediaTypes
                                        .map((m, i) => ({
                                            value: m + ` (${totals[m]})`,
                                            id: `ID${i}`,

                                            type: "rect",
                                            color: colors[i],
                                        }))
                                        .concat({
                                            value: `Total (${
                                                totals.audio +
                                                totals.text +
                                                totals.photo
                                            })`,
                                            id: `IDtotal`,
                                            type: "rect",
                                            color: colors[3],
                                        })}
                                />
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
                                    dataKey="date"
                                    type="number"
                                    name="Date"
                                    scale="time"
                                    domain={["dataMin + 10", "dataMax + 10"]}
                                    tickFormatter={(date) =>
                                        new Date(date).toLocaleDateString()
                                    }
                                    angle={45}
                                    dx={15}
                                    dy={20}
                                    height={70}
                                    minTickGap={0.5}
                                    fontSize={12}
                                    allowDataOverflow
                                >
                                    <Label value="Day" />
                                </XAxis>
                                <YAxis domain={[0, "dataMax + 5"]} />
                                {mediaTypes?.map((m, index) => (
                                    <Bar
                                        dataKey={m}
                                        fill={colors[index]}
                                        key={m}
                                        stackId="a"
                                        onClick={handleOnBarClick}
                                        maxBarSize={30}
                                    />
                                ))}
                                <CartesianGrid strokeDasharray={"3 3 "} />
                                <Tooltip
                                    cursor={{ strokeDasharray: "3 3" }}
                                    formatter={(value, name) => [
                                        value,
                                        capitalize(name.toString()),
                                    ]}
                                    labelFormatter={(label: any) =>
                                        new Date(label).toLocaleDateString()
                                    }
                                    active
                                />

                                {showLine && (
                                    <>
                                        <Line
                                            type="monotone"
                                            dataKey={(e) => {
                                                return (
                                                    e.audio + e.text + e.photo
                                                );
                                            }}
                                            tooltipType="none"
                                            stroke="#ff7300"
                                            name="Total"
                                        />
                                    </>
                                )}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                )}
                {!!assets?.data?.length && (
                    <DateRangeSlider
                        value={range}
                        onChange={setRange}
                        min={dropdownRange[0].getTime()}
                        max={dropdownRange[1].getTime()}
                    />
                )}
            </CardContent>
        </Card>
    );
};

export default AssetsChart;
