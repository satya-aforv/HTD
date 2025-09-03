export const getStatusBadge = (status: string) => {
  const statusLower = status.toLowerCase();

  if (
    statusLower.includes("pending") ||
    statusLower.includes("processing") ||
    statusLower.includes("ongoing") ||
    statusLower.includes("in_progress") ||
    statusLower.includes("in-progress") ||
    statusLower.includes("on-hold") ||
    statusLower.includes("on_hold") ||
    statusLower.includes("in training") ||
    statusLower.includes("HIRED") ||
    statusLower.includes("hired") ||
    statusLower.includes("in_training") ||
    statusLower.includes("IN_TRAINING") ||
    statusLower.includes("IN_TRAINING")
  ) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        {status}
      </span>
    );
  }

  if (
    statusLower.includes("active") ||
    statusLower.includes("completed") ||
    statusLower.includes("success") ||
    statusLower.includes("paid") ||
    statusLower.includes("deployed") ||
    statusLower.includes("DEPLOYED")
  ) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        {status}
      </span>
    );
  }

  if (
    statusLower.includes("declined") ||
    statusLower.includes("rejected") ||
    statusLower.includes("failed") ||
    statusLower.includes("terminated") ||
    statusLower.includes("INACTIVE") ||
    statusLower.includes("inactive") ||
    statusLower.includes("error")
  ) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        {status}
      </span>
    );
  }

  if (statusLower.includes("refunded") || statusLower.includes("cancelled")) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        {status}
      </span>
    );
  }

  // Default for unknown status
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
      {status}
    </span>
  );
};
