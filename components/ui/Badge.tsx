import React from 'react';
import { OrderStatus } from '../../types';

interface BadgeProps {
  status: OrderStatus;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const getColor = () => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OrderStatus.PREPARING: return 'bg-blue-100 text-blue-800 border-blue-200';
      case OrderStatus.READY: return 'bg-green-100 text-green-800 border-green-200';
      case OrderStatus.SERVED: return 'bg-gray-100 text-gray-800 border-gray-200';
      case OrderStatus.CLOSED: return 'bg-gray-800 text-white border-gray-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getColor()}`}>
      {status}
    </span>
  );
};