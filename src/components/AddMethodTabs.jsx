import clsx from "clsx";
import { BookUp, Camera, ScanLine } from "lucide-react";

const methods = [
  { key: "isbn", label: "ISBN", icon: BookUp },
  { key: "qr", label: "QR Scan", icon: ScanLine },
  { key: "photo", label: "Photo", icon: Camera },
];

function AddMethodTabs({ activeMethod, onMethodChange }) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-2 shadow-sm">
      {methods.map((method) => {
        const Icon = method.icon;
        return (
          <button
            key={method.key}
            type="button"
            onClick={() => onMethodChange(method.key)}
            className={clsx(
              "min-h-[44px] rounded-xl px-3 py-3 text-base font-medium transition-all",
              "flex items-center justify-center gap-2",
              activeMethod === method.key
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-page-200 text-ink-600 hover:bg-brand-100"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{method.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default AddMethodTabs;
