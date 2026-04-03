import { AlertCircle, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
        </div>

        <div className="flex border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors border-r border-gray-100"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-4 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Đang xử lý..." : "Xác nhận rút"}
          </button>
        </div>
      </div>
    </div>
  );
}
