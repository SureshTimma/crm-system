import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TimelineData {
  date: string;
  day: number;
  activities: number;
}

interface ActivitiesTimelineChartProps {
  data: TimelineData[];
}

const ActivitiesTimelineChart: React.FC<ActivitiesTimelineChartProps> = ({
  data,
}) => {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Activities Timeline (Last 30 Days)
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip
            labelFormatter={(value) => `Day ${value}`}
            formatter={(value) => [value, "Activities"]}
          />
          <Line
            type="monotone"
            dataKey="activities"
            stroke="#10B981"
            strokeWidth={3}
            dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ActivitiesTimelineChart;
