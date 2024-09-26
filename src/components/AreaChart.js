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
          label: "Date",
        },
        y: {
          label: "Volume in Millions",
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
