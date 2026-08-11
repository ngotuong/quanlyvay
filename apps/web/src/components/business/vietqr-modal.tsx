"use client";

import { useState } from "react";
import { QrCode, Copy, Check, X } from "lucide-react";
import { formatVnd } from "@/lib/business/format";

const popularBanks = [
  { code: "MB", name: "MBBank (NHTM CP Quân Đội)" },
  { code: "VCB", name: "Vietcombank (NHTM CP Ngoại Thương)" },
  { code: "TCB", name: "Techcombank (NHTM CP Kỹ Thương)" },
  { code: "VPB", name: "VPBank (NHTM CP Việt Nam Thịnh Vượng)" },
  { code: "ACB", name: "ACB (NHTM CP Á Châu)" },
  { code: "BIDV", name: "BIDV (NHTM CP Đầu Tư và Phát Triển)" },
  { code: "CTG", name: "VietinBank (NHTM CP Công Thương)" },
  { code: "TPB", name: "TPBank (NHTM CP Tiên Phong)" },
];

export function VietQrModal({
  title = "Tạo mã QR Chuyển khoản VietQR",
  amountVnd,
  defaultNote = "Thanh toan lai",
}: {
  title?: string;
  amountVnd: string;
  defaultNote?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [bankCode, setBankCode] = useState("MB");
  const [accountNo, setAccountNo] = useState("");
  const [accountName, setAccountName] = useState("");
  const [note, setNote] = useState(defaultNote);
  const [copiedText, setCopiedText] = useState(false);

  const numericAmount = BigInt(amountVnd || "0").toString();
  const qrUrl = accountNo
    ? `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png?amount=${numericAmount}&addInfo=${encodeURIComponent(note)}&accountName=${encodeURIComponent(accountName)}`
    : null;

  const copyReceiptText = () => {
    const text = `[PHIẾU THÔNG TIN THANH TOÁN]\nSố tiền: ${formatVnd(amountVnd)}\nNội dung: ${note}${accountNo ? `\nTài khoản: ${accountNo} (${bankCode})` : ""}${accountName ? `\nChủ TK: ${accountName}` : ""}`;
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <>
      <button
        type="button"
        className="secondary-button compact-button flex items-center gap-1.5"
        onClick={() => setIsOpen(true)}
      >
        <QrCode size={16} />
        <span>VietQR / Tạo phiếu</span>
      </button>

      {isOpen ? (
        <div className="dialog-backdrop" onClick={() => setIsOpen(false)}>
          <div className="dialog-content surface-card max-w-lg w-full p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="text-indigo-600" size={22} />
                <h3 className="font-bold text-lg">{title}</h3>
              </div>
              <button type="button" className="icon-button" onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="field-group">
                <label>Số tiền thanh toán</label>
                <input type="text" readOnly value={formatVnd(amountVnd)} className="font-bold text-indigo-600 bg-slate-50 dark:bg-slate-900" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="field-group">
                  <label>Ngân hàng nhận</label>
                  <select value={bankCode} onChange={(e) => setBankCode(e.target.value)}>
                    {popularBanks.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-group">
                  <label>Số tài khoản nhận</label>
                  <input
                    type="text"
                    value={accountNo}
                    onChange={(e) => setAccountNo(e.target.value)}
                    placeholder="Nhập số tài khoản..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="field-group">
                  <label>Tên chủ tài khoản (không dấu)</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="VD: NGO TUONG"
                  />
                </div>

                <div className="field-group">
                  <label>Nội dung chuyển khoản</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Nội dung chuyển tiền..."
                  />
                </div>
              </div>

              {qrUrl ? (
                <div className="flex flex-col items-center justify-center p-4 border rounded-xl bg-white dark:bg-slate-950 space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrUrl} alt="Mã QR VietQR Napas247" className="max-w-[240px] h-auto rounded-lg shadow-sm" />
                  <p className="text-xs text-slate-500 text-center">Quét bằng ứng dụng của 40+ ngân hàng Việt Nam (Napas247)</p>
                </div>
              ) : (
                <div className="p-4 border border-dashed rounded-xl text-center text-sm text-slate-500">
                  Nhập <strong>Số tài khoản nhận</strong> để hiển thị mã QR VietQR tự động.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <button
                type="button"
                className="secondary-button flex items-center gap-1.5"
                onClick={copyReceiptText}
              >
                {copiedText ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                <span>{copiedText ? "Đã sao chép" : "Sao chép phiếu văn bản"}</span>
              </button>

              <button type="button" className="primary-button" onClick={() => setIsOpen(false)}>
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
