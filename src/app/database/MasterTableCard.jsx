"use client";
import { useState } from "react";
import { saveMasterData, deleteMasterData } from "@/actions/master.action";

export default function MasterTableCard({ title, table, data, isKapal }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);

  async function handleDelete(id) {
    if (confirm("Yakin hapus data ini?")) {
      const res = await deleteMasterData(table, id);
      if (!res.success) alert(res.message);
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs font-bold uppercase tracking-wider">{title}</p>
        <button
          onClick={() => {
            setEditingData(null);
            setIsOpen(true);
          }}
          className="text-[#2e004f] font-bold text-xs"
        >
          + Tambah
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {data.map((item) => (
          <div
            key={Object.values(item)[0]}
            className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm"
          >
            <span>{item[Object.keys(item)[1]]}</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingData(item);
                  setIsOpen(true);
                }}
                className="p-1 hover:bg-gray-200"
              >
                ✎
              </button>
              <button
                onClick={() => handleDelete(Object.values(item)[0])}
                className="p-1 hover:bg-red-200 text-red-600"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <form
            action={async (fd) => {
              fd.append("table", table);
              if (editingData) fd.append("id", Object.values(editingData)[0]);
              await saveMasterData(table, fd);
              setIsOpen(false);
            }}
            className="bg-white p-8 rounded-xl w-96 flex flex-col gap-4"
          >
            <h2 className="font-bold">
              {editingData ? "Edit" : "Tambah"} {title}
            </h2>

            <input
              name={Object.keys(data[0] || {})[1]}
              defaultValue={editingData ? Object.values(editingData)[1] : ""}
              placeholder="Nama"
              className="p-2 border rounded"
              required
            />

            {isKapal && (
              <>
                <input
                  name="flat_bottom"
                  type="number"
                  defaultValue={editingData?.flat_bottom}
                  placeholder="Flat Bottom"
                  className="p-2 border rounded"
                />
                <input
                  name="vertical_side"
                  type="number"
                  defaultValue={editingData?.vertical_side}
                  placeholder="Vertical Side"
                  className="p-2 border rounded"
                />
                <input
                  name="topside"
                  type="number"
                  defaultValue={editingData?.topside}
                  placeholder="Topside"
                  className="p-2 border rounded"
                />
                <input
                  name="bottop"
                  type="number"
                  defaultValue={editingData?.bottop}
                  placeholder="Bottop"
                  className="p-2 border rounded"
                />
              </>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#2e004f] text-white rounded"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
