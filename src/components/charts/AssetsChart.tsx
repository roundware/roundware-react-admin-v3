/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import History from "@mui/icons-material/History";
import { LoadingButton } from "@mui/lab";
import {
  Card,
  CardContent,
  CardHeader,
  Collapse,
  LinearProgress,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { ResourceList } from "App";
import { useChartsData } from "components/charts/ChartsData";
import DateRangeSlider from "components/charts/DateRangeSlider";
import { useProjects } from "context/ProjectsContext";
import { addDays, isAfter, isBefore, subDays } from "date-fns";
import useBoolean from "hooks/useBoolean";
import { capitalize } from "lodash";
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
import { apiFetcher } from "roundwareDataProvider/tokenAuthProvider";
import { IAsset } from "types/asset";
import { DateRange } from "utils";
import { CenteredLoading } from "../Layout/Dashboard";

const mediaTypes: [`audio`, "photo", "text"] = [`audio`, `photo`, `text`];
const colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

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

const getAssetsPerDate = (assets: RaRecord[]) => {
  const assetsWithDate = getSanitizedList(assets);

  const chartDataMap = new Map<string, BarChartData>();

  const initialDefaultData: BarChartData = {
    audio: 0,
    text: 0,
    photo: 0,
    total: 0,
    date: 0,
  };
  assetsWithDate.forEach((s) => {
    const keyName = (s.created as unknown as Date).toDateString();
    let data = chartDataMap.get(keyName);

    if (data === undefined) {
      data = initialDefaultData;
    }
    data = {
      ...data,
      [s?.media_type]: data[s?.media_type as "photo"] + 1,
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
    .map(
      (s) =>
        ({
          ...s,
          media_type: s?.media_type,
          created: new Date(s?.created),
          id: +s?.id,
        } as unknown as IAsset)
    )
    .sort((a, b) => (a.created > b.created ? 1 : -1)),
];

const PAGE_SIZE = 200;
async function fetchAssets({
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
    `/assets/?page=${pageParam}&paginate=true&page_size=${
      pageSize || PAGE_SIZE
    }&created__gte=${startDate.toISOString()}&created__lte=${endDate.toISOString()}&admin=1&project_id=${projectId}`
  );

  return res?.json as {
    count: number;
    next: string;
    previous: string;
    results: IAsset[];
  };
}

const AssetsChart = (): JSX.Element => {
  const { assets, setAssets, assetsAllFetchedRange, setAssetsAllFetchedRange } =
    useChartsData();
  const [viewRange, setViewRange] = useState<DateRange>(assetsAllFetchedRange);
  const project = useProjects();

  const [percentage, setPercentage] = useState(0);

  async function fetchForRange(inputRange: DateRange) {
    if (!project?.selectedProject?.id) return;
    setPercentage(0);
    // determine extra range to fetch from backward;
    const start = inputRange[0];
    const end = inputRange[1];

    // determine how many are there; by doing a call;
    const res = await fetchAssets({
      pageParam: 1,
      startDate: start,
      endDate: end,
      projectId: project?.selectedProject?.id as number,
    });

    setAssets((prev) => [...prev, ...res.results]);

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
        fetchAssets({
          pageParam: i + 2,
          startDate: start,
          endDate: end,
          projectId: project?.selectedProject?.id as number,
        })
          .then((res) => {
            if (res?.results?.length) {
              setAssets((prev) => [...prev, ...res.results]);
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
    fetchForRange(assetsAllFetchedRange).then(() => {
      // setAllFetchedData(data);
      loading.setFalse();
    });
  }, []);

  const perDateData = useMemo(() => {
    return getAssetsPerDate(assets);
  }, [assets]);

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
    if (ResourceList.includes(`assets`))
      redirect(
        `list`,
        `assets?filter=${JSON.stringify({
          [`created__gte`]: new Date(data?.date).toISOString(),
          [`created__lte`]: addDays(new Date(data?.date), 1).toISOString(),
        })}`
      );
  };

  const totals = useMemo(() => {
    const totals: {
      [key: string]: number;
    } = {
      audio: 0,
      text: 0,
      photo: 0,
    };
    viewData.forEach((d) => {
      totals.audio += d.audio;
      totals.text += d.text;
      totals.photo += d.photo;
    });
    return totals;
  }, [viewData]);

  return (
    <Card>
      <CardHeader
        title={
          <>
            <Toolbar>
              <Typography variant="h5" style={{ flexGrow: 1 }}>
                Assets
              </Typography>
            </Toolbar>
          </>
        }
      />

      <CardContent>
        {!assets.length ? (
          <CenteredLoading />
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart data={viewData}>
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
                        totals.audio + totals.text + totals.photo
                      })`,
                      id: `IDtotal`,
                      type: "rect",
                      color: colors[3],
                    })}
                />
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
                  domain={["dataMin + 10", "dataMax + 10"]}
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
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
              Fetch Earlier Asset Data
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
                      subDays(assetsAllFetchedRange[0], valueDays),
                      assetsAllFetchedRange[0],
                    ]).then(() => {
                      setAssetsAllFetchedRange([
                        subDays(assetsAllFetchedRange[0], valueDays),
                        assetsAllFetchedRange[1],
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

        {!!assets.length && (
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

export default AssetsChart;
