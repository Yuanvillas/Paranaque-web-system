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

const BooksAddedTodayChart = ({ todayCount, todayBooks = [] }) => {
  // Get categories of books added today
  const categoryCount = {};
  todayBooks.forEach(book => {
    const category = book.category || "Uncategorized";
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });

  const labels = Object.keys(categoryCount).length > 0 ? Object.keys(categoryCount) : ["No Books Added Today"];
  const counts = Object.keys(categoryCount).length > 0 ? Object.values(categoryCount) : [0];

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Books Added Today",
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
        text: `Books Added Today (Total: ${todayCount})`,
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
