'use server';

// marcar que todas las funciones que se exportan de este archivo son de servidor y por lo tanto no se ejecutan ni se envian al cliente

import { z } from 'zod';
import { Invoice } from './definitions';
import { sql } from '@vercel/postgres';
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache';

const CreateInvoiceSchema = z.object({
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
  id: z.string(),
});

const CreateInvoiceFormSchema = CreateInvoiceSchema.omit({
  date: true,
  id: true,
});

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoiceFormSchema.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCentes = amount * 100;
  const [date] = new Date().toISOString().split('T');

  // const rawFormData =CreateInvoiceFormSchema.parse(Object.fromEntries(formData.entries()));
  // const rawFormData = Object.fromEntries(formData.entries());

  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCentes}, ${status}, ${date})
  `

  // esto sirve para decirle que esa ruta tiene datos nuevos y tiene que cargarlos otra vez, porque sino next por default cachea los datos y te muestra siempre los mismos
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices')
}
