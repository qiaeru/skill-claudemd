import express from "express";
import { pool } from "./db.js";

const app = express();
app.use(express.json());
app.listen(process.env.PORT ?? 3000);
