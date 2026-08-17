'use client';

import React, { useEffect, useState } from 'react';
import { AdminOnlineOrdersTestBench } from '@/src/components/admin/AdminOnlineOrdersTestBench';
import { supabase } from '@/src/lib/supabase';
import { Order, OrderStatus } from '@/src/types';

export default function AdminOnlineOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders for admin bench:', error);
        return;
      }

      if (data) {
        const active = data.filter((o: any) => o.status !== 'completed' && o.status !== 'cancelled');
        setOrders(active);
        setAllOrders(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Realtime Supabase Subscription
    const channel = supabase
      .channel('admin_online_orders_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    // Optimistic local update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));

    await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);
  };

  return (
    <div className="min-h-screen bg-[#070708] text-white">
      <AdminOnlineOrdersTestBench
        orders={orders}
        allOrders={allOrders}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
