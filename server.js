import express from 'express';
import  "dotenv/config.js"
import {connectDB} from './config/db.js';
import rootRouter from './routes/root.routes.js';
import morgan from 'morgan';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from "path";



// ✅ Connect to DB
connectDB();

//
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ Initialize Express app
const port = process.env.PORT || 5001;
const app = express();


// ✅ Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, "view")));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view')); 

// ✅ Static files
app.use("/api/v1",express.static("public"))


// ✅ Routes
app.use("/api/v1", rootRouter);


app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get("/api/v1/about", (req, res) => {
  res.sendFile(path.join(__dirname, "view", "about.html"));
});
app.get("/api/v1/terms", (req, res) => {
  res.sendFile(path.join(__dirname, "view", "terms.html"));
});
app.get("/api/v1/privacyPolicy", (req, res) => {
  res.sendFile(path.join(__dirname, "view", "privacyPolicy.html"));
});
app.get("/api/v1/faq", (req, res) => {
  res.sendFile(path.join(__dirname, "view", "faq.html"));
});
app.get("/api/v1/help&support", (req, res) => {
  res.sendFile(path.join(__dirname, "view", "help&support.html"));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})




