import { Resend } from 'resend';
import { renderToBuffer } from '@react-pdf/renderer';
import ReceiptPDF from './ReceiptPDF';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReceiptWithPDF({ to, name, email, plushie, qty, total }) {
  const date = new Date().toLocaleDateString();
  const pdfBuffer = await renderToBuffer(
    <ReceiptPDF name={name} email={email} plushie={plushie} qty={qty} total={total} date={date} />
  );

  await resend.emails.send({
    from: 'Ploosh <onboarding@resend.dev>',
    to,
    subject: 'Your Receipt – Ploosh Preorder 🧸',
    html: `<p>Hi ${name},</p><p>Thanks for your preorder! Your receipt is attached below.</p>`,
    attachments: [
      {
        filename: 'Ploosh-Receipt.pdf',
        content: pdfBuffer.toString('base64'),
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  });

  console.log("📧 Receipt sent to", to);
}
