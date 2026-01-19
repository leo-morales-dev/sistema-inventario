import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  percentage: string;
  isPositive: boolean;
  period: string;
  icon: React.ReactNode;
  iconBgColor: string;
}

const StatCard = ({ title, value, percentage, isPositive, period, icon, iconBgColor }: StatCardProps) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xl shadow-gray-200/50 dark:shadow-black/20 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
          <div className="flex flex-col gap-1">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
              <p className="text-sm font-medium">
                  <span className={isPositive ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-rose-400"}>
                      {percentage}
                  </span>
                  <span className="text-gray-400 dark:text-slate-500 ml-1.5">{period}</span>
              </p>
          </div>
        </div>
        <div className={`p-3 rounded-xl text-white shadow-lg ${iconBgColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;