import React from 'react';
import { Download, Upload, Trash2, FileSpreadsheet } from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { exportData, saveData, loadData } from '../storage';
import { AppData } from '../types';

interface SettingsPageProps {
  onDataChange: () => void;
}

export default function SettingsPage({ onDataChange }: SettingsPageProps) {

  // --- XLSX EXPORT (Zahira olish) ---
  const handleExportXLSX = () => {
    const currentData = JSON.parse(exportData()) as AppData;

    // 1. Workbook yaratamiz
    const wb = utils.book_new();

    // 2. Ma'lumotlarni alohida varaqlarga ajratamiz
    const wsTransactions = utils.json_to_sheet(currentData.transactions);
    const wsWallets = utils.json_to_sheet(currentData.wallets);
    const wsCategories = utils.json_to_sheet(currentData.categories);

    // 3. Varaqlarni kitobga qo'shamiz
    utils.book_append_sheet(wb, wsTransactions, "Tranzaksiyalar");
    utils.book_append_sheet(wb, wsWallets, "Hamyonlar");
    utils.book_append_sheet(wb, wsCategories, "Kategoriyalar");

    // 4. Faylni yuklab beramiz
    const date = new Date().toISOString().split('T')[0];
    writeFile(wb, `Moliya-Zahira-${date}.xlsx`);
  };

  // --- XLSX IMPORT (Tiklash) ---
  const handleImportXLSX = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });

        // Varaqlarni o'qib olish
        const transactions = utils.sheet_to_json(workbook.Sheets["Tranzaksiyalar"] || {});
        const wallets = utils.sheet_to_json(workbook.Sheets["Hamyonlar"] || {});
        const categories = utils.sheet_to_json(workbook.Sheets["Kategoriyalar"] || {});

        if (!transactions.length && !wallets.length) {
          throw new Error("Fayl ichi bo'sh yoki noto'g'ri formatda");
        }

        // Yangi ma'lumotlarni shakllantirish
        const newAppData: AppData = {
          // @ts-ignore - Import qilingan ma'lumotlarni tipga moslash
          transactions: transactions,
          // @ts-ignore
          wallets: wallets,
          // @ts-ignore
          categories: categories.length > 0 ? categories : loadData().categories, // Kategoriya bo'lmasa eskisini oladi
          settings: { apiKey: '' }
        };

        // Xotiraga saqlash va yangilash
        saveData(newAppData);
        alert("Ma'lumotlar Excel fayldan muvaffaqiyatli tiklandi!");
        onDataChange();

      } catch (error) {
        console.error(error);
        alert("Xatolik: Excel fayl formati noto'g'ri!");
      }
    };
    reader.readAsArrayBuffer(file);
    // Inputni tozalash (qayta yuklash uchun)
    event.target.value = '';
  };

  const handleClearData = () => {
    if (window.confirm("Rostdan ham barcha ma'lumotlarni o'chirmoqchimisiz?")) {
      localStorage.clear();
      onDataChange();
      alert("Barcha ma'lumotlar tozalandi.");
    }
  };

  return (
    <div className="p-4 space-y-4 pb-24 pt-safe">
      <h1 className="text-2xl font-bold text-white mb-6">Sozlamalar</h1>

      {/* Excel Export/Import Blok */}
      <div className="bg-gray-800 rounded-xl p-4 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileSpreadsheet className="text-green-500" />
          Excel Zahira (Backup)
        </h2>
        
        <button
          onClick={handleExportXLSX}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Download size={20} />
          Excelga Yuklash (.xlsx)
        </button>

        <label className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer">
          <Upload size={20} />
          Exceldan Tiklash
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleImportXLSX}
            className="hidden"
          />
        </label>
        
        <p className="text-xs text-gray-500 text-center">
          Ogohlantirish: Tiklash jarayoni mavjud ma'lumotlarni o'chirib yuboradi.
        </p>
      </div>

      {/* Xavfli Hudud */}
      <div className="bg-gray-800 rounded-xl p-4 border border-red-900/30">
        <div className="flex items-center gap-3 mb-3">
          <Trash2 size={20} className="text-red-500" />
          <h2 className="text-lg font-semibold text-white">Xavfli hudud</h2>
        </div>
        <button
          onClick={handleClearData}
          className="w-full bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white border border-red-600 py-3 rounded-lg font-medium active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Trash2 size={20} />
          Barchasini o'chirish
        </button>
      </div>

      <div className="text-center text-gray-500 text-sm pt-4">
        Hisobchi AI v1.0.2 (Excel Edition) <br />
        Senior Dev tomonidan yaratildi
      </div>
    </div>
  );
}
