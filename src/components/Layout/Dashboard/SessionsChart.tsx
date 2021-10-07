import React, { useState, useEffect } from "react";
import { GetListResult, Record } from "react-admin";
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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Label,
  Legend,
  BarChart,
  Bar,
  ReferenceLine,
  Brush,
  ComposedChart,
} from "recharts";

import {
  DatePicker,
  TimePicker,
  DateTimePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";

interface Props {
  sessions: GetListResult<Record>;
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

const getSessionsPerDay = (
  sessions: { id: number; starttime: string }[],
  range: Date[]
) => {
  const sessionsWithDate = getSanitizedList(sessions).filter((s) =>
    isWithinRange(s.starttime, range)
  );

  const chartDataMap = new Map<string, number>();

  sessionsWithDate.forEach((s) => {
    let keyName = s.starttime.toDateString();
    let total = chartDataMap.get(keyName);
    if (total === undefined) total = 1;
    else total += 1;
    chartDataMap.set(keyName, total);
  });

  let chartData: { date: number; total: number }[] = [];

  chartDataMap.forEach((val, key) => {
    chartData.push({
      date: new Date(key).getTime(),
      total: val,
    });
  });

  return chartData.sort((s1, s2) => (s1.date > s2.date ? 1 : -1));
};

const getSanitizedList = (
  sessions: { id: number; starttime: string }[]
): { starttime: Date; id: number }[] => [
  ...sessions
    .filter((s) => ![1, 2].includes(s.id))
    .map((s) => ({ starttime: new Date(s?.starttime), id: s?.id }))
    .sort((a, b) => (a.starttime > b.starttime ? 1 : -1)),
];

const SessionsChart = ({ sessions }: Props) => {
  const [customRange, setCustomRange] = useState(false);
  const [range, setRange] = useState([new Date(), new Date()]);

  const handleOnSelectChange = (value: string) => {
    if (!sessions?.data?.length) return;
    if (value === "custom") {
      setCustomRange(true);
      return;
    }
    setCustomRange(false);

    if (value === "total") {
      setRange([
        getSanitizedList(
          // @ts-ignore
          sessions.data || []
        )[0].starttime,
        new Date(),
      ]);
      return;
    }

    const leastDate = subDays(new Date(), Number(value));
    setRange([leastDate, new Date()]);
    // console.log(range);
  };

  useEffect(() => {
    handleOnSelectChange(`total`);
  }, []);

  const [startDate, setStartDate] = useState(
    getSanitizedList(
      // @ts-ignore
      sessions.data || []
    )?.[0]?.starttime || new Date()
  );
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    setRange([startDate, endDate]);
  }, [startDate, endDate]);

  return (
    <Card>
      <CardHeader
        title={
          <Toolbar>
            <Typography variant="h5" style={{ flexGrow: 1 }}>
              Sessions
            </Typography>

            <div>
              <FormControl style={{ width: 150 }}>
                <InputLabel>Range</InputLabel>
                <Select
                  defaultValue={7}
                  // @ts-ignore
                  onChange={(e) => handleOnSelectChange(e!.target!.value)}
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
                    // @ts-ignore
                    setEndDate(date);
                  }}
                />
              </Grid>
            </Grid>
          </>
        )}
        <div style={{ width: "100%", height: 300 }}>
          here the X-axis is like a timeline with equal intervals. It includes
          the days with 0 sessions too. Thats why most of the space is empty.
          For other example see graph below which excludes the empty days.
          <ResponsiveContainer>
            <BarChart
              data={getSessionsPerDay(
                /* @ts-ignore */
                sessions.data || [],
                range
              )}
            >
              {/* <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor=" #413ea0 " stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#1a1a20" stopOpacity={0} />
                </linearGradient>
              </defs> */}
              <XAxis
                dataKey="date"
                type="number"
                name="Date"
                scale="time"
                interval={0}
                domain={[`dataMin`, `dataMax`]}
                allowDataOverflow
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              >
                <Label value="Day" offset={0} position="insideBottom" />
              </XAxis>
              <YAxis dataKey="total" name="Sessions">
                <Label
                  value="Number of Sessions"
                  offset={-5}
                  angle={-90}
                  position="inside"
                />
              </YAxis>
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip
                formatter={(value: number) => `${value} Sessions`}
                labelFormatter={(label: any) =>
                  new Date(label).toLocaleDateString()
                }
                active={true}
              />
              <Legend verticalAlign="top" height={30} />
              <Brush
                dataKey="date"
                stroke=" #413ea0 "
                type="number"
                scale="time"
                tickFormatter={(time) => new Date(time).toLocaleDateString()}
              />
              <Bar
                dataKey="total"
                strokeWidth={3}
                name="Sessions"
                fill=" #413ea0 "
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            width: "100%",
            height: 300,
            marginTop: 200,
            marginBottom: 50,
          }}
        >
          Bar Chart with empty days skipped. Set range to total
          <ResponsiveContainer>
            <BarChart
              data={getSessionsPerDay(
                /* @ts-ignore */
                sessions.data || [],
                range
              )}
            >
              {/* <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor=" #413ea0 " stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#1a1a20" stopOpacity={0} />
                </linearGradient>
              </defs> */}
              <XAxis
                dataKey="date"
                // type="number"
                name="Date"
                // interval={0}
                // domain={[range[0].getTime(), range[1].getTime()]}
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              >
                <Label value="Day" offset={0} position="insideBottom" />
              </XAxis>
              <YAxis dataKey="total" name="Sessions">
                <Label
                  value="Number of Sessions"
                  offset={-5}
                  angle={-90}
                  position="inside"
                />
              </YAxis>
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip
                formatter={(value: number) => `${value} Sessions`}
                labelFormatter={(label: any) =>
                  new Date(label).toLocaleDateString()
                }
                active={true}
              />
              <Legend verticalAlign="top" height={30} />
              <Brush
                dataKey="date"
                stroke=" #413ea0 "
                tickFormatter={(time) => new Date(time).toLocaleDateString()}
              />
              <Bar dataKey="total" name="Sessions" fill=" #413ea0 " />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionsChart;
