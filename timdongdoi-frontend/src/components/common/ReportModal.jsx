import { useState } from "react";
import { AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { reportService } from "../../services/reportService";

const REPORT_REASONS = {
  user: [
    "Thông tin giả mạo / lừa đảo",
    "Nội dung không phù hợp",
    "Spam / quấy rối",
    "Giả mạo danh tính",
    "Lý do khác",
  ],
  job: [
    "Tin tuyển dụng giả mạo",
    "Nội dung vi phạm pháp luật",
    "Thông tin sai lệch",
    "Lừa đảo người lao động",
    "Lý do khác",
  ],
  project: [
    "Dự án lừa đảo",
    "Nội dung không phù hợp",
    "Thông tin sai lệch",
    "Vi phạm điều khoản",
    "Lý do khác",
  ],
  review: [
    "Đánh giá sai sự thật",
    "Nội dung xúc phạm",
    "Spam",
    "Vi phạm quyền riêng tư",
    "Lý do khác",
  ],
};

const TYPE_LABEL = {
  user: "người dùng",
  job: "tin tuyển dụng",
  project: "dự án",
  review: "đánh giá",
};

const ID_FIELD = {
  user: "reportedUserId",
  job: "reportedJobId",
  project: "reportedProjectId",
  review: "reportedReviewId",
};

export default function ReportModal({ type, targetId, targetName, onClose }) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const reasons = REPORT_REASONS[type] || REPORT_REASONS.user;
  const idField = ID_FIELD[type];
  const typeLabel = TYPE_LABEL[type] || type;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const reason =
      selectedReason === "Lý do khác" ? customReason.trim() : selectedReason;
    if (!reason) {
      setError("Vui lòng chọn hoặc nhập lý do báo cáo");
      return;
    }
    if (selectedReason === "Lý do khác" && reason.length < 10) {
      setError("Lý do phải có ít nhất 10 ký tự");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await reportService.createReport({ type, reason, [idField]: targetId });
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Gửi báo cáo thất bại, vui lòng thử lại",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Báo cáo {typeLabel}
              </h2>
              <p className="text-sm text-gray-500 truncate max-w-[280px]">
                {targetName}
              </p>
            </div>
          </div>
        </div>

        {success ? (
          <div className="p-10 text-center">
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">Báo cáo đã được gửi!</p>
            <p className="text-sm text-gray-400 mt-1">
              Chúng tôi sẽ xem xét trong thời gian sớm nhất.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Lý do báo cáo *
              </p>
              <div className="space-y-2">
                {reasons.map((r) => (
                  <label
                    key={r}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                      ${selectedReason === r ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={selectedReason === r}
                      onChange={() => {
                        setSelectedReason(r);
                        setCustomReason("");
                      }}
                      className="accent-red-500 shrink-0"
                    />
                    <span className="text-sm text-gray-700">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {selectedReason === "Lý do khác" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả chi tiết <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  rows={3}
                  placeholder="Mô tả rõ lý do báo cáo của bạn..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <p
                  className={`text-xs mt-1 text-right ${customReason.trim().length < 10 ? "text-red-400" : "text-gray-400"}`}
                >
                  {customReason.trim().length}/10 ký tự tối thiểu
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || !selectedReason}
                className="flex-1 py-2.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Đang gửi..." : "Gửi báo cáo"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
