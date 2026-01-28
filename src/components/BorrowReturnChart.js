// src/components/BorrowReturnChart.js
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

const BorrowReturnChart = ({ borrowedBooks, allBooks }) => {
  // Count borrowed and returned
  const borrowedCount = borrowedBooks.length;
  const returnedCount = allBooks.length - borrowedCount;

  const data = {
    labels: ["Books"],
    datasets: [
      {
        label: "Borrowed",
        data: [borrowedCount],
        backgroundColor: "rgba(255, 99, 132, 0.7)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
      {
        label: "Returned",
        data: [returnedCount],
        backgroundColor: "rgba(54, 162, 235, 0.7)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Borrow vs Return",
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
    },
  };

  return <div style={{ width: "100%", height: "100%" }}><Bar data={data} options={options} /></div>;
};

export default BorrowReturnChart;
