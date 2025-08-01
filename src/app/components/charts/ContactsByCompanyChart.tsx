import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Top 5 Companies by Contacts
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="company" type="category" width={120} />
          <Tooltip />
          <Bar dataKey="contacts" fill="#3B82F6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ContactsByCompanyChart;
