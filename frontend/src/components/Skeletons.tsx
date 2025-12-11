export const TableSkeleton = () => (
  <div className="overflow-x-auto border border-gray-200 rounded-lg">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Product Code
          </th>
          <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Image
          </th>
          <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Company & Brand
          </th>
          <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Category & Type
          </th>
          <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Art & Colour
          </th>
          <th className="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Country
          </th>
          <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Timeline
          </th>
          <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Priority
          </th>
          <th className="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {[...Array(6)].map((_, i) => (
          <tr key={i} className="animate-pulse">
            <td className="px-4 md:px-6 py-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </td>
            <td className="px-4 md:px-6 py-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            </td>
            <td className="px-4 md:px-6 py-4">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </td>
            <td className="hidden lg:table-cell px-6 py-4">
              <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </td>
            <td className="px-4 md:px-6 py-4">
              <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </td>
            <td className="hidden xl:table-cell px-6 py-4">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </td>
            <td className="px-4 md:px-6 py-4">
              <div className="h-3 bg-gray-200 rounded w-24 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </td>
            <td className="px-4 md:px-6 py-4">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </td>
            <td className="px-4 md:px-6 py-4">
              <div className="h-6 bg-gray-200 rounded w-12"></div>
            </td>
            <td className="hidden xl:table-cell px-6 py-4">
              <div className="h-8 bg-gray-200 rounded w-8"></div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const MobileSkeleton = () => (
  <div className="space-y-4">
    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className="border border-gray-200 rounded-lg p-4 bg-white animate-pulse"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="flex gap-2">
                <div className="h-5 bg-gray-200 rounded w-12"></div>
                <div className="h-5 bg-gray-200 rounded w-10"></div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="w-7 h-7 bg-gray-200 rounded mb-2"></div>
            <div className="w-10 h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[...Array(4)].map((_, j) => (
            <div key={j}>
              <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-14"></div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 pt-3">
          <div className="space-y-2">
            {[...Array(3)].map((_, k) => (
              <div key={k} className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-12"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
);
