import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import axios from "axios";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());

const cleanIsbn = (value = "") => value.replace(/[^0-9Xx]/g, "").toUpperCase();

const mapOpenLibraryBook = (isbn, payload) => {
  const entry = payload[`ISBN:${isbn}`];
  if (!entry) return null;

  const firstPublishedYear = entry.publish_date
    ? Number.parseInt(String(entry.publish_date).match(/\d{4}/)?.[0] ?? "", 10)
    : null;

  return {
    isbn,
    title: entry.title ?? "",
    author: entry.authors?.map((author) => author.name).join(", ") ?? "",
    publishedYear: Number.isNaN(firstPublishedYear) ? null : firstPublishedYear,
    publisher: entry.publishers?.[0]?.name ?? "",
    coverImageUrl: entry.cover?.large ?? entry.cover?.medium ?? entry.cover?.small ?? "",
    notes: "",
  };
};

const mapGoogleBook = (isbn, payload) => {
  const item = payload.items?.[0];
  if (!item) return null;

  const info = item.volumeInfo ?? {};
  const firstPublishedYear = info.publishedDate
    ? Number.parseInt(String(info.publishedDate).match(/\d{4}/)?.[0] ?? "", 10)
    : null;

  return {
    isbn,
    title: info.title ?? "",
    author: info.authors?.join(", ") ?? "",
    publishedYear: Number.isNaN(firstPublishedYear) ? null : firstPublishedYear,
    publisher: info.publisher ?? "",
    coverImageUrl: info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? "",
    notes: "",
  };
};

const lookupBookByIsbn = async (isbn) => {
  const openLibraryUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
  const openLibraryResponse = await axios.get(openLibraryUrl, { timeout: 8000 });
  const openLibraryResult = mapOpenLibraryBook(isbn, openLibraryResponse.data);
  if (openLibraryResult && openLibraryResult.title) return openLibraryResult;

  const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
  const googleBooksResponse = await axios.get(googleBooksUrl, { timeout: 8000 });
  const googleBooksResult = mapGoogleBook(isbn, googleBooksResponse.data);
  if (googleBooksResult && googleBooksResult.title) return googleBooksResult;

  return null;
};

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/books", async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(books);
  } catch (error) {
    if (error?.code === "P2021") {
      res.json([]);
      return;
    }
    console.error("Failed to load books:", error);
    res.status(500).json({ error: "Failed to load books." });
  }
});

app.get("/api/books/lookup", async (req, res) => {
  const isbn = cleanIsbn(req.query.isbn);
  if (isbn.length !== 10 && isbn.length !== 13) {
    res.status(400).json({ error: "Provide a valid ISBN-10 or ISBN-13." });
    return;
  }

  try {
    const book = await lookupBookByIsbn(isbn);
    if (!book) {
      res.status(404).json({ error: "Book metadata not found for this ISBN." });
      return;
    }

    res.json(book);
  } catch (error) {
    console.error("ISBN lookup failed:", error);
    res.status(500).json({ error: "Lookup failed. Try again." });
  }
});

app.post("/api/books", async (req, res) => {
  const payload = req.body ?? {};
  const title = String(payload.title ?? "").trim();
  const isbn = cleanIsbn(payload.isbn ?? "");

  if (!title) {
    res.status(400).json({ error: "Title is required." });
    return;
  }

  if (isbn && isbn.length !== 10 && isbn.length !== 13) {
    res.status(400).json({ error: "ISBN must be 10 or 13 characters." });
    return;
  }

  const publishedYearRaw = payload.publishedYear;
  const publishedYear = publishedYearRaw ? Number.parseInt(String(publishedYearRaw), 10) : null;

  try {
    const book = await prisma.book.create({
      data: {
        title,
        author: String(payload.author ?? "").trim() || null,
        isbn: isbn || null,
        publishedYear: Number.isNaN(publishedYear) ? null : publishedYear,
        publisher: String(payload.publisher ?? "").trim() || null,
        coverImageUrl: String(payload.coverImageUrl ?? "").trim() || null,
        condition: String(payload.condition ?? "Good").trim() || "Good",
        notes: String(payload.notes ?? "").trim() || null,
      },
    });
    res.status(201).json(book);
  } catch (error) {
    if (error?.code === "P2002") {
      res.status(409).json({ error: "This ISBN already exists in your inventory." });
      return;
    }
    if (error?.code === "P2021") {
      res.status(500).json({ error: "Book table not ready. Run prisma db push and retry." });
      return;
    }
    console.error("Failed to create book:", error);
    res.status(500).json({ error: "Failed to add book." });
  }
});

app.post("/api/__via/telemetry", (req, res) => {
  const logDir = "/var/log/via";
  fs.mkdirSync(logDir, { recursive: true });
  const events = Array.isArray(req.body) ? req.body : [req.body];
  for (const event of events) {
    const line = JSON.stringify(event) + "\n";
    fs.appendFileSync(path.join(logDir, "telemetry.jsonl"), line);
    if (event.type === "error" || (event.type === "console" && event.level === "error")) {
      fs.appendFileSync(path.join(logDir, "errors.jsonl"), line);
    }
  }
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Express listening on :${PORT}`));
