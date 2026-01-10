interface RatingBadgeProps {
  rating: number; // Rating value between 0 and 1 (e.g., 0.85 for 85%)
  className?: string;
}

export function RatingBadge({ rating, className = "" }: RatingBadgeProps) {
  const percentage = rating * 100;
  
  if (percentage === 0) return null;
  
  let bgColor = "bg-gray-100 dark:bg-gray-800";
  let textColor = "text-gray-600 dark:text-gray-400";

  if (percentage >= 80) {
    bgColor = "bg-green-100 dark:bg-green-900/30";
    textColor = "text-green-700 dark:text-green-400";
  } else if (percentage >= 60) {
    bgColor = "bg-blue-100 dark:bg-blue-900/30";
    textColor = "text-blue-700 dark:text-blue-400";
  } else if (percentage >= 40) {
    bgColor = "bg-yellow-100 dark:bg-yellow-900/30";
    textColor = "text-yellow-700 dark:text-yellow-400";
  } else if (percentage >= 20) {
    bgColor = "bg-orange-100 dark:bg-orange-900/30";
    textColor = "text-orange-700 dark:text-orange-400";
  } else {
    bgColor = "bg-red-100 dark:bg-red-900/30";
    textColor = "text-red-700 dark:text-red-400";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 ${bgColor} ${textColor} rounded-full text-xs font-medium ${className}`}
    >
      {percentage.toFixed(0)}%
    </span>
  );
}
