// src/components/BooksAddedTodayChart.js
import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BooksAddedTodayChart = ({ monthlyUsers = [] }) => {
  // Get monthly users data
  const labels = monthlyUsers.length > 0 ? monthlyUsers.map(u => u.month || u.name) : ["No Data"];
  const counts = monthlyUsers.length > 0 ? monthlyUsers.map(u => u.count || 0) : [0];
  const totalUsers = monthlyUsers.length > 0 ? monthlyUsers.reduce((sum, u) => sum + (u.count || 0), 0) : 0;

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Users",
        data: counts,
        backgroundColor: "rgba(54, 162, 235, 0.7)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: labels.length > 3 ? 'y' : 'x',
    plugins: {
      legend: {
        display: true,
      },
      title: {
        display: true,
        text: `Users Monthly (Total: ${totalUsers})`,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
      x: {
        beginAtZero: true,
      },
    },
  };

  return <div style={{ width: "100%", height: "100%" }}><Bar data={data} options={options} /></div>;
};

export default BooksAddedTodayChart;
