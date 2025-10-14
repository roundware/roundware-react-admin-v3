import {
    Card,
    CardContent,
    CardHeader,
    Toolbar,
    Typography,
} from "@mui/material";
import { addDays } from "date-fns";
import React, { useEffect, useMemo, useState } from "react";
import { RaRecord, useRedirect } from "react-admin";
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
import { ResourceList } from "../../App";
import { useProjects } from "../../context/ProjectsContext";
import useBoolean from "../../hooks/useBoolean";
import { apiFetcher } from "../../roundwareDataProvider/tokenAuthProvider";
import { ISession } from "../../types/session";
import { DateRange, isWithinRange } from "../../utils.tsx";
import { CenteredLoading } from "../Layout/Dashboard";
import { useChartsData } from "./ChartsData";
import DateRangeSlider from "./DateRangeSlider";

type SanitizedSession = {
  id: number;
  starttime: Date;
  [index: string]: number | Date;
};
const getSessionsPerDay = (sessions: RaRecord[]) => {
  const sessionsWithDate = getSanitizedList(sessions);

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

async function fetchSessions({
  startDate,
  endDate,
  projectId,
}: {
  startDate: Date;
  endDate: Date;
  projectId: number;
}) {
  const res = await apiFetcher(
    `/sessions?starttime__gte=${startDate.toISOString()}&starttime__lte=${endDate.toISOString()}&admin=1&project_id=${projectId}`
  );

  return res?.json as ISession[];
}

const SessionsChart = () => {
  const {
    sessionsAllFetchedRange,
    // setSessionsAllFetchedRange,
    sessions,
    setSessions,
  } = useChartsData();

  const [viewRange, setViewRange] = useState<DateRange>(
    sessionsAllFetchedRange
  );

  const project = useProjects();

  async function fetchForRange(inputRange: DateRange) {
    // determine extra range to fetch from backward;
    const start = inputRange[0];
    const end = inputRange[1];

    // determine how many are there; by doing a call;
    const res = await fetchSessions({
      startDate: start,
      endDate: end,
      projectId: project?.selectedProject?.id || 0,
    });

    setSessions((prev) => [...prev, ...res]);
  }

  const loading = useBoolean(false);

  // const [fetchingMoreValue, setFetchingMoreValue] = useState("");

  useEffect(() => {
    loading.setTrue();
    fetchForRange(viewRange).then(() => {
      loading.setFalse();
    });
  }, []);

  const perDateData = useMemo(() => {
    return getSessionsPerDay(sessions);
  }, [sessions]);

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

  const redirect = useRedirect();
  const handleOnBarClick = (data: { date: number }) => {
    if (ResourceList.includes(`listenevents`))
      redirect(
        `list`,
        `sessions?filter=${JSON.stringify({
          [`starttime__gte`]: new Date(data?.date).toISOString(),
          [`starttime__lte`]: addDays(new Date(data?.date), 1).toISOString(),
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
            </Toolbar>
            <Toolbar style={{ paddingBottom: 0 }}>
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
        {loading.value ? (
          <CenteredLoading />
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart data={viewData} height={200}>
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
                      value: `Sessions (${viewData.reduce(
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
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        {/* <Stack spacing={2} justifyContent="center">
          <Stack mt={4}>
            <Typography
              variant="subtitle2"
              align="center"
              color="text.secondary"
            >
              Fetch Earlier Listening Data
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
                      subDays(sessionsAllFetchedRange[0], valueDays),
                      sessionsAllFetchedRange[0],
                    ]).then(() => {
                      setSessionsAllFetchedRange([
                        subDays(sessionsAllFetchedRange[0], valueDays),
                        sessionsAllFetchedRange[1],
                      ]);
                      setFetchingMoreValue("");
                    });
                  }}
                  loading={fetchingMoreValue === label}
                >
                  {label}
                </LoadingButton>
              ))}
            </Stack>
          </Stack>
        </Stack> */}
        {!!sessions?.length && (
          <DateRangeSlider
            value={viewRange}
            onChange={setViewRange}
            min={minDate.getTime()}
            max={maxDate.getTime()}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default SessionsChart;
