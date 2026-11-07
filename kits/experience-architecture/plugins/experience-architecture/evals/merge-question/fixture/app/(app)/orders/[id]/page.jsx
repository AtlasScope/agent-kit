'use client';
import { useParams, useRouter } from 'next/navigation';
import { orders, customers } from '@/lib/data';

export default function OrderPage() {
  const { id } = useParams();
  const router = useRouter();
  const order = orders.find((o) => o.id === id);
  if (!order) return <h1>Order not found</h1>;
  const customer = customers.find((c) => c.id === order.customerId);
  return (
    <>
      <button onClick={() => router.push('/orders')}>← Orders</button>
      <h1>Order {order.id}</h1>
      <p>Status: {order.status}. Customer: {customer.name}. Total: ${order.total}</p>
    </>
  );
}
