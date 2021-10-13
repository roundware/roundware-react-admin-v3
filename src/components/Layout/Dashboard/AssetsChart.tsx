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
  FormControlLabel,
  Checkbox,
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

interface Props {
  assets: GetListResult<Record>;
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

const getRecordingsPerDay = (
  assets: { id: number; created: string }[],
  range: Date[]
) => {
  const assetsWithDate = getSanitizedList(assets).filter((s) =>
    isWithinRange(s.created, range)
  );

  const chartDataMap = new Map<string, number>();

  assetsWithDate.forEach((s) => {
    let keyName = s.created.toDateString();
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
  assets: { id: number; created: string }[]
): { created: Date; id: number }[] => [
  ...assets
    .filter((a) => ![1].includes(a.id))
    .map((s) => ({ created: new Date(s?.created), id: s?.id }))
    .sort((a, b) => (a.created > b.created ? 1 : -1)),
];

const AssetsChart = ({ assets }: Props) => {
  const [customRange, setCustomRange] = useState(false);
  const [range, setRange] = useState([new Date(), new Date()]);

  const handleOnSelectChange = (value: string) => {
    if (!assets?.data?.length) return;
    if (value === "custom") {
      setCustomRange(true);
      return;
    }
    setCustomRange(false);

    if (value === "total") {
      setRange([
        getSanitizedList(
          // @ts-ignore
          assets.data
        )[0].created,
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
      assets.data
    )?.[0]?.created || new Date()
  );
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    setRange([startDate, endDate]);
  }, [startDate, endDate]);
  const [showLine, setShowLine] = useState(false);

  const redirect = useRedirect();

  const handleOnBarClick = (e: any) => {
    redirect(
      `list`,
      `assets?filter=${JSON.stringify({
        created__gte: new Date(e?.date).toISOString(),
        created__lte: addDays(new Date(e?.date), 1).toISOString(),
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
                Recordings
              </Typography>

              <div>
                <FormControl style={{ width: 120 }}>
                  <InputLabel>Range</InputLabel>
                  <Select
                    defaultValue="total"
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
            <Toolbar>
              <FormControlLabel
                control={
                  <Checkbox
                    onChange={(e) => setShowLine(e.target.checked)}
                    checked={showLine}
                  />
                }
                label="Show Line"
              />
            </Toolbar>
          </>
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
          <ResponsiveContainer>
            <ComposedChart
              data={getRecordingsPerDay(
                /* @ts-ignore */
                assets.data,
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
              >
                <Label value="Day" offset={0} position="insideBottom" />
              </XAxis>
              <YAxis dataKey="total" name="Recordings"></YAxis>
              <CartesianGrid strokeDasharray="3 3" />

              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                formatter={(value: number) => `${value} Recordings`}
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
              <Bar dataKey="total" fill="#8884d8" onClick={handleOnBarClick} />
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
      </CardContent>
    </Card>
  );
};

export default AssetsChart;
