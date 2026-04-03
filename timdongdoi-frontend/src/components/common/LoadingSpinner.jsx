export default function LoadingSpinner({ text = "Đang tải..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}
