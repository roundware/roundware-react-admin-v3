/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  TextFieldProps,
  Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { subDays } from 'date-fns';
import { capitalize, uniqBy } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { GetListResult, useRedirect } from 'react-admin';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Label,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { IAsset } from 'types/asset';
import { IListenEvent } from 'types/listenEvents';
import { CenteredLoading } from '../Layout/Dashboard';

interface Props {
  assets: GetListResult<IAsset> | null;
  listenEvents: GetListResult<IListenEvent>;
}

type BarChartData = {
  assetId: number;
  total: number;
};

const AssetListensChart = ({ assets, listenEvents }: Props): JSX.Element => {
  const lowestDate = useMemo(() => {
    const dates = listenEvents?.data?.map((event) =>
      new Date(event?.start_time).getTime()
    );
    return dates?.length ? new Date(Math.min(...dates)) : new Date();
  }, [listenEvents]);

  const [customRange, setCustomRange] = useState(false);

  const [rangeDropdownValue, setRangeDropdownValue] = useState<string | number>(
    30
  );
  const [range, setRange] = useState<[Date, Date]>([
    subDays(new Date(), +rangeDropdownValue),
    new Date(),
  ]);
  const [, setDropdownRange] = useState<[Date, Date]>(range);

  const handleOnSelectChange = (value: string | number) => {
    setRangeDropdownValue(value);
    if (value === 'custom') {
      setCustomRange(true);
      return;
    }
    setCustomRange(false);

    if (value === 'total') {
      const newRange = [lowestDate, new Date()] as [Date, Date];
      setRange(newRange);
      setDropdownRange(newRange);
      return;
    }

    const newRange = [subDays(new Date(), Number(value)), new Date()] as [
      Date,
      Date
    ];
    setRange(newRange);
    setDropdownRange(newRange);
  };

  useEffect(() => {
    handleOnSelectChange(30);
  }, [listenEvents, assets]);

  const [startDate, setStartDate] = useState(lowestDate || new Date());
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    setRange([startDate, endDate]);

    setDropdownRange([startDate, endDate]);
  }, [startDate, endDate]);

  const [assetViewIndex, setAssetViewIndex] = useState([
    0,
    uniqBy(listenEvents?.data, 'asset_id').length,
  ]);

  const perAssetListens: BarChartData[] = useMemo(() => {
    if (!assets) return [];

    return assets.data
      .map((asset) => ({
        assetId: asset.id,
        total: listenEvents.data
          .filter((l) => {
            const date = new Date(l.start_time);
            return date >= range[0] && date <= range[1];
          })
          .filter((listen) => listen.asset_id == asset.id).length,
      }))
      .filter((a) => a.total > 0)
      .sort((a) => a.assetId)
      .sort((a, b) => (a.total > b.total ? -1 : 1))
      .slice(assetViewIndex[0], assetViewIndex[1]);
  }, [assets, listenEvents, assetViewIndex, range]);

  const redirect = useRedirect();

  return (
    <Card>
      <CardContent>
        <CardHeader
          title={
            <>
              <Typography variant='h5' style={{ flexGrow: 1 }}>
                Asset Listens
              </Typography>
            </>
          }
        />

        <Stack direction={'row'} mb={1} spacing={2} justifyContent='end'>
          <div>
            <FormControl style={{ width: 150 }}>
              <InputLabel>Range</InputLabel>
              <Select
                value={rangeDropdownValue}
                onChange={(e) => handleOnSelectChange(e.target.value)}
                label='Range'
              >
                <MenuItem value={7}>Last 7 Days</MenuItem>
                <MenuItem value={30}>Last 30 Days</MenuItem>
                <MenuItem value={365}>Last Year</MenuItem>
                <MenuItem value='total'>Total</MenuItem>
                <MenuItem value='custom'>Custom Range</MenuItem>
              </Select>
            </FormControl>
          </div>
        </Stack>

        {customRange && (
          <>
            <Stack direction={'row'} spacing={2} justifyContent='end'>
              <DatePicker
                label='Start Date'
                value={startDate}
                views={['year', 'month', 'day']}
                onChange={(date) => {
                  if (date) setStartDate(date);
                }}
                renderInput={(props: TextFieldProps) => (
                  <TextField {...props} />
                )}
              />

              <DatePicker
                label='End Date'
                value={endDate}
                onChange={(date) => {
                  if (date) setEndDate(date);
                }}
                renderInput={(props: TextFieldProps) => (
                  <TextField {...props} />
                )}
              />
            </Stack>
          </>
        )}

        {!perAssetListens ? (
          <CenteredLoading />
        ) : (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart data={perAssetListens}>
                <Legend align='center' verticalAlign='top' />
                <defs>
                  <linearGradient id='colorUv' x1='0' y1='0' x2='0' y2='1'>
                    <stop stopColor='#8884d8' stopOpacity={1} />
                    <stop stopColor='#1a1a20' stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey='assetId' type='category' fontSize={12}>
                  <Label value='Asset' dy={10} />
                </XAxis>
                <YAxis dataKey={'total'} type='number'>
                  <Label value={`Listens`} angle={-90} dx={-10} />
                </YAxis>

                <CartesianGrid strokeDasharray={'3 3 '} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value, name) => [
                    value,
                    capitalize(name.toString()),
                  ]}
                  active
                />

                <Bar
                  dataKey='total'
                  barSize={20}
                  fill='#413ea0'
                  onClick={(data) => {
                    redirect(
                      `list`,
                      `listenEvents?filter={"asset_id":${data.assetId}}`
                    );
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        {/* slider that shifts asset view index */}
        <Slider
          value={assetViewIndex}
          onChange={(e, newValue) => setAssetViewIndex(newValue as number[])}
          valueLabelDisplay='auto'
          aria-labelledby='range-slider'
          getAriaValueText={(value) => `${value}`}
          min={0}
          max={uniqBy(listenEvents.data, 'asset_id').length}
        />
      </CardContent>
    </Card>
  );
};

export default AssetListensChart;
