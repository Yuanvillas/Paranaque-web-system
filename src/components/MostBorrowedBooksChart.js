// src/components/MostBorrowedBooksChart.js
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

const MostBorrowedBooksChart = ({ mostBorrowedBooks = [] }) => {
  // Get top 10 most borrowed books
  const topBooks = mostBorrowedBooks.slice(0, 10);
  
  const labels = topBooks.length > 0 ? topBooks.map(b => b.title?.substring(0, 20) + (b.title?.length > 20 ? '...' : '')) : ["No Data"];
  const counts = topBooks.length > 0 ? topBooks.map(b => b.borrowCount || 0) : [0];

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Times Borrowed",
        data: counts,
        backgroundColor: "rgba(155, 89, 182, 0.7)",
        borderColor: "rgba(155, 89, 182, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: true,
      },
      title: {
        display: true,
        text: `Most Borrowed Books (Top ${topBooks.length})`,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      x: {
        beginAtZero: true,
      },
    },
  };

  return <div style={{ width: "100%", height: "300px" }}><Bar data={data} options={options} /></div>;
};

export default MostBorrowedBooksChart;
