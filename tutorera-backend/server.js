require("express-async-errors");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./src/config/db");
const errorHandler = require("./src/middlewares/errorHandler");
require("dotenv").config();

const app = express();

// Connect Database
connectDB();

// Middlewares
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes (we'll add these one by one)
// app.use("/api/auth", require("./src/routes/auth.routes"));
// app.use("/api/tutors", require("./src/routes/tutor.routes"));
// app.use("/api/students", require("./src/routes/student.routes"));
// app.use("/api/requests", require("./src/routes/request.routes"));
// app.use("/api/bookings", require("./src/routes/booking.routes"));
// app.use("/api/reviews", require("./src/routes/review.routes"));
// app.use("/api/blogs", require("./src/routes/blog.routes"));
// app.use("/api/contact", require("./src/routes/contact.routes"));

// Health check
app.get("/", (req, res) => res.json({ message: "Tutorera API is running 🚀" }));

// Error Handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));