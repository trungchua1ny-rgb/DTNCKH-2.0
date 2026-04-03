export const APP_NAME = "TimĐồngĐội";
export const APP_SLOGAN = "Kết nối tài năng - Xây dựng tương lai";

export const ROLES = {
  USER: "user",
  COMPANY: "company",
  ADMIN: "admin",
};

export const JOB_TYPES = [
  { value: "full_time", label: "Toàn thời gian" },
  { value: "part_time", label: "Bán thời gian" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Thực tập" },
];

export const JOB_LEVELS = [
  { value: "intern", label: "Thực tập sinh" },
  { value: "fresher", label: "Fresher" },
  { value: "junior", label: "Junior" },
  { value: "middle", label: "Middle" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead/Manager" },
];

export const LOCATION_TYPES = [
  { value: "onsite", label: "Tại văn phòng" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

export const APPLICATION_STATUSES = {
  pending: { label: "Chờ xét duyệt", color: "bg-yellow-100 text-yellow-800" },
  reviewing: { label: "Đang xem xét", color: "bg-blue-100 text-blue-800" },
  interview: { label: "Phỏng vấn", color: "bg-purple-100 text-purple-800" },
  accepted: { label: "Đã chấp nhận", color: "bg-green-100 text-green-800" },
  rejected: { label: "Từ chối", color: "bg-red-100 text-red-800" },
};

export const COMPANY_SIZES = [
  { value: "1-10", label: "1 - 10 nhân viên" },
  { value: "11-50", label: "11 - 50 nhân viên" },
  { value: "51-200", label: "51 - 200 nhân viên" },
  { value: "201-500", label: "201 - 500 nhân viên" },
  { value: "501-1000", label: "501 - 1000 nhân viên" },
  { value: "1000+", label: "Trên 1000 nhân viên" },
];
export const PROJECT_TYPES = [
  { value: "startup", label: "Startup" },
  { value: "freelance", label: "Freelance" },
  { value: "research", label: "Nghiên cứu" },
  { value: "social", label: "Dự án xã hội" },
  { value: "other", label: "Khác" },
];

export const COMPENSATION_TYPES = [
  { value: "paid", label: "Có thù lao" },
  { value: "equity", label: "Cổ phần" },
  { value: "volunteer", label: "Tình nguyện" },
  { value: "negotiable", label: "Thương lượng" },
];

export const PROJECT_STATUSES = {
  open: { label: "Đang tuyển", color: "bg-green-100 text-green-700" },
  in_progress: { label: "Đang thực hiện", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Hoàn thành", color: "bg-gray-100 text-gray-600" },
  closed: { label: "Đã đóng", color: "bg-red-100 text-red-600" },
};

export const PROJECT_APPLICATION_STATUSES = {
  pending: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-700" },
  accepted: { label: "Đã nhận", color: "bg-green-100 text-green-700" },
  rejected: { label: "Từ chối", color: "bg-red-100 text-red-600" },
};
