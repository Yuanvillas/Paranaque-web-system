import React, { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faBook, faChartBar, faHome } from "@fortawesome/free-solid-svg-icons";
import "../components/App.css";
import logo from "../imgs/liblogo.png";

const BooksTable = lazy(() => import("../components/BooksTable"));
const ArchiveBooksTable = lazy(() => import("../components/ArchiveBooksTable"));
const BorrowedBooksTable = lazy(() => import("../components/BorrowedBooksTable"));
const ReservedBooksTable = lazy(() => import("../components/ReservedBooksTable"));
const PendingRequestTable = lazy(() => import("../components/PendingRequestTable"));
const TransactionsTable = lazy(() => import("../components/TransactionsTable"));

const resourceOptions = [
  "All Books",
  "Archive Books",
  "Borrowed Books",
  "Reserved Books",
  "Pending Requests",
  "Transactions"
];

const Resources = ({ dashboardPath, analyticsPath }) => {
  const navigate = useNavigate();
  const [selectedResource, setSelectedResource] = useState("All Books");

  const resourceComponents = {
    "All Books": BooksTable,
    "Archive Books": ArchiveBooksTable,
    "Borrowed Books": BorrowedBooksTable,
    "Reserved Books": ReservedBooksTable,
    "Pending Requests": PendingRequestTable,
    Transactions: TransactionsTable
  };
  const SelectedResource = resourceComponents[selectedResource];

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="logo2">
          <img style={{ width: "50px" }} src={logo} alt="Parañaledge Library" />
        </div>
        <nav className="nav-links" aria-label="Dashboard navigation">
          <button onClick={() => navigate(dashboardPath)}>
            <FontAwesomeIcon icon={faHome} />
            <span>Home</span>
          </button>
          <button onClick={() => navigate(analyticsPath)}>
            <FontAwesomeIcon icon={faChartBar} />
            <span>Analytics</span>
          </button>
          <button aria-current="page">
            <FontAwesomeIcon icon={faBook} />
            <span>Resources</span>
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="header">
          <h1>Resource Management</h1>
          <button className="btn" onClick={() => navigate(dashboardPath)}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
          </button>
        </header>
        <div className="content">
          <div className="resource-submenu" aria-label="Resource categories">
            {resourceOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSelectedResource(option)}
                className={`resource-option ${selectedResource === option ? "active" : ""}`}
                aria-pressed={selectedResource === option}
              >
                {option}
              </button>
            ))}
          </div>
          <Suspense fallback={<div role="status">Loading resources...</div>}>
            <SelectedResource />
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default Resources;
