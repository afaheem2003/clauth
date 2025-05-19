import { Resend } from 'resend';
import { renderToBuffer } from '@react-pdf/renderer';
import ReceiptPDF from './ReceiptPDF';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReceiptWithPDF({ to, name, email, itemName, qty, total }) {
  const date = new Date().toLocaleDateString();
  const pdfBuffer = await renderToBuffer(
    <ReceiptPDF name={name} email={email} itemName={itemName} qty={qty} total={total} date={date} />
  );

  await resend.emails.send({
    from: 'Clauth <onboarding@resend.dev>',
    to,
    subject: 'Your Receipt – Clauth Preorder 🛍️',
    html: `<p>Hi ${name},</p><p>Thanks for your preorder! Your receipt is attached below.</p>`,
    attachments: [
      {
        filename: 'Clauth-Receipt.pdf',
        content: pdfBuffer.toString('base64'),
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  });

  console.log("📧 Receipt sent to", to);
}
