import React, { useEffect, useRef, useState } from "react";
import * as Plot from "@observablehq/plot";
import axios from "axios";
import Papa from "papaparse";

const AreaChart = () => {
  const chartRef = useRef();
  const [data, setData] = useState([]);
  const [coinStats, setCoinStats] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const sheetId = process.env.REACT_APP_SHEET_ID;
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Sheet1`;

      try {
        const response = await axios.get(url);
        console.log(response);
        const parsedData = parseCSV(response.data);
        const cleanedData = cleanData(parsedData);

        const firstRow = cleanedData[0];
        const extractedCoinNames = Object.keys(firstRow).filter(
          (key) => key !== "Date"
        );

        const calculatedStats = calculateStats(cleanedData, extractedCoinNames);
        setCoinStats(calculatedStats);
        setData(cleanedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const parseCSV = (csv) => {
    const parsed = Papa.parse(csv, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
    });
    return parsed.data;
  };

  const cleanData = (data) => {
    return data.map((row) => {
      row.Date = new Date(row.Date);

      Object.keys(row).forEach((key) => {
        if (key !== "Date") {
          row[key] = parseFloat(row[key].replace(/,/g, ""));
        }
      });

      return row;
    });
  };

  const colorScheme = [
    "#53c9e0",
    "#ce67f0",
    "#3a79ff",
    "#50ef70",
    "#f96d6d",
    "#ffcf44",
    "#a4de02",
    "#028a0f",
    "#f2711c",
    "#b21f35",
    "#243665",
    "#d4c800",
    "#6f42c1",
    "#17a2b8",
    "#28a745",
    "#fd7e14",
    "#6610f2",
    "#e83e8c",
    "#ffc107",
    "#007bff",
    "#dc3545",
    "#17c671",
    "#ffeb3b",
    "#8bc34a",
    "#ff9800",
    "#9c27b0",
    "#3f51b5",
    "#673ab7",
    "#00bcd4",
    "#ff5722",
  ];

  const calculateStats = (data, coinNames) => {
    const coinStats = [];

    const totalVolumes = {};

    coinNames.forEach((coin) => {
      totalVolumes[coin] = 0;
    });

    data.forEach((row) => {
      coinNames.forEach((coin) => {
        const volume = row[coin] || 0;
        totalVolumes[coin] += volume;
      });
    });

    coinNames.forEach((coin, index) => {
      coinStats.push({
        name: coin,
        volume: totalVolumes[coin],
        change: "N/A",
        color: colorScheme[index],
      });
    });

    return coinStats;
  };

  const formatVolume = (value) => {
    const formatWithSuffix = (num, suffix) =>
      num % 1 === 0
        ? `$${num.toFixed(0)}${suffix}`
        : `$${num.toFixed(1)}${suffix}`;

    if (value >= 1e9) {
      return formatWithSuffix(value / 1e9, "B");
    } else if (value >= 1e6) {
      return formatWithSuffix(value / 1e6, "M");
    } else if (value >= 1e3) {
      return formatWithSuffix(value / 1e3, "K");
    } else {
      return `$${value}`;
    }
  };

  useEffect(() => {
    if (data.length > 0) {
      const flattenedData = [];

      data.forEach((row) => {
        const { Date, ...coins } = row;
        Object.entries(coins).forEach(([coin, volume]) => {
          flattenedData.push({
            date: Date,
            name: coin,
            volume,
          });
        });
      });

      const maxYValue = Math.max(...flattenedData.map((d) => d.volume));
      const yBuffer = maxYValue * 0.2;

      const formatDate = (date) => {
        const options = { year: "numeric", month: "short" };
        return new Intl.DateTimeFormat("en-US", options)
          .format(date)
          .replace(" ", "-");
      };

      const chart = Plot.plot({
        marks: [
          Plot.areaY(flattenedData, {
            x: "date",
            y: "volume",
            z: "name",
            fill: "name",
          }),
        ],
        color: {
          range: colorScheme,
        },
        x: {
          tickFormat: formatDate,
          ticks: "month",
          tickSize: 0,
          line: true,
        },
        y: {
          domain: [0, maxYValue + yBuffer],
          label: "DEX Volume",
          tickFormat: formatVolume,
          tickSize: 0,
          labelAnchor: "center",
          labelArrow: false,
          labelOffset: 70,
          grid: true,
          line: true,
        },
        marginLeft: 70,
        style: {
          fontSize: "14px",
        },
      });

      if (chartRef.current) {
        chartRef.current.innerHTML = "";
        chartRef.current.appendChild(chart);

        const frameLines = document.querySelectorAll(
          'line[aria-label="frame"]'
        );

        frameLines.forEach((line) => {
          line.style.strokeOpacity = 0.2;
        });
      }
    }
  }, [data]);

  return (
    <div className="flex justify-start">
      <div ref={chartRef}></div>
      <div className="legend-container my-auto text-white">
        <h2 className="font-bold mb-1 px-10 border-b-[1px] border-white border-opacity-50">
          Avg Q2'24 Volume
        </h2>
        <ul className="space-y-2">
          {coinStats.map((item, index) => (
            <li key={index} className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <span
                  className="w-3 h-6 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></span>
                <div>
                  <span className="">{item.name}</span>
                  <p className="text-xs opacity-70">QoQ Change</p>
                </div>
              </div>
              <div className="text-right">
                <p>{formatVolume(item.volume)}</p>
                <p className="text-xs opacity-70">{item.change}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AreaChart;
