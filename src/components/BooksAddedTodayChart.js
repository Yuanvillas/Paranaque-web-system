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
  // Color palette for each month (vibrant colors)
  const monthColors = [
    "rgba(244, 67, 54, 0.8)",      // Red - January
    "rgba(76, 175, 80, 0.8)",      // Green - February
    "rgba(63, 81, 181, 0.8)",      // Indigo - March
    "rgba(33, 150, 243, 0.8)",     // Blue - April
    "rgba(255, 193, 7, 0.8)",      // Amber - May
    "rgba(244, 152, 25, 0.8)",     // Orange - June
    "rgba(156, 39, 176, 0.8)",     // Purple - July
    "rgba(216, 27, 96, 0.8)",      // Pink - August
    "rgba(0, 150, 136, 0.8)",      // Teal - September
    "rgba(255, 152, 0, 0.8)",      // Deep Orange - October
    "rgba(76, 175, 80, 0.8)",      // Light Green - November
    "rgba(156, 39, 176, 0.8)"      // Deep Purple - December
  ];

  // Get monthly users data
  const labels = monthlyUsers.length > 0 ? monthlyUsers.map(u => u.month || u.name) : ["No Data"];
  const counts = monthlyUsers.length > 0 ? monthlyUsers.map(u => u.count || 0) : [0];
  const totalUsers = monthlyUsers.length > 0 ? monthlyUsers.reduce((sum, u) => sum + (u.count || 0), 0) : 0;

  // Create individual bars with different colors
  const backgroundColors = labels.map((_, index) => monthColors[index] || monthColors[0]);
  const borderColors = backgroundColors.map(color => color.replace('0.8', '1'));

  const data = {
    labels: labels,
    datasets: [
      {
        label: "User Registrations",
        data: counts,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'x',
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Total Users Monthly (Total: ${totalUsers})`,
        font: {
          size: 14,
          weight: 'bold'
        },
        padding: 10
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `Users: ${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
  };

  return <div style={{ width: "100%", height: "100%" }}><Bar data={data} options={options} /></div>;
};

export default BooksAddedTodayChart;
