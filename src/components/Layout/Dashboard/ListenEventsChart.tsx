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
import { addDays, isAfter, isBefore, subDays } from "date-fns";
import React, { useEffect, useMemo, useState } from "react";
import { GetListResult, RaRecord, useRedirect } from "react-admin";
import {
  Bar,
  Brush,
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

import { DatePicker } from "@mui/x-date-pickers";
import { CenteredLoading } from ".";
import { ResourceList } from "../../../App";
import { useChartData } from "hooks/useChartData";
import DateRangeSlider from "components/charts/DateRangeSlider";
interface Props {
  events: GetListResult<RaRecord> | null;
}

export const isWithinRange = (date: Date, range: Date[]) => {
  range = range.sort((a, b) => (a > b ? 1 : -1));

  if (
    isAfter(date, subDays(range[0], 1)) &&
    isBefore(date, addDays(range[1], 1))
  )
    return true;

  return false;
};

const getListensPerDay = (events: RaRecord[], range: Date[]) => {
  const eventsWithDate = getSanitizedList(events).filter((s) =>
    isWithinRange(s.start_time, range)
  );

  const chartDataMap = new Map<string, number>();

  eventsWithDate.forEach((s) => {
    const keyName = s.start_time.toDateString();
    let total = chartDataMap.get(keyName);
    if (total === undefined) total = 1;
    else total += 1;
    chartDataMap.set(keyName, total);
  });

  const chartData: { date: number; total: number }[] = [];

  chartDataMap.forEach((val, key) => {
    chartData.push({
      date: new Date(key).getTime(),
      total: val,
    });
  });

  return chartData.sort((s1, s2) => (s1.date > s2.date ? 1 : -1));
};

type SanitizedListenEvent = {
  start_time: Date;
  id: number;
};

const getSanitizedList = (events: RaRecord[]): SanitizedListenEvent[] => [
  ...events
    .map((s) => ({ start_time: new Date(s?.start_time), id: +s?.id }))
    .sort((a, b) => (a.start_time > b.start_time ? 1 : -1)),
];

const ListenEventsChart = ({ events }: Props) => {
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
  } = useChartData<SanitizedListenEvent>(
    events?.data || [],
    getSanitizedList,
    "start_time",
    getListensPerDay,
    "listenevents"
  );

  return (
    <Card>
      <CardHeader
        title={
          <Toolbar>
            <Typography variant="h5" style={{ flexGrow: 1 }}>
              Listens
            </Typography>

            <div>
              <FormControlLabel
                control={
                  <Checkbox
                    value={showLine}
                    onChange={(e) => setShowLine(e?.target?.checked)}
                  />
                }
                label="Show Line"
              />
              <FormControl style={{ width: 150 }}>
                <InputLabel>Range</InputLabel>
                <Select
                  value={rangeDropdownValue}
                  onChange={(e) => handleOnSelectChange(e?.target?.value)}
                  label="Range"
                >
                  <MenuItem value={7}>Last 7 Days</MenuItem>
                  <MenuItem value={30}>Last 30 Days</MenuItem>
                  <MenuItem value={365}>Last Year</MenuItem>
                  <MenuItem value="total">Total</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
            </div>
          </Toolbar>
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
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    setStartDate(date);
                  }}
                  renderInput={(p: TextFieldProps) => <TextField {...p} />}
                />
              </Grid>
              <Grid item xs={5}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(date) => {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    setEndDate(date);
                  }}
                  renderInput={(p: TextFieldProps) => <TextField {...p} />}
                />
              </Grid>
            </Grid>
          </>
        )}
        {!events ? (
          <CenteredLoading />
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart data={perDateData} height={200}>
                <XAxis
                  dataKey="date"
                  type="number"
                  name="Date"
                  scale="time"
                  domain={["dataMin ", "dataMax"]}
                  allowDataOverflow
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  angle={45}
                  dx={15}
                  dy={20}
                  height={70}
                  minTickGap={0.1}
                ></XAxis>
                <YAxis
                  domain={[0, "dataMax + 5"]}
                  type="number"
                  dataKey={"total"}
                  name="Listens"
                >
                  <Label
                    value="Number of Listens"
                    offset={-5}
                    angle={-90}
                    position="inside"
                  />
                </YAxis>
                <CartesianGrid strokeDasharray="3 3" />

                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value) => [value, `Listens`]}
                  labelFormatter={(label: number) =>
                    new Date(label).toLocaleDateString()
                  }
                  active
                />
                <Legend
                  align="center"
                  verticalAlign="top"
                  height={36}
                  payload={[
                    {
                      value: `Listens (${perDateData.reduce(
                        (acc, l) => acc + l.total,
                        0
                      )})`,
                      type: "rect",
                      color: "#8884d8",
                    },
                  ]}
                />

                {/* <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#8884d8" stopOpacity={1} />
                    <stop stopColor="#1a1a20" stopOpacity={0} />
                  </linearGradient>
                </defs> */}

                <Bar
                  dataKey="total"
                  fill="#413ea0"
                  name="Listens"
                  onClick={handleOnBarClick}
                  maxBarSize={30}
                  strokeWidth={3}
                />
                {showLine && (
                  <Line
                    type="monotone"
                    dataKey="total"
                    tooltipType="none"
                    stroke="#ff7300"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {!!events?.data?.length && (
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

export default ListenEventsChart;
