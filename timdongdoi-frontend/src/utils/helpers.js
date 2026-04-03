export const formatSalary = (min, max, currency = "VND") => {
  if (!min && !max) return "Thỏa thuận";
  const fmt = (n) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(0)}tr`
      : `${(n / 1_000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} - ${fmt(max)} ${currency}`;
  if (min) return `Từ ${fmt(min)} ${currency}`;
  return `Đến ${fmt(max)} ${currency}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return formatDate(dateStr);
};

export const getAvatarFallback = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export const truncate = (str, n = 100) =>
  str?.length > n ? str.slice(0, n) + "..." : str;
