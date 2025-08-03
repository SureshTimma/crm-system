import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface CompanyData {
  company: string;
  contacts: number;
}

interface ContactsByCompanyChartProps {
  data: CompanyData[];
}

const ContactsByCompanyChart: React.FC<ContactsByCompanyChartProps> = ({
  data,
}) => {
  // Debug: Log the data to see what we're receiving
  console.log("ContactsByCompany data:", data);

  // Show empty state if no data
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Top 5 Companies by Contacts
        </h2>
        <div className="flex items-center justify-center h-[300px] text-gray-500">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p>No company data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Top 5 Companies by Contacts
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: -20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="company"
            type="category"
            tick={{ fontSize: 10 }}
            height={80}
            interval={0}
            angle={-45}
            textAnchor="end"
          />
          <YAxis
            dataKey="contacts"
            type="number"
            domain={[0, "dataMax + 1"]}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value) => [value, "Contacts"]}
            labelFormatter={(label) => `Company: ${label}`}
          />
          <Bar
            dataKey="contacts"
            fill="#3B82F6"
            radius={[4, 4, 0, 0]}
            minPointSize={2}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ContactsByCompanyChart;
