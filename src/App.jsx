import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, LoaderCircle, Search, Sparkles } from "lucide-react";
import AddMethodTabs from "./components/AddMethodTabs";
import AddBookForm from "./components/AddBookForm";
import BookCard from "./components/BookCard";
import { extractIsbn, normalizeIsbn } from "./utils/isbn";

const initialForm = {
  title: "",
  author: "",
  isbn: "",
  publishedYear: "",
  publisher: "",
  coverImageUrl: "",
  condition: "Good",
  notes: "",
};

const supportsBarcodeDetector = typeof window !== "undefined" && "BarcodeDetector" in window;

function App() {
  const [books, setBooks] = useState([]);
  const [activeMethod, setActiveMethod] = useState("isbn");
  const [isbnInput, setIsbnInput] = useState("");
  const [form, setForm] = useState(initialForm);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);

  const detector = useMemo(() => {
    if (!supportsBarcodeDetector) return null;
    return new window.BarcodeDetector({ formats: ["qr_code", "ean_13", "ean_8"] });
  }, []);

  const fetchBooks = async () => {
    setIsLoadingBooks(true);
    try {
      const response = await fetch("/api/books");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to load books.");
      setBooks(payload);
    } catch (error) {
      setLookupMessage(error.message || "Could not load inventory.");
    } finally {
      setIsLoadingBooks(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    return () => {
      stopScanning();
    };
  }, []);

  const updateForm = (partial) => setForm((prev) => ({ ...prev, ...partial }));

  const applyLookupResult = (result) => {
    updateForm({
      title: result.title || "",
      author: result.author || "",
      isbn: result.isbn || "",
      publishedYear: result.publishedYear ? String(result.publishedYear) : "",
      publisher: result.publisher || "",
      coverImageUrl: result.coverImageUrl || "",
      notes: result.notes || "",
    });
    setSaveSuccess("Book details loaded. Review and save.");
    setSaveError("");
  };

  const lookupByIsbn = async (rawValue) => {
    const isbn = normalizeIsbn(rawValue);
    if (!isbn) {
      setSaveError("Please provide a valid ISBN-10 or ISBN-13.");
      return;
    }

    setIsLookupLoading(true);
    setSaveError("");
    setSaveSuccess("");
    setLookupMessage("");

    try {
      const response = await fetch(`/api/books/lookup?isbn=${isbn}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "ISBN lookup failed.");
      applyLookupResult(payload);
      setIsbnInput(isbn);
    } catch (error) {
      setSaveError(error.message || "Lookup failed.");
    } finally {
      setIsLookupLoading(false);
    }
  };

  const parseDetectedCode = (value) => {
    const isbn = extractIsbn(value);
    if (!isbn) {
      setSaveError("Could not detect an ISBN in the scan result.");
      return;
    }
    setIsbnInput(isbn);
    lookupByIsbn(isbn);
  };

  const scanFromVideo = async () => {
    if (!detector || !videoRef.current) return;
    try {
      const barcodes = await detector.detect(videoRef.current);
      if (barcodes.length === 0) return;
      const text = barcodes[0].rawValue || "";
      if (!text) return;
      stopScanning();
      parseDetectedCode(text);
    } catch {
      // Ignore transient detection errors while camera is active.
    }
  };

  const startScanning = async () => {
    if (!detector) {
      setSaveError("Barcode scanning is not supported in this browser.");
      return;
    }
    setSaveError("");
    setSaveSuccess("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsScanning(true);
      scanTimerRef.current = window.setInterval(scanFromVideo, 800);
    } catch {
      setSaveError("Camera permission is required for QR/ISBN scanning.");
    }
  };

  const stopScanning = () => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const onPhotoSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!detector) {
      setSaveError("Photo barcode detection is not supported in this browser.");
      return;
    }

    setSaveError("");
    setSaveSuccess("");

    try {
      const bitmap = await createImageBitmap(file);
      const barcodes = await detector.detect(bitmap);
      bitmap.close();
      if (barcodes.length === 0 || !barcodes[0].rawValue) {
        throw new Error("No QR/ISBN barcode found in this photo.");
      }
      parseDetectedCode(barcodes[0].rawValue);
    } catch (error) {
      setSaveError(error.message || "Photo scan failed.");
    }
  };

  const onFormChange = (event) => {
    const { name, value } = event.target;
    updateForm({ [name]: value });
  };

  const onSaveBook = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const response = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to add book.");

      setBooks((prev) => [payload, ...prev]);
      setForm(initialForm);
      setIsbnInput("");
      setSaveSuccess("Book added to your used inventory.");
    } catch (error) {
      setSaveError(error.message || "Save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-page-100 font-sans text-base text-ink-700">
      <section className="bg-gradient-to-br from-brand-600 to-ink-500 px-4 py-10 text-white">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-5xl"
        >
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand-100">
            <Sparkles className="h-4 w-4" />
            Used Bookstore Intake
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Add books by ISBN, live QR scan, or a photo.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-brand-50">
            Scan fast, auto-fill metadata, and keep your shelf inventory organized from your phone.
          </p>
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:grid-cols-2 md:py-12">
        <div className="space-y-4">
          <AddMethodTabs activeMethod={activeMethod} onMethodChange={setActiveMethod} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl bg-white p-5 shadow-sm"
          >
            {activeMethod === "isbn" ? (
              <div className="space-y-3">
                <label htmlFor="isbnInput" className="block text-sm font-semibold text-ink-700">
                  Type ISBN Code
                </label>
                <div className="flex gap-2">
                  <input
                    id="isbnInput"
                    value={isbnInput}
                    onChange={(event) => setIsbnInput(event.target.value)}
                    placeholder="9780316769488"
                    className="min-h-[44px] w-full rounded-xl border border-brand-100 px-3 text-base text-ink-700 outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    disabled={isLookupLoading}
                    onClick={() => lookupByIsbn(isbnInput)}
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-brand-600 px-4 text-white transition-all hover:brightness-110"
                    aria-label="Lookup ISBN"
                  >
                    {isLookupLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            ) : null}

            {activeMethod === "qr" ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-xl bg-page-200">
                  <video ref={videoRef} muted playsInline className="h-56 w-full object-cover md:h-64" />
                </div>
                <button
                  type="button"
                  onClick={isScanning ? stopScanning : startScanning}
                  className="min-h-[44px] w-full rounded-xl bg-ink-600 px-6 py-3 text-base font-semibold text-white transition-all hover:brightness-110"
                >
                  {isScanning ? "Stop Scanner" : "Start QR / ISBN Scanner"}
                </button>
              </div>
            ) : null}

            {activeMethod === "photo" ? (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-ink-600">
                  Take a clear photo of the barcode or QR label on the book.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onPhotoSelected}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[44px] w-full rounded-xl bg-ink-600 px-6 py-3 text-base font-semibold text-white transition-all hover:brightness-110"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Camera className="h-5 w-5" />
                    Upload Book Photo
                  </span>
                </button>
              </div>
            ) : null}
          </motion.div>

          {lookupMessage ? <p className="text-sm font-medium text-ink-600">{lookupMessage}</p> : null}
        </div>

        <AddBookForm
          form={form}
          onChange={onFormChange}
          onSave={onSaveBook}
          isSaving={isSaving}
          saveError={saveError}
          saveSuccess={saveSuccess}
        />
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12">
        <h2 className="mb-4 text-2xl font-bold tracking-tight text-ink-700 md:text-3xl">Current Inventory</h2>
        {isLoadingBooks ? (
          <div className="flex items-center gap-2 rounded-2xl bg-white p-5 text-base text-ink-600 shadow-sm">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Loading books...
          </div>
        ) : books.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-base text-ink-600 shadow-sm">
            No books yet. Scan one above to build your inventory.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {books.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
              >
                <BookCard book={book} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
