import React, { useState, useEffect } from "react";
import { GetListResult, Record, useRedirect } from "react-admin";
import {
  Card,
  CardHeader,
  CardContent,
  Toolbar,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  Typography,
  Grid,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@material-ui/core";
import {
  format,
  subDays,
  addDays,
  isBefore,
  isAfter,
  differenceInCalendarDays,
} from "date-fns";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Label,
  Bar,
  Line,
  Brush,
} from "recharts";

import {
  DatePicker,
  TimePicker,
  DateTimePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";
import { ResourceList } from "../../../App";
import { CenteredLoading } from ".";
interface Props {
  events: GetListResult<Record> | null;
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

const getListensPerDay = (
  events: { id: number; start_time: string }[],
  range: Date[]
) => {
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

const getSanitizedList = (
  events: { id: number; start_time: string }[]
): { start_time: Date; id: number }[] => [
  ...events
    .map((s) => ({ start_time: new Date(s?.start_time), id: s?.id }))
    .sort((a, b) => (a.start_time > b.start_time ? 1 : -1)),
];

const ListenEventsChart = ({ events }: Props) => {
  const [customRange, setCustomRange] = useState(false);
  const [range, setRange] = useState([new Date(), new Date()]);

  const handleOnSelectChange = (value: string | number) => {
    if (!events?.data?.length) return;
    if (value === "custom") {
      setCustomRange(true);
      return;
    }
    setCustomRange(false);

    if (value === "total") {
      setRange([
        getSanitizedList(
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          events?.data
        )[0].start_time,
        new Date(),
      ]);
      return;
    }

    const leastDate = subDays(new Date(), Number(value));
    setRange([leastDate, new Date()]);
    // console.log(range);
  };

  useEffect(() => {
    handleOnSelectChange(30);
  }, [events]);

  const [startDate, setStartDate] = useState(
    getSanitizedList(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      events?.data || []
    )?.[0]?.start_time || new Date()
  );
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    setRange([startDate, endDate]);
  }, [startDate, endDate]);

  const [showLine, setShowLine] = useState(false);

  const redirect = useRedirect();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOnBarClick = (e: any) => {
    if (ResourceList?.includes(`listenevents`))
      redirect(
        `list`,
        `listenevents?filter=${JSON.stringify({
          start_time__gte: new Date(e?.date).toISOString(),
          start_time__lte: addDays(new Date(e?.date), 1).toISOString(),
        })}`
      );
  };
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
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    //   @ts-ignore
                    defaultValue={showLine}
                    onChange={(e) => setShowLine(e?.target?.checked)}
                  />
                }
                label="Show Line"
              />
              <FormControl style={{ width: 120 }}>
                <InputLabel>Range</InputLabel>
                <Select
                  defaultValue={30}
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  onChange={(e) => handleOnSelectChange(e?.target?.value)}
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
              justify="center"
              spacing={2}
              style={{ marginBottom: 16 }}
            >
              <Grid item xs={5}>
                <DatePicker
                  label="Start Date"
                  variant="inline"
                  inputVariant="outlined"
                  value={startDate}
                  views={["year", "month", "date"]}
                  onChange={(date) => {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    setStartDate(date);
                  }}
                />
              </Grid>
              <Grid item xs={5}>
                <DatePicker
                  label="End Date"
                  variant="inline"
                  inputVariant="outlined"
                  value={endDate}
                  onChange={(date) => {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    setEndDate(date);
                  }}
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
              <ComposedChart
                data={getListensPerDay(
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  /* @ts-ignore */
                  events.data,
                  range
                )}
              >
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#8884d8" stopOpacity={1} />
                    <stop stopColor="#1a1a20" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  type="number"
                  name="Date"
                  scale="time"
                  domain={["dataMin", "dataMax"]}
                  allowDataOverflow
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  angle={45}
                  dx={15}
                  dy={20}
                  height={70}
                  minTickGap={0.5}
                >
                  <Label value="Day" offset={0} position="insideBottom" />
                </XAxis>
                <YAxis dataKey="total" name="Listens"></YAxis>
                <CartesianGrid strokeDasharray="3 3" />

                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value: number) => `${value} Listens`}
                  labelFormatter={(label: any) =>
                    new Date(label).toLocaleDateString()
                  }
                  active
                />
                <Brush
                  dataKey="date"
                  stroke=" #413ea0 "
                  tickFormatter={(time) => new Date(time).toLocaleDateString()}
                />
                <Bar
                  dataKey="total"
                  fill="#413ea0"
                  onClick={handleOnBarClick}
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
      </CardContent>
    </Card>
  );
};

export default ListenEventsChart;
