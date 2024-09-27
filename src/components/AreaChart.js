import React, { useEffect, useRef, useState } from "react";
import * as Plot from "@observablehq/plot";
import axios from "axios";
import Papa from "papaparse";

const AreaChart = () => {
  const chartRef = useRef();
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const sheetId = process.env.REACT_APP_SHEET_ID;
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Sheet1`;

      try {
        const response = await axios.get(url);
        const parsedData = parseCSV(response.data);
        const cleanedData = cleanData(parsedData);
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
          legend: true,
        },
        x: {
          tickFormat: formatDate,
          ticks: "month",
          tickSize: 0,
        },
        y: {
          label: "DEX Volume",
          tickFormat: formatVolume,
          tickSize: 0,
          labelAnchor: "center",
          labelArrow: false,
          labelOffset: 70,
        },
        marginLeft: 70,
        style: {
          fontSize: "14px",
        },
      });

      if (chartRef.current) {
        chartRef.current.innerHTML = "";
        chartRef.current.appendChild(chart);
      }
    }
  }, [data]);

  return <div ref={chartRef} />;
};

export default AreaChart;
