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
import React from "react";
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
type SanitizedSession = {
  id: number;
  starttime: Date;
  [index: string]: number | Date;
};
const getSessionsPerDay = (sessions: RaRecord[], range: Date[]) => {
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

const getSanitizedList = (sessions: RaRecord[]): SanitizedSession[] => [
  ...sessions
    .filter((s) => ![1, 2].includes(+s.id))
    .map((s) => ({ starttime: new Date(s?.starttime), id: +s?.id }))
    .sort((a, b) => (a.starttime > b.starttime ? 1 : -1)),
];

const SessionsChart = ({ sessions }: Props) => {
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
  } = useChartData<SanitizedSession>(
    sessions?.data || [],
    getSanitizedList,
    "starttime",
    getSessionsPerDay,
    "sessions"
  );

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
                    if (date) setStartDate(date);
                  }}
                  renderInput={(p: TextFieldProps) => <TextField {...p} />}
                />
              </Grid>
              <Grid item xs={5}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(date) => {
                    if (date) setEndDate(date);
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
              <ComposedChart data={perDateData} height={200}>
                <XAxis
                  dataKey="date"
                  type={"number"}
                  name="Date"
                  scale={"time"}
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
                <YAxis
                  dataKey="total"
                  name="Sessions"
                  domain={[0, "dataMax + 5"]}
                >
                  <Label
                    value="Number of Sessions"
                    offset={-5}
                    angle={-90}
                    position="inside"
                  />
                </YAxis>
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip
                  formatter={(value) => [value, `Sessions`]}
                  labelFormatter={(label: string) =>
                    new Date(label).toLocaleDateString()
                  }
                  active={true}
                />
                <Legend
                  verticalAlign="top"
                  height={30}
                  payload={[
                    {
                      value: `Sessions (${perDateData.reduce(
                        (acc, el) => acc + el.total,
                        0
                      )})`,
                      type: "rect",
                      color: "#8884d8",
                    },
                  ]}
                />

                <Bar
                  dataKey="total"
                  strokeWidth={3}
                  name="Sessions"
                  fill=" #413ea0 "
                  onClick={handleOnBarClick}
                  maxBarSize={50}
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
        {!!sessions?.data?.length && (
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

export default SessionsChart;
