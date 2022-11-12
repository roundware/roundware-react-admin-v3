import { ResourceList } from "App";
import { addDays, subDays } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { RaRecord, useRedirect } from "react-admin";

export const useChartData = <
  T extends {
    [index: string]: Date | number | string;
  }
>(
  data: RaRecord[],
  getSanitizedList: (d: RaRecord[]) => T[],
  timeField: string,
  getPerDay: (
    d: RaRecord[],
    range: [Date, Date]
  ) => {
    date: number;
    total: number;
    [index: string]: number;
  }[],
  resource: string
) => {
  const [customRange, setCustomRange] = useState(false);

  const [rangeDropdownValue, setRangeDropdownValue] = useState<string | number>(
    30
  );
  const [range, setRange] = useState<[Date, Date]>([
    subDays(new Date(), +rangeDropdownValue),
    new Date(),
  ]);
  const [dropdownRange, setDropdownRange] = useState<[Date, Date]>(range);

  const handleOnSelectChange = (value: string | number) => {
    if (!data?.length) return;
    setRangeDropdownValue(value);
    if (value === "custom") {
      setCustomRange(true);
      return;
    }
    setCustomRange(false);

    if (value === "total") {
      const newRange = [
        getSanitizedList(data || [])[0][timeField],
        new Date(),
      ] as [Date, Date];
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
  }, [data]);

  const [startDate, setStartDate] = useState(
    (getSanitizedList(data || [])?.[0]?.[timeField] as Date) || new Date()
  );
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    setRange([startDate, endDate]);

    setDropdownRange([startDate, endDate]);
  }, [startDate, endDate]);

  const [showLine, setShowLine] = useState(false);

  const redirect = useRedirect();

  const handleOnBarClick = (e: { date: string }) => {
    if (ResourceList.includes(`${resource}`))
      redirect(
        `list`,
        `${resource}?filter=${JSON.stringify({
          start_time__gte: new Date(e?.date).toISOString(),
          start_time__lte: addDays(new Date(e?.date), 1).toISOString(),
        })}`
      );
  };

  const perDateData = useMemo(
    () => getPerDay(data || [], range),
    [data, range]
  );

  return {
    handleOnBarClick,
    perDateData,
    showLine,
    setShowLine,
    setStartDate,
    setEndDate,
    dropdownRange,
    customRange,
    rangeDropdownValue,
    handleOnSelectChange,
    setCustomRange,
    startDate,
    endDate,
    range,
    setRange,
  };
};
