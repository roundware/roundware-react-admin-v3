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
import { addDays, isAfter, isBefore, subDays } from "date-fns";
import React, { useEffect, useState } from "react";
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
import { CenteredLoading } from ".";
import { ResourceList } from "../../../App";
interface Props {
  sessions: GetListResult<RaRecord> | null;
}

export const isWithinRange = (date: Date, range: Date[]): boolean => {
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
    const keyName = s.starttime.toDateString();
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

  const handleOnSelectChange = (value: string | number) => {
    if (!sessions?.data?.length) return;
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
          sessions.data || []
        )[0].starttime,
        new Date(),
      ]);
      return;
    }

    const leastDate = subDays(new Date(), Number(value));
    setRange([leastDate, new Date()]);
  };

  useEffect(() => {
    handleOnSelectChange(30);
  }, [sessions]);

  const [startDate, setStartDate] = useState(
    getSanitizedList(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      sessions?.data || []
    )?.[0]?.starttime || new Date()
  );
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    setRange([startDate, endDate]);
  }, [startDate, endDate]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [skipNoActivity, setSkipNoActivity] = useState(false);
  const [showLine, setShowLine] = useState(false);

  const redirect = useRedirect();

  const handleOnBarClick = (e: { date: string }) => {
    if (ResourceList.includes(`sessions`))
      redirect(
        `list`,
        `sessions?filter=${JSON.stringify({
          start_time__gte: new Date(e?.date).toISOString(),
          start_time__lte: addDays(new Date(e?.date), 1).toISOString(),
        })}`
      );
  };

  return (
    <Card>
      <CardHeader
        title={
          <>
            <Toolbar>
              <Typography variant="h5" style={{ flexGrow: 1 }}>
                Sessions
              </Typography>

              <FormControl style={{ width: 150 }}>
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
            </Toolbar>
            <Toolbar style={{ paddingBottom: 0 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    onChange={(e) => setShowLine(e.target.checked)}
                    value={showLine}
                  />
                }
                label="Show Line"
              />
              {/* 
              <FormControlLabel
                control={
                  <Checkbox
                    onChange={(e) => setSkipNoActivity(e.target.checked)}
                    value={skipNoActivity}
                  />
                }
                label="Skip No Activity"
              /> */}
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
        {!sessions ? (
          <CenteredLoading />
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart
                data={getSessionsPerDay(
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  /* @ts-ignore */
                  sessions.data || [],
                  range
                )}
                height={200}
              >
                <XAxis
                  dataKey="date"
                  type={skipNoActivity ? undefined : "number"}
                  name="Date"
                  scale={skipNoActivity ? undefined : "time"}
                  domain={[`dataMin`, `dataMax`]}
                  allowDataOverflow
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  angle={45}
                  dx={15}
                  dy={20}
                  height={70}
                  minTickGap={0.1}
                >
                  <Label value="Date" />
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
                  labelFormatter={(label: string) =>
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
                  padding={{
                    top: 30,
                  }}
                  tickFormatter={(time) => new Date(time).toLocaleDateString()}
                />

                <Bar
                  dataKey="total"
                  strokeWidth={3}
                  name="Sessions"
                  fill=" #413ea0 "
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

export default SessionsChart;
