import {
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Collapse,
  FormControlLabel,
  LinearProgress,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { addDays, subDays } from "date-fns";
import React, { useEffect, useMemo, useState } from "react";
import { RaRecord, useRedirect } from "react-admin";
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

import History from "@mui/icons-material/History";
import { LoadingButton } from "@mui/lab";
import { ResourceList } from "App";
import AssetListensChart from "components/charts/AssetListensChart";
import DateRangeSlider from "components/charts/DateRangeSlider";
import { useProjects } from "context/ProjectsContext";
import useBoolean from "hooks/useBoolean";
import { apiFetcher } from "roundwareDataProvider/tokenAuthProvider";
import { IListenEvent } from "types/listenEvents";
import { DateRange, isWithinRange } from "utils";
import { CenteredLoading } from "../Layout/Dashboard";

const getListensPerDay = (events: RaRecord[], range?: Date[]) => {
  const eventsWithDate = getSanitizedList(events).filter((s) =>
    range ? isWithinRange(s.start_time, range) : true
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

const PAGE_SIZE = 500;
async function fetchListenEvents({
  pageParam = 1,
  startDate,
  endDate,
  projectId,
  pageSize,
}: {
  pageParam?: number;
  startDate: Date;
  endDate: Date;
  projectId: number;
  pageSize?: number;
}) {
  const res = await apiFetcher(
    `/listenevents?page=${pageParam}&paginate=true&page_size=${
      pageSize || PAGE_SIZE
    }&start_time__gte=${startDate.toISOString()}&start_time__lte=${endDate.toISOString()}&admin=1&project_id=${projectId}`
  );

  return res?.json as {
    count: number;
    next: string;
    previous: string;
    results: IListenEvent[];
  };
}

const INITIAL_RANGE = [subDays(new Date(), 120), new Date()] as DateRange;

const ListenEventsChart = () => {
  const [viewRange, setViewRange] = useState<DateRange>(INITIAL_RANGE);
  const project = useProjects();

  const [range, setRange] = useState(INITIAL_RANGE);
  const [allFetchedData, setAllFetchedData] = useState([] as IListenEvent[]);

  const [percentage, setPercentage] = useState(0);

  async function fetchForRange(inputRange: DateRange) {
    setPercentage(0);
    // determine extra range to fetch from backward;
    const start = inputRange[0];
    const end = inputRange[1];

    // determine how many are there; by doing a call;
    const res = await fetchListenEvents({
      pageParam: 1,
      startDate: start,
      endDate: end,
      projectId: project?.selectedProject?.id || 0,
    });

    setAllFetchedData((prev) => [...prev, ...res.results]);

    const total = res.count;

    // do we need to fetch more?
    if (res.results.length == total) {
      // no;
      return res.results;
    }

    // yes;
    const totalRemainingToFetch = total - res.results.length;
    const pagesToFetch = Math.ceil(totalRemainingToFetch / PAGE_SIZE);
    setPercentage((1 / (pagesToFetch + 1)) * 100);

    const promises = [];

    for (let i = 0; i <= pagesToFetch; i++) {
      promises.push(
        fetchListenEvents({
          pageParam: i + 2,
          startDate: start,
          endDate: end,
          projectId: project?.selectedProject?.id || 0,
        })
          .then((res) => {
            if (res?.results?.length) {
              setAllFetchedData((prev) => [...prev, ...res.results]);
            }
          })
          .catch(() => ({
            results: [],
          }))
          .finally(() => {
            setPercentage((prev) => {
              const newPercentage = prev + (1 / (pagesToFetch + 1)) * 100;
              if (newPercentage > 100) return 100;
              return newPercentage;
            });
          })
      );
    }
    await Promise.all(promises);
  }

  const loading = useBoolean(false);

  const [fetchingMoreValue, setFetchingMoreValue] = useState("");

  useEffect(() => {
    loading.setTrue();
    fetchForRange(INITIAL_RANGE).then(() => {
      // setAllFetchedData(data);
      loading.setFalse();
    });
  }, []);

  const perDateData = useMemo(() => {
    return getListensPerDay(allFetchedData);
  }, [allFetchedData]);

  const minDate = useMemo(() => {
    if (!perDateData.length) return new Date();
    return new Date(perDateData[0].date);
  }, [perDateData]);

  const maxDate = useMemo(() => {
    if (!perDateData.length) return new Date();
    return new Date(perDateData[perDateData.length - 1].date);
  }, [perDateData]);

  useEffect(() => {
    setViewRange([minDate, maxDate]);
  }, [minDate, maxDate]);

  const viewData = useMemo(() => {
    if (!perDateData) return [];
    return perDateData.filter((s) =>
      isWithinRange(new Date(s.date), viewRange)
    );
  }, [perDateData, viewRange]);

  const showLine = useBoolean();

  const redirect = useRedirect();
  const handleOnBarClick = (data: { date: number }) => {
    if (ResourceList.includes(`listenevents`))
      redirect(
        `list`,
        `listenevents?filter=${JSON.stringify({
          [`start_time__gte`]: new Date(data?.date).toISOString(),
          [`start_time__lte`]: addDays(new Date(data?.date), 1).toISOString(),
        })}`
      );
  };

  return (
    <Card>
      <CardHeader
        title={
          <Toolbar>
            <Typography variant="h5" style={{ flexGrow: 1 }}>
              Total Listens by Date
            </Typography>

            <div>
              <FormControlLabel
                control={
                  <Checkbox
                    value={showLine.value}
                    onChange={(e) => showLine.setValue(e.target.checked)}
                  />
                }
                label="Show Line"
              />
              {/* <FormControl style={{ width: 150 }}>
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
              </FormControl> */}
            </div>
          </Toolbar>
        }
      />

      <CardContent>
        {/* {customRange && (
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
        )} */}
        {loading.value ? (
          <CenteredLoading />
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart data={viewData} height={200}>
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
                      value: `Listens (${viewData.reduce(
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
                {showLine.value && (
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

        <Stack spacing={2} justifyContent="center">
          <Stack mt={4}>
            <Typography
              variant="subtitle2"
              align="center"
              color="text.secondary"
            >
              Fetch Previous
            </Typography>
            <Stack direction={"row-reverse"} justifyContent="center">
              {[
                {
                  valueDays: 30,
                  label: "1 Month",
                },
                {
                  valueDays: 90,
                  label: "3 Months",
                },
                {
                  valueDays: 180,
                  label: "6 Months",
                },
              ].map(({ valueDays, label }) => (
                <LoadingButton
                  startIcon={<History />}
                  key={valueDays}
                  onClick={() => {
                    setFetchingMoreValue(label);
                    fetchForRange([
                      subDays(range[0], valueDays),
                      range[0],
                    ]).then(() => {
                      setRange([subDays(range[0], valueDays), range[1]]);
                      setFetchingMoreValue("");
                    });
                  }}
                  loading={fetchingMoreValue === label}
                >
                  {label}
                </LoadingButton>
              ))}
            </Stack>

            <Collapse in={fetchingMoreValue !== ""}>
              <Stack
                width="500px"
                margin="0 auto"
                justifyContent={"center"}
                alignItems={"center"}
              >
                <Typography variant="subtitle2" align="center">
                  Progress {percentage.toFixed(2)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  sx={{
                    width: "100%",
                  }}
                  value={percentage}
                />
              </Stack>
            </Collapse>
          </Stack>
        </Stack>

        {!!allFetchedData && (
          <DateRangeSlider
            value={viewRange}
            onChange={setViewRange}
            min={minDate.getTime()}
            max={maxDate.getTime()}
          />
        )}

        <AssetListensChart
          listenEvents={allFetchedData}
          viewRange={viewRange}
        />
      </CardContent>
    </Card>
  );
};

export default ListenEventsChart;
