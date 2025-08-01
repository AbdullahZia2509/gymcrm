import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import AuthContext from "../../context/auth/authContext";
import AlertContext from "../../context/alert/alertContext";
import axios from "axios";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ExpenseSummary = () => {
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);
  const { user } = authContext;
  const { setAlert } = alertContext;

  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1); // JS months are 0-indexed
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [categorySummary, setCategorySummary] = useState(null);

  useEffect(() => {
    fetchMonthlySummary();
    fetchCategorySummary();
    // eslint-disable-next-line
  }, [year, month]);

  const fetchMonthlySummary = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `/api/expenses/summary/monthly?year=${year}&month=${month}`
      );
      setMonthlySummary(res.data);
      setLoading(false);
    } catch (err) {
      setAlert(
        err.response?.data?.msg || "Error fetching monthly expense summary",
        "error"
      );
      setLoading(false);
    }
  };

  const fetchCategorySummary = async () => {
    try {
      // Calculate start and end date for the current month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const res = await axios.get(
        `/api/expenses/summary/category?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      setCategorySummary(res.data);
    } catch (err) {
      setAlert(
        err.response?.data?.msg || "Error fetching category expense summary",
        "error"
      );
    }
  };

  const handleYearChange = (e) => {
    setYear(parseInt(e.target.value));
  };

  const handleMonthChange = (e) => {
    setMonth(parseInt(e.target.value));
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
    }).format(amount);
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      salary: "rgba(54, 162, 235, 0.8)",
      bills: "rgba(255, 99, 132, 0.8)",
      maintenance: "rgba(255, 206, 86, 0.8)",
      equipment: "rgba(75, 192, 192, 0.8)",
      rent: "rgba(153, 102, 255, 0.8)",
      supplies: "rgba(255, 159, 64, 0.8)",
      marketing: "rgba(199, 199, 199, 0.8)",
      misc: "rgba(83, 102, 255, 0.8)",
    };

    return colors[category] || "rgba(128, 128, 128, 0.8)";
  };

  // Prepare pie chart data
  const preparePieChartData = () => {
    if (!categorySummary || !categorySummary.categorySummary) return null;

    const labels = categorySummary.categorySummary.map(
      (item) => item._id.charAt(0).toUpperCase() + item._id.slice(1)
    );

    const data = categorySummary.categorySummary.map((item) => item.total);

    const backgroundColor = categorySummary.categorySummary.map((item) =>
      getCategoryColor(item._id)
    );

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare bar chart data for monthly expenses
  const prepareBarChartData = () => {
    if (!categorySummary || !categorySummary.categorySummary) return null;

    const labels = categorySummary.categorySummary.map(
      (item) => item._id.charAt(0).toUpperCase() + item._id.slice(1)
    );

    const data = categorySummary.categorySummary.map((item) => item.total);

    const backgroundColor = categorySummary.categorySummary.map((item) =>
      getCategoryColor(item._id)
    );

    return {
      labels,
      datasets: [
        {
          label: "Expenses by Category",
          data,
          backgroundColor,
          borderWidth: 1,
        },
      ],
    };
  };

  // Chart options
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
      },
      title: {
        display: true,
        text: "Expenses by Category",
      },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Expenses by Category",
      },
    },
  };

  // Get years for dropdown (last 5 years)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
      years.push(currentYear - i);
    }
    return years;
  };

  // Get month name
  const getMonthName = (monthNum) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[monthNum - 1];
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Expense Summary
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6">Monthly Expense Report</Typography>
          </Grid>
          <Grid item xs={6} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Year</InputLabel>
              <Select value={year} onChange={handleYearChange} label="Year">
                {getYearOptions().map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Month</InputLabel>
              <Select value={month} onChange={handleMonthChange} label="Month">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <MenuItem key={m} value={m}>
                    {getMonthName(m)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Expenses
                    </Typography>
                    <Typography variant="h4">
                      {monthlySummary
                        ? formatCurrency(monthlySummary.total)
                        : "$0.00"}
                    </Typography>
                    <Typography color="textSecondary">
                      {getMonthName(month)} {year}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Number of Transactions
                    </Typography>
                    <Typography variant="h4">
                      {monthlySummary ? monthlySummary.count : 0}
                    </Typography>
                    <Typography color="textSecondary">
                      {getMonthName(month)} {year}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Average Transaction
                    </Typography>
                    <Typography variant="h4">
                      {monthlySummary && monthlySummary.count > 0
                        ? formatCurrency(
                            monthlySummary.total / monthlySummary.count
                          )
                        : "Rs.0.00"}
                    </Typography>
                    <Typography color="textSecondary">
                      {getMonthName(month)} {year}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 4 }} />

            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Expense Distribution
                </Typography>
                {preparePieChartData() && (
                  <Box sx={{ height: 300 }}>
                    <Pie data={preparePieChartData()} options={pieOptions} />
                  </Box>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Expense by Category
                </Typography>
                {prepareBarChartData() && (
                  <Box sx={{ height: 300 }}>
                    <Bar data={prepareBarChartData()} options={barOptions} />
                  </Box>
                )}
              </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Category Breakdown
              </Typography>
              <Grid container spacing={2}>
                {categorySummary &&
                  categorySummary.categorySummary &&
                  categorySummary.categorySummary.map((category) => (
                    <Grid item xs={12} sm={6} md={4} key={category._id}>
                      <Card>
                        <CardContent>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{ textTransform: "capitalize" }}
                            >
                              {category._id}
                            </Typography>
                            <Typography variant="h6">
                              {formatCurrency(category.total)}
                            </Typography>
                          </Box>
                          <Typography color="textSecondary">
                            {category.count}{" "}
                            {category.count === 1
                              ? "transaction"
                              : "transactions"}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ExpenseSummary;
