import { redirect } from 'next/navigation';

export default function CustomersRedirectPage() {
  redirect('/factory/quotations/customers');
}
