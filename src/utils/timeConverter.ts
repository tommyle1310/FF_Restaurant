import React from "react";

// Hàm chuyển timestamp (giây) thành "Tuesday, 08th March, 2025"
export const formatTimestampToDate = (timestamp: number): string => {
  // Chuyển từ giây sang mili giây
  const date = new Date(timestamp * 1000);

  // Lấy thông tin
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayName = days[date.getUTCDay()];
  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  // Thêm hậu tố "th", "st", "nd", "rd"
  const getDaySuffix = (day: number) => {
    if (day >= 11 && day <= 13) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const formattedDay = `${day}${getDaySuffix(day)}`; // Ví dụ: "8th"
  const paddedDay = day.toString().padStart(2, "0"); // Đảm bảo 2 chữ số: "08"

  return `${dayName}, ${paddedDay} ${month}, ${year}`;
};

export const formatTimestampToDate2 = (timestamp: number) => {
  // Validate timestamp
  if (!timestamp || timestamp === 0 || isNaN(timestamp)) {
    return "Invalid Date";
  }

  // Auto-detect if timestamp is in seconds or milliseconds
  // If timestamp length is 10 digits, it's seconds (e.g., 1640995200)
  // If timestamp length is 13 digits, it's milliseconds (e.g., 1640995200000)
  const timestampStr = timestamp.toString();
  let dateTimestamp = timestamp;

  if (timestampStr.length === 10) {
    // Convert seconds to milliseconds
    dateTimestamp = timestamp * 1000;
  } else if (timestampStr.length === 13) {
    // Already in milliseconds
    dateTimestamp = timestamp;
  } else {
    // Invalid timestamp format
    return "Invalid Date";
  }

  const date = new Date(dateTimestamp);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  const options: Intl.DateTimeFormatOptions = {
    weekday: "long", // "Monday"
    day: "2-digit", // "09"
    month: "short", // "Sep" (3 chữ cái)
    year: "numeric", // "2025"
  };
  return date.toLocaleDateString("en-US", options);
};
