// src/components/BooksListedChart.js
import React from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const BooksListedChart = ({ books }) => {
  // Count available vs borrowed books
  const availableCount = books.filter(b => !b.borrowedBy).length;
  const borrowedCount = books.filter(b => b.borrowedBy).length;

  const data = {
    labels: ["Available", "Borrowed"],
    datasets: [
      {
        label: "Books Listed",
        data: [availableCount, borrowedCount],
        backgroundColor: [
          "rgba(76, 175, 80, 0.7)",
          "rgba(255, 193, 7, 0.7)",
        ],
        borderColor: [
          "rgba(76, 175, 80, 1)",
          "rgba(255, 193, 7, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
      title: {
        display: true,
        text: `Books Listed (Total: ${books.length})`,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
  };

  return <div style={{ width: "100%", height: "100%" }}><Pie data={data} options={options} /></div>;
};

export default BooksListedChart;
