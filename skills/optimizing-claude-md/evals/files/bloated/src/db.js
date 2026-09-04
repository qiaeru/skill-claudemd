import pg from "pg";

// The pool is created at import time, so DATABASE_URL must be set before any module imports this file.
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
