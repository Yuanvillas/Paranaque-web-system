// src/components/BorrowedReturnedChart.js
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

const BorrowedReturnedChart = ({ borrowedBooks, allBooks }) => {
  // Count borrowed and returned
  const borrowedCount = borrowedBooks.length;
  const returnedCount = allBooks.length - borrowedCount;
  console.log("Data: ", borrowedCount, returnedCount)
  const data = {
    labels: ["Books"],
    datasets: [
      {
        label: "Borrowed",
        data: [borrowedCount],
        backgroundColor: "rgba(255, 99, 132, 0.7)",
      },
      {
        label: "Returned",
        data: [returnedCount],
        backgroundColor: "rgba(54, 162, 235, 0.7)",
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
        text: "Borrowed vs Returned Books",
      },
    },
  };

  return <div style={{ width: "100%", height: "400px" }}><Bar data={data} options={options} /></div>;
};

export default BorrowedReturnedChart;
