
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon, ArrowRightIcon } from 'lucide-react';

interface TrendProps {
  value: number;
  isPositive: boolean;
}

interface MetricCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  trend?: TrendProps | 'increase' | 'decrease' | 'neutral';
  percentage?: string;
  description?: string;
  className?: string;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend, 
  percentage, 
  description,
  className,
  onClick 
}) => {
  // Process the trend prop to handle both string and object formats
  const trendObject = typeof trend === 'object' ? trend : 
                      trend === 'increase' ? { value: 0, isPositive: true } :
                      trend === 'decrease' ? { value: 0, isPositive: false } :
                      trend === 'neutral' ? { value: 0, isPositive: true } : 
                      undefined;

  // Render trend icon based on the trend object
  const renderTrendIcon = () => {
    if (!trendObject) return null;
    
    if (trendObject.isPositive) {
      return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
    } else {
      return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Card 
      className={`${className || ''} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`} 
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && <div className="p-2 bg-primary/10 rounded-full">{icon}</div>}
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold">{value}</div>
          {(trend || percentage) && (
            <div className="flex items-center mt-1">
              {renderTrendIcon()}
              {trendObject && (
                <span className={`text-xs font-medium ${trendObject.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {trendObject.value > 0 ? `${trendObject.value}%` : percentage}
                </span>
              )}
              {description && (
                <span className="text-xs text-muted-foreground ml-1">{description}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
