import React from "react";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  totalPages,
  currentPage,
  onPageChange,
}) => {
  // Generate array of page numbers
  const getPageNumbers = () => {
    const pageNumbers = [];
    if (totalPages <= 5) {
      // If total pages is 5 or less, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);

      // If current page is among first 3 pages
      if (currentPage <= 3) {
        pageNumbers.push(2, 3, 4, "...", totalPages);
      }
      // If current page is among last 3 pages
      else if (currentPage >= totalPages - 2) {
        pageNumbers.push(
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      }
      // If current page is in middle
      else {
        pageNumbers.push(
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
      }
    }
    return pageNumbers;
  };

  return (
    <div className="flex justify-center items-center space-x-2 my-4">
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded-lg ${
          currentPage === 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
        } border border-gray-300`}
      >
        {"<"}
      </button>

      {/* Page numbers */}
      <div className="flex space-x-2">
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() =>
              typeof page === "number" ? onPageChange(page) : null
            }
            disabled={page === "..."}
            className={`px-3 py-1 rounded-lg border ${
              page === currentPage
                ? "bg-blue-500 text-white border-blue-500"
                : page === "..."
                  ? "bg-white text-gray-700 cursor-default"
                  : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300 cursor-pointer"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded-lg ${
          currentPage === totalPages
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
        } border border-gray-300`}
      >
        {">"}
      </button>
    </div>
  );
};

export default Pagination;
