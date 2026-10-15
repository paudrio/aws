import { Resend } from 'resend';
import { db } from '../db/index';
import { settings } from '@shared/schema';

const getResend = (): Resend | null => {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
};

async function getEmailSettings(): Promise<{ domain: string; whatsapp: string }> {
  try {
    const rows = await db.select().from(settings);
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    return {
      domain: map.siteDomain || 'paudronix.foo',
      whatsapp: map.whatsappNumber || '+502 3787 1216',
    };
  } catch {
    return { domain: 'paudronix.foo', whatsapp: '+502 3787 1216' };
  }
}

const getFromAddress = () => {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@paudronix.foo';
  return `PAUDRONIX GT <${fromEmail}>`;
};

const canSendEmail = () => true;

async function sendEmail(to: string, subject: string, html: string, text?: string, attachments?: { filename: string; content: string }[]): Promise<void> {
  const client = getResend();
  if (!client) {
    console.error('[MAIL] ERROR: No se pudo crear cliente Resend. KEY faltante.');
    return;
  }
  try {
    const cfg = await getEmailSettings();
    html = html.replace(/paudronix\.foo/g, cfg.domain).replace(/\+502 3787 1216/g, cfg.whatsapp);
    if (text) text = text.replace(/paudronix\.foo/g, cfg.domain).replace(/\+502 3787 1216/g, cfg.whatsapp);
    const payload: any = { from: getFromAddress(), to, subject, html };
    if (text) payload.text = text;
    if (attachments && attachments.length > 0) payload.attachments = attachments;
    const result = await client.emails.send(payload);
    if (result.error) {
      console.error(`[MAIL] ERROR enviando a ${to} | Asunto: "${subject}" | Error: ${JSON.stringify(result.error)}`);
    } else {
      console.log(`[MAIL] OK enviado a ${to} | Asunto: "${subject}" | ID: ${result.data?.id}`);
    }
  } catch (err: any) {
    console.error(`[MAIL] EXCEPCION enviando a ${to} | Asunto: "${subject}" | ${err?.message || err}`);
  }
}

export async function sendBackupEmail(backupJson: string, date: string): Promise<void> {
  if (!canSendEmail() || !process.env.ADMIN_EMAIL) return;
  const filename = `paudronix-backup-${date}.json`;
  const content = Buffer.from(backupJson).toString("base64");
  await sendEmail(
    process.env.ADMIN_EMAIL,
    `📦 Respaldo automático PAUDRONIX GT — ${date}`,
    `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#fffbf5;padding:32px;">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #fed7aa;">
        <h2 style="color:#ea580c;font-size:22px;font-weight:900;margin:0 0 16px;">📦 Respaldo automático de PAUDRONIX GT</h2>
        <p style="color:#374151;font-size:15px;margin:0 0 12px;">Se generó automáticamente el respaldo completo de tu plataforma.</p>
        <p style="color:#374151;font-size:15px;margin:0 0 12px;"><strong>Fecha:</strong> ${date}</p>
        <p style="color:#374151;font-size:14px;margin:0 0 20px;">El archivo <strong>${filename}</strong> está adjunto a este correo. Guárdalo en un lugar seguro (Google Drive, USB, etc.).</p>
        <p style="color:#6b7280;font-size:12px;margin:0;">Contiene: usuarios, suscripciones, pedidos, transacciones, productos, juegos y más. Sin contraseñas.</p>
      </div>
    </body></html>`,
    `Respaldo automático PAUDRONIX GT — ${date}\n\nEl archivo ${filename} está adjunto. Guárdalo en un lugar seguro.`,
    [{ filename, content }]
  );
}

/* ─────────────────────────────────────────────────────────────
   BASE TEMPLATES  (light = para usuarios  /  dark = para admin)
───────────────────────────────────────────────────────────── */

const emailBaseLight = (content: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>PAUDRONIX GT</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f0;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#ea580c 0%,#c2410c 100%);padding:32px 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:26px;font-weight:900;letter-spacing:2px;color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;">PAUDRONIX</span>
                  <span style="font-size:26px;font-weight:900;letter-spacing:2px;color:#fff3e0;font-family:'Helvetica Neue',Arial,sans-serif;"> GT</span>
                  <p style="color:#fde8d0;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;margin:5px 0 0;">Tu plataforma digital de confianza</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CONTENT -->
        <tr>
          <td style="background-color:#ffffff;padding:36px 40px;">
            ${content}
          </td>
        </tr>

        <!-- DIVIDER -->
        <tr>
          <td style="background-color:#ffffff;padding:0 40px;">
            <div style="border-top:2px solid #ea580c;opacity:0.15;"></div>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background-color:#1a1a1a;padding:24px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align:center;">
                  <p style="color:#ffffff;font-size:14px;font-weight:700;margin:0 0 4px;letter-spacing:1px;">PAUDRONIX GT</p>
                  <p style="color:#9ca3af;font-size:12px;margin:0 0 8px;">paudronix.foo &nbsp;|&nbsp; WhatsApp: +502 3787 1216</p>
                  <p style="color:#6b7280;font-size:11px;margin:0;">© 2026 PAUDRONIX GT — Todos los derechos reservados</p>
                  <p style="color:#4b5563;font-size:10px;margin:8px 0 0;line-height:1.5;">Este correo fue enviado automáticamente. Por favor no respondas directamente a este mensaje.<br>Para soporte, visítanos en la plataforma o escríbenos por WhatsApp.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

const emailBase = (content: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>PAUDRONIX GT</title>
</head>
<body style="margin:0;padding:0;background-color:#111111;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#111111;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">

        <tr>
          <td style="background:linear-gradient(135deg,#ea580c 0%,#c2410c 100%);padding:28px 40px;">
            <span style="font-size:24px;font-weight:900;letter-spacing:2px;color:#ffffff;">PAUDRONIX</span>
            <span style="font-size:24px;font-weight:900;letter-spacing:2px;color:#fff3e0;"> GT</span>
            <p style="color:#fde8d0;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;margin:5px 0 0;">Panel de Administración</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#1a1a1a;padding:36px 40px;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="background-color:#111111;padding:20px 40px;text-align:center;border-top:1px solid #2a2a2a;">
            <p style="color:#4b5563;font-size:11px;margin:0;">© 2026 PAUDRONIX GT — Notificación interna del sistema</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

/* ─────────────────────────────────────────────────────────────
   HELPER COMPONENTS
───────────────────────────────────────────────────────────── */

const heading = (text: string) =>
  `<h2 style="color:#ffffff;font-size:22px;margin:0 0 20px;font-weight:700;">${text}</h2>`;

const paragraph = (text: string) =>
  `<p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 16px;">${text}</p>`;

const headingLight = (text: string) =>
  `<h2 style="color:#111827;font-size:21px;margin:0 0 18px;font-weight:800;letter-spacing:-0.3px;">${text}</h2>`;

const paragraphLight = (text: string) =>
  `<p style="color:#4b5563;font-size:15px;line-height:1.75;margin:0 0 14px;">${text}</p>`;

const infoBoxLight = (rows: { label: string; value: string }[]) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:18px 0;">
    ${rows.map((r, i) => `
    <tr>
      <td style="padding:12px 18px;color:#6b7280;font-size:13px;${i < rows.length - 1 ? 'border-bottom:1px solid #e5e7eb;' : ''}width:45%;background:#f9fafb;font-weight:500;">${r.label}</td>
      <td style="padding:12px 18px;color:#111827;font-size:14px;font-weight:700;${i < rows.length - 1 ? 'border-bottom:1px solid #e5e7eb;' : ''}">${r.value}</td>
    </tr>`).join('')}
  </table>`;

const alertBoxLight = (text: string, type: 'success' | 'warning' | 'danger' | 'info' = 'info') => {
  const colors = {
    success: { bg: '#f0fdf4', border: '#16a34a', icon: '✅', text: '#15803d' },
    warning: { bg: '#fffbeb', border: '#d97706', icon: '⚠️', text: '#92400e' },
    danger:  { bg: '#fef2f2', border: '#dc2626', icon: '🚫', text: '#991b1b' },
    info:    { bg: '#fff7ed', border: '#ea580c', icon: 'ℹ️', text: '#9a3412' },
  };
  const c = colors[type];
  return `<div style="background:${c.bg};border-left:4px solid ${c.border};border-radius:6px;padding:13px 18px;margin:18px 0;">
    <p style="color:${c.text};font-size:14px;margin:0;font-weight:500;line-height:1.6;">${c.icon}&nbsp; ${text}</p>
  </div>`;
};

const infoBox = (rows: { label: string; value: string }[]) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#252525;border-radius:10px;overflow:hidden;margin:20px 0;">
    ${rows.map(r => `
    <tr>
      <td style="padding:12px 18px;color:#9ca3af;font-size:13px;border-bottom:1px solid #333;width:40%;font-weight:500;">${r.label}</td>
      <td style="padding:12px 18px;color:#f1f5f9;font-size:14px;font-weight:700;border-bottom:1px solid #333;">${r.value}</td>
    </tr>`).join('')}
  </table>`;

const alertBox = (text: string, type: 'success' | 'warning' | 'danger' | 'info' = 'info') => {
  const colors = {
    success: { bg: '#052e16', border: '#16a34a', icon: '✅', text: '#86efac' },
    warning: { bg: '#1c1100', border: '#d97706', icon: '⚠️', text: '#fcd34d' },
    danger:  { bg: '#1c0505', border: '#dc2626', icon: '🚫', text: '#fca5a5' },
    info:    { bg: '#1a0f00', border: '#ea580c', icon: 'ℹ️', text: '#fdba74' },
  };
  const c = colors[type];
  return `<div style="background:${c.bg};border-left:4px solid ${c.border};border-radius:6px;padding:14px 18px;margin:20px 0;">
    <p style="color:${c.text};font-size:14px;margin:0;">${c.icon} ${text}</p>
  </div>`;
};

/* ─────────────────────────────────────────────────────────────
   EMAILS — USUARIOS
───────────────────────────────────────────────────────────── */

export async function sendNewsletterEmail(email: string, firstName: string, subject: string, body: string): Promise<void> {
  if (!canSendEmail()) return;
  try {
    await sendEmail(
      email,
      subject,
      emailBaseLight(`
        ${headingLight(subject)}
        <div style="color:#374151;font-size:15px;line-height:1.8;white-space:pre-wrap;margin:0 0 24px;">${body.replace(/\n/g, '<br>')}</div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
          Este correo fue enviado desde PAUDRONIX GT · 
          <a href="https://paudronix.foo" style="color:#6366f1;text-decoration:none;">paudronix.foo</a>
        </p>
      `),
      `${subject}\n\n${body}\n\n— PAUDRONIX GT`
    );
  } catch (err) { console.log("Newsletter email failed:", err); }
}

/**
 * Envío masivo usando la API batch de Resend.
 * Hasta 100 correos por llamada → mucho más confiable que envíos individuales.
 * Incluye reintento automático en caso de error temporal.
 */
export async function sendNewsletterBatch(
  recipients: { email: string; firstName: string }[],
  subject: string,
  body: string
): Promise<{ sent: number; failed: number }> {
  const client = getResend();
  if (!client) {
    console.error('[NEWSLETTER-BATCH] No hay RESEND_API_KEY configurada');
    return { sent: 0, failed: recipients.length };
  }

  const cfg = await getEmailSettings();
  const from = getFromAddress();
  const htmlBody = emailBaseLight(`
    ${headingLight(subject)}
    <div style="color:#374151;font-size:15px;line-height:1.8;white-space:pre-wrap;margin:0 0 24px;">${body.replace(/\n/g, '<br>').replace(/paudronix\.foo/g, cfg.domain)}</div>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
    <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
      Este correo fue enviado desde PAUDRONIX GT · 
      <a href="https://${cfg.domain}" style="color:#6366f1;text-decoration:none;">${cfg.domain}</a>
    </p>
  `).replace(/paudronix\.foo/g, cfg.domain);

  const BATCH_SIZE = 50; // Resend permite hasta 100, usamos 50 para margen de seguridad
  const DELAY_BETWEEN_BATCHES = 1200; // ms entre lotes
  const MAX_RETRIES = 3;

  let totalSent = 0;
  let totalFailed = 0;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const chunk = recipients.slice(i, i + BATCH_SIZE);
    const messages = chunk.map(u => ({
      from,
      to: u.email,
      subject,
      html: htmlBody,
      text: `${subject}\n\n${body}\n\n— PAUDRONIX GT`,
    }));

    let success = false;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await (client.batch as any).send(messages);
        if (result?.error) {
          console.error(`[NEWSLETTER-BATCH] Intento ${attempt} fallido para lote ${i / BATCH_SIZE + 1}:`, result.error);
          if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, attempt * 2000));
        } else {
          totalSent += chunk.length;
          console.log(`[NEWSLETTER-BATCH] Lote ${i / BATCH_SIZE + 1}: ${chunk.length} correos enviados`);
          success = true;
          break;
        }
      } catch (err: any) {
        console.error(`[NEWSLETTER-BATCH] Excepción intento ${attempt}:`, err?.message || err);
        if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, attempt * 2000));
      }
    }

    if (!success) {
      // Fallback: intentar uno por uno los del lote fallido
      console.log(`[NEWSLETTER-BATCH] Lote fallido, intentando uno por uno...`);
      for (const u of chunk) {
        try {
          await sendEmail(u.email, subject, htmlBody);
          totalSent++;
          await new Promise(r => setTimeout(r, 600));
        } catch {
          totalFailed++;
        }
      }
    }

    // Pausa entre lotes (excepto el último)
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
    }
  }

  return { sent: totalSent, failed: totalFailed };
}

export async function sendWelcomeEmail(email: string, firstName: string) {
  if (!canSendEmail()) return;
  try {
    await sendEmail(
      email,
      `Bienvenido a PAUDRONIX GT, ${firstName}`,
      emailBaseLight(`
        ${headingLight(`Hola ${firstName}, bienvenido a PAUDRONIX GT`)}
        ${paragraphLight('Nos alegra tenerte con nosotros. Tu cuenta fue creada exitosamente y ya tienes acceso completo a la plataforma.')}
        ${alertBoxLight('Tu cuenta está activa y lista para usar.', 'success')}
        ${paragraphLight('Con PAUDRONIX GT puedes:')}
        <ul style="color:#4b5563;font-size:15px;line-height:2.1;padding-left:20px;margin:0 0 18px;">
          <li>Adquirir suscripciones digitales al mejor precio</li>
          <li>Comprar códigos de videojuegos para Xbox, PlayStation y más</li>
          <li>Gestionar tus pedidos y suscripciones activas</li>
          <li>Recargar tu billetera digital</li>
          <li>Contactar soporte en cualquier momento</li>
        </ul>
        ${paragraphLight('Si tienes alguna duda, nuestro equipo de soporte está disponible para asistirte por WhatsApp o desde el panel.')}
      `),
      `PAUDRONIX GT - Bienvenido\n\nHola ${firstName},\nTu cuenta fue creada exitosamente.\n\nYa tienes acceso completo a PAUDRONIX GT.\n\nSi tienes dudas, contáctanos por WhatsApp: +502 3787 1216`
    );
  } catch (err) { console.log("Welcome email failed:", err); }
}

export async function sendCredentialsEmail(email: string, firstName: string, credentialName: string, credentialEmail: string, credentialPassword: string, credentialInstructions?: string, expirationDate?: string) {
  if (!canSendEmail()) return;
  try {
    const rows = [
      { label: 'Servicio', value: credentialName },
      { label: 'Correo / Usuario', value: credentialEmail },
      { label: 'Contraseña', value: credentialPassword },
    ];
    if (expirationDate) rows.push({ label: 'Fecha de vencimiento', value: expirationDate });

    await sendEmail(
      email,
      `Tu suscripción ${credentialName} está lista — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`Tu suscripción está activa, ${firstName}`)}
        ${paragraphLight(`Tu suscripción a <strong>${credentialName}</strong> fue procesada correctamente. Aquí están tus credenciales de acceso:`)}
        ${infoBoxLight(rows)}
        ${alertBoxLight('Guarda estas credenciales en un lugar seguro. No las compartas con nadie para proteger tu cuenta.', 'warning')}
        ${credentialInstructions ? `
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;margin:18px 0;">
          <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px;">Instrucciones de acceso</p>
          <p style="color:#374151;font-size:14px;margin:0;line-height:1.75;">${credentialInstructions}</p>
        </div>` : ''}
        ${paragraphLight('Si tienes problemas para acceder, contáctanos desde el panel de soporte o por WhatsApp.')}
      `),
      `PAUDRONIX GT - Tu suscripción está lista\n\nHola ${firstName},\nTus credenciales de ${credentialName}:\n\nCorreo/Usuario: ${credentialEmail}\nContraseña: ${credentialPassword}${expirationDate ? '\nFecha de vencimiento: ' + expirationDate : ''}${credentialInstructions ? '\nInstrucciones: ' + credentialInstructions : ''}`
    );
  } catch (err) { console.log("Credentials email failed:", err); }
}

export async function resendCredentialsEmail(email: string, firstName: string, credentialName: string, credentialEmail: string, credentialPassword: string, credentialInstructions?: string) {
  if (!canSendEmail()) return false;
  try {
    const rows = [
      { label: 'Servicio', value: credentialName },
      { label: 'Correo / Usuario', value: credentialEmail },
      { label: 'Contraseña', value: credentialPassword },
    ];

    await sendEmail(
      email,
      `Tus credenciales de ${credentialName} — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`Aquí están tus credenciales, ${firstName}`)}
        ${paragraphLight(`Te reenviamos las credenciales de acceso para <strong>${credentialName}</strong>:`)}
        ${infoBoxLight(rows)}
        ${alertBoxLight('No compartas estas credenciales con nadie por tu seguridad.', 'warning')}
        ${credentialInstructions ? `
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;margin:18px 0;">
          <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px;">Instrucciones</p>
          <p style="color:#374151;font-size:14px;margin:0;line-height:1.75;">${credentialInstructions}</p>
        </div>` : ''}
      `),
      `PAUDRONIX GT - Credenciales\n\nHola ${firstName},\nCredenciales de ${credentialName}:\n\nCorreo/Usuario: ${credentialEmail}\nContraseña: ${credentialPassword}`
    );
    return true;
  } catch (err) { return false; }
}

export async function sendAdminNotificationEmail(subject: string, message: string) {
  if (!canSendEmail() || !process.env.ADMIN_EMAIL) return;
  try {
    const cleanSubject = subject.replace(/^[\p{Emoji}\s]+/u, '').trim();
    const rows = message.split('\n').filter(l => l.trim()).map(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const label = line.slice(0, colonIdx).replace(/^[\p{Emoji}\s]+/u, '').trim();
        const value = line.slice(colonIdx + 1).trim();
        return { label, value };
      }
      return { label: '', value: line.replace(/^[\p{Emoji}\s]+/u, '').trim() };
    });
    const plainText = `PAUDRONIX GT - ${cleanSubject}\n\n${rows.map(r => r.label ? `${r.label}: ${r.value}` : r.value).join('\n')}`;
    await sendEmail(
      process.env.ADMIN_EMAIL,
      `[Admin] ${cleanSubject} — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`Notificación: ${cleanSubject}`)}
        ${alertBoxLight('Notificación automática del sistema — PAUDRONIX GT.', 'info')}
        ${infoBoxLight(rows.filter(r => r.label))}
        ${rows.filter(r => !r.label).map(r => paragraphLight(r.value)).join('')}
      `),
      plainText
    );
  } catch (err) { console.log("Admin notification failed:", err); }
}

export async function sendAdminNewTicketEmail(userName: string, userEmail: string, subject: string, message: string) {
  return sendAdminNotificationEmail("Nuevo Ticket de Soporte", `Usuario: ${userName}\nCorreo: ${userEmail}\nAsunto: ${subject}\nMensaje: ${message}`);
}

export async function sendAdminNewOrderEmail(customerName: string, customerContact: string, productName: string, price: number, paymentMethod: string) {
  if (!canSendEmail() || !process.env.ADMIN_EMAIL) return;
  try {
    const plainText = `PAUDRONIX GT — Nueva venta por saldo\n\nSe vendio: ${productName}\nCliente: ${customerName}\nPrecio: Q${price}`;
    await sendEmail(
      process.env.ADMIN_EMAIL,
      `Venta por saldo: ${productName} — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight('Nueva Venta por Saldo')}
        ${infoBoxLight([
          { label: 'Producto', value: productName },
          { label: 'Cliente', value: customerName },
          { label: 'Precio', value: `Q${price}` },
        ])}
        ${paragraphLight('Las credenciales fueron entregadas automaticamente desde el stock.')}
      `),
      plainText
    );
  } catch (err) { console.log("Admin order email failed:", err); }
}

export async function sendAdminScreenshotOrderEmail(customerName: string, customerContact: string, productName: string, price: number, paymentMethod: string, screenshotUrl: string, orderRef: string, orderId: string) {
  if (!canSendEmail() || !process.env.ADMIN_EMAIL) return;
  try {
    const screenshotHtml = screenshotUrl
      ? `<div style="margin:20px 0;text-align:center;"><a href="${screenshotUrl}" target="_blank"><img src="${screenshotUrl}" alt="Comprobante de pago" style="max-width:320px;border-radius:12px;border:2px solid #ea580c;" /></a><br/><a href="${screenshotUrl}" target="_blank" style="color:#ea580c;font-size:12px;">Ver comprobante completo</a></div>`
      : `<p style="color:#999;font-size:13px;">Sin comprobante adjunto</p>`;
    const plainText = `PAUDRONIX GT — Pedido pendiente de revision\n\nProducto: ${productName}\nCliente: ${customerName}\nContacto: ${customerContact}\nPrecio: Q${price}\nMétodo de pago: ${paymentMethod}\nReferencia: ${orderRef}\nID Pedido: ${orderId}`;
    await sendEmail(
      process.env.ADMIN_EMAIL,
      `Pedido pendiente: ${productName} — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight('Pedido Pendiente de Entrega')}
        ${alertBoxLight('Revisa el comprobante y presiona "Enviar" en el panel para entregar las credenciales automaticamente.', 'info')}
        ${infoBoxLight([
          { label: 'Producto', value: productName },
          { label: 'Cliente', value: customerName },
          { label: 'Contacto', value: customerContact },
          { label: 'Precio', value: `Q${price}` },
          { label: 'Metodo de pago', value: paymentMethod },
          { label: 'Referencia', value: orderRef },
        ])}
        <div style="margin:16px 0;font-size:11px;font-weight:900;text-transform:uppercase;color:#64748b;letter-spacing:0.08em;">Comprobante de Pago</div>
        ${screenshotHtml}
      `),
      plainText
    );
  } catch (err) { console.log("Admin screenshot order email failed:", err); }
}

export async function sendAdminNewChatMessageEmail(userName: string, userEmail: string, ticketSubject: string, message: string) {
  return sendAdminNotificationEmail("Nuevo Mensaje de Chat", `De: ${userName} (${userEmail})\nTicket: ${ticketSubject}\nMensaje: ${message}`);
}

export async function sendUserNewAdminMessageEmail(email: string, userName: string, ticketSubject: string, adminMessage: string) {
  if (!canSendEmail()) return;
  try {
    const firstName = userName.split(" ")[0] || "Usuario";
    await sendEmail(
      email,
      `Respuesta de soporte: ${ticketSubject} — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`Tienes un nuevo mensaje, ${firstName}`)}
        ${alertBoxLight('El equipo de soporte te ha enviado una respuesta.', 'info')}
        ${infoBoxLight([{ label: 'Asunto del ticket', value: ticketSubject }])}
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;margin:18px 0;">
          <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px;">Mensaje del soporte</p>
          <p style="color:#111827;font-size:14px;margin:0;line-height:1.75;">${adminMessage}</p>
        </div>
        ${paragraphLight('Puedes responder desde tu panel en la sección de soporte.')}
      `),
      `PAUDRONIX GT - Respuesta de soporte\n\nHola ${firstName},\nEl equipo de soporte respondió tu ticket.\n\nAsunto: ${ticketSubject}\nMensaje: ${adminMessage}`
    );
  } catch (err) { }
}

export async function sendUserTicketResolvedEmail(email: string, firstName: string, ticketSubject: string, adminNotes?: string) {
  if (!canSendEmail()) return;
  try {
    await sendEmail(
      email,
      `Tu caso fue resuelto: ${ticketSubject} — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`Tu caso ha sido resuelto, ${firstName}`)}
        ${alertBoxLight('Tu solicitud de soporte fue marcada como resuelta. ¡Gracias por contactarnos!', 'success')}
        ${infoBoxLight([{ label: 'Asunto', value: ticketSubject }])}
        ${adminNotes ? `
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;margin:18px 0;">
          <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px;">Notas del soporte</p>
          <p style="color:#374151;font-size:14px;margin:0;line-height:1.75;">${adminNotes}</p>
        </div>` : ''}
        ${paragraphLight('Si el problema persiste o tienes más preguntas, puedes abrir un nuevo ticket desde tu panel.')}
      `),
      `PAUDRONIX GT - Caso resuelto\n\nHola ${firstName},\nTu caso fue resuelto.\nAsunto: ${ticketSubject}${adminNotes ? '\nNotas: ' + adminNotes : ''}`
    );
  } catch (err) { }
}

export async function sendUserSubscriptionUpdatedEmail(email: string, firstName: string, subscriptionName: string, credentialEmail: string, credentialPassword: string, endDate?: string) {
  if (!canSendEmail()) return;
  try {
    const formattedEndDate = endDate
      ? new Date(endDate).toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' })
      : null;

    const rows = [
      { label: '📺 Servicio', value: subscriptionName },
      { label: '📧 Correo / Usuario de acceso', value: credentialEmail },
      { label: '🔑 Contraseña', value: credentialPassword },
    ];
    if (formattedEndDate) rows.push({ label: '📅 Tu suscripción está activa hasta', value: formattedEndDate });

    await sendEmail(
      email,
      `✅ Datos actualizados: ${subscriptionName} — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`Hola ${firstName}, tus datos fueron actualizados ✅`)}
        ${paragraphLight(`Recibiste este correo porque el equipo de <strong>PAUDRONIX GT</strong> actualizó los datos de tu suscripción a <strong>${subscriptionName}</strong>. Esto puede deberse a una renovación, cambio de credenciales o mantenimiento del servicio.`)}
        ${paragraphLight(`A continuación encontrarás tus datos actualizados. Guárdalos en un lugar seguro:`)}
        ${infoBoxLight(rows)}
        ${alertBoxLight(`Estos son tus datos vigentes para acceder al servicio. Si tenías datos anteriores, ya no son válidos — usa únicamente los que aparecen arriba.`, 'info')}
        ${paragraphLight(`Puedes verificar tu suscripción en cualquier momento ingresando a tu perfil en <strong>paudronix.foo</strong> → sección "Mis Suscripciones".`)}
        ${paragraphLight(`Si no reconoces este cambio o tienes alguna duda, contáctanos por WhatsApp: <strong>+502 3787 1216</strong> o escríbenos desde el chat de soporte en la plataforma.`)}
        ${paragraphLight(`<em>— Equipo de PAUDRONIX GT 🇬🇹</em>`)}
      `),
      `PAUDRONIX GT — Datos actualizados: ${subscriptionName}\n\nHola ${firstName},\n\nEl equipo de PAUDRONIX GT actualizó los datos de tu suscripción a ${subscriptionName}.\n\nTus datos actualizados:\nServicio: ${subscriptionName}\nCorreo / Usuario: ${credentialEmail}\nContraseña: ${credentialPassword}${formattedEndDate ? '\nActiva hasta: ' + formattedEndDate : ''}\n\nPuedes verificarlo en tu perfil en paudronix.foo\n\nSi tienes dudas: WhatsApp +502 3787 1216\n— Equipo PAUDRONIX GT`
    );
  } catch (err) { }
}

export async function sendSuspensionEmail(email: string, firstName: string, reason: string) {
  if (!canSendEmail()) return;
  try {
    await sendEmail(
      email,
      `Cuenta suspendida — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`Tu cuenta ha sido suspendida, ${firstName}`)}
        ${alertBoxLight('Tu cuenta ha sido suspendida temporalmente.', 'danger')}
        ${infoBoxLight([{ label: 'Motivo de suspensión', value: reason }])}
        ${paragraphLight('Si crees que esto es un error o deseas apelar la decisión, contáctanos a través del soporte o por WhatsApp: +502 3787 1216.')}
      `),
      `PAUDRONIX GT - Cuenta suspendida\n\nHola ${firstName},\nTu cuenta fue suspendida.\nMotivo: ${reason}\n\nContacto: +502 3787 1216`
    );
  } catch (err) { }
}

export async function sendReactivationEmail(email: string, firstName: string) {
  if (!canSendEmail()) return;
  try {
    await sendEmail(
      email,
      `Cuenta reactivada — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`Tu cuenta ha sido reactivada, ${firstName}`)}
        ${alertBoxLight('Tu acceso fue restaurado. Ya puedes iniciar sesión normalmente.', 'success')}
        ${paragraphLight('Te damos la bienvenida de vuelta. Si tienes alguna pregunta o necesitas ayuda, contáctanos a través del soporte.')}
      `),
      `PAUDRONIX GT - Cuenta reactivada\n\nHola ${firstName},\nTu cuenta fue reactivada. Ya puedes iniciar sesión.`
    );
  } catch (err) { }
}

export async function sendAdminProblemReportEmail(userName: string, userEmail: string, orderId: string, description: string) {
  return sendAdminNotificationEmail("Reporte de Problema", `Usuario: ${userName} (${userEmail})\nPedido: ${orderId}\nDescripción: ${description}`);
}

export async function sendSellerProductPublishedEmail(email: string, sellerName: string, productName: string) {
  if (!canSendEmail()) return;
  try {
    await sendEmail(
      email,
      `Tu producto fue publicado — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`Tu producto está activo, ${sellerName}`)}
        ${alertBoxLight('Tu producto fue revisado y aprobado exitosamente por el equipo de PAUDRONIX GT.', 'success')}
        ${infoBoxLight([{ label: 'Producto publicado', value: productName }])}
        ${paragraphLight('Tu producto ya está visible para todos los usuarios de la plataforma. Mucho éxito con tus ventas.')}
      `),
      `PAUDRONIX GT - Producto publicado\n\nHola ${sellerName},\nTu producto "${productName}" fue publicado y ya está visible para los usuarios.`
    );
  } catch (err) { }
}

export async function sendRechargeApprovedEmail(email: string, firstName: string, amount: number, code?: string, paymentMethodName?: string) {
  if (!canSendEmail()) return;
  console.log(`[RECHARGE-EMAIL-FN] Iniciando envio a ${email} | Q${amount}`);
  const rows = [
    { label: 'Monto acreditado', value: `Q${amount}` },
    ...(paymentMethodName ? [{ label: 'Método de pago', value: paymentMethodName }] : []),
    ...(code ? [{ label: 'Código de referencia', value: code }] : []),
  ];
  try {
    await sendEmail(
      email,
      `Recarga aprobada por Q${amount} — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`Recarga aprobada, ${firstName}`)}
        ${alertBoxLight('Tu recarga fue verificada y el saldo ya está disponible en tu billetera.', 'success')}
        ${infoBoxLight(rows)}
        ${paragraphLight('Puedes usar tu saldo para adquirir suscripciones, juegos y servicios en PAUDRONIX GT.')}
      `),
      `PAUDRONIX GT - Recarga aprobada\n\nHola ${firstName},\nTu recarga fue aprobada.\n\nMonto acreditado: Q${amount}${paymentMethodName ? '\nMétodo: ' + paymentMethodName : ''}${code ? '\nReferencia: ' + code : ''}`
    );
  } catch (err) { }
}

export async function sendAdminNewRechargeEmail(userName: string, userEmail: string, amount: number, paymentMethodName: string, trackingCode: string) {
  return sendAdminNotificationEmail("Nueva Solicitud de Recarga", `Usuario: ${userName}\nCorreo: ${userEmail}\nMonto: Q${amount}\nMétodo: ${paymentMethodName}\nCódigo: ${trackingCode}`);
}

export async function sendRechargeSubmittedEmail(email: string, firstName: string, amount: number, code: string, paymentMethodName: string) {
  if (!canSendEmail()) return;
  console.log(`[RECHARGE-EMAIL-FN] Enviando confirmacion de solicitud a ${email} | Q${amount} | Codigo: ${code}`);
  try {
    await sendEmail(
      email,
      `Solicitud de recarga Q${amount} recibida — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`Solicitud recibida, ${firstName}`)}
        ${alertBoxLight('Recibimos tu solicitud de recarga. Será revisada y procesada pronto.', 'info')}
        ${infoBoxLight([
          { label: 'Monto solicitado', value: `Q${amount}` },
          { label: 'Método de pago', value: paymentMethodName },
          { label: 'Código de seguimiento', value: code },
        ])}
        ${paragraphLight('Recibirás otro correo cuando tu recarga sea aprobada. El tiempo de revisión habitual es de pocos minutos a pocas horas en días hábiles.')}
      `),
      `PAUDRONIX GT - Solicitud de recarga recibida\n\nHola ${firstName},\nRecibimos tu solicitud de recarga.\n\nMonto: Q${amount}\nMétodo: ${paymentMethodName}\nCódigo de seguimiento: ${code}`
    );
  } catch (err) { console.error('[RECHARGE-EMAIL-FN] Error enviando confirmacion:', err); }
}

export async function sendUserPurchaseConfirmationEmail(email: string, customerName: string, productName: string, price: number, paymentMethod: string, orderRef: string) {
  if (!canSendEmail()) return;
  try {
    await sendEmail(
      email,
      `Confirmación de compra: ${productName} — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`Gracias por tu compra, ${customerName}`)}
        ${paragraphLight('Tu pedido fue recibido y está siendo procesado por nuestro equipo. En breve recibirás tus credenciales o instrucciones de entrega.')}
        ${infoBoxLight([
          { label: 'Producto', value: productName },
          { label: 'Monto pagado', value: `Q${price}` },
          { label: 'Método de pago', value: paymentMethod },
          { label: 'Número de referencia', value: orderRef },
        ])}
        ${alertBoxLight('Nuestro equipo está procesando tu pedido. Las credenciales o el código serán enviados a este correo pronto.', 'info')}
        ${paragraphLight('Si tienes alguna duda, puedes revisar el estado de tu pedido desde tu panel o contactar soporte por WhatsApp.')}
      `),
      `PAUDRONIX GT - Confirmación de compra\n\nHola ${customerName},\nTu pedido fue recibido.\n\nProducto: ${productName}\nMonto pagado: Q${price}\nMétodo de pago: ${paymentMethod}\nReferencia: ${orderRef}\n\nRecibirás tus credenciales en breve.`
    );
  } catch (err) { }
}

export async function sendRechargeRejectedEmail(email: string, firstName: string, amount?: number, code?: string, reason?: string) {
  if (!canSendEmail()) return;
  const rows = [
    ...(amount ? [{ label: 'Monto solicitado', value: `Q${amount}` }] : []),
    ...(code ? [{ label: 'Código de referencia', value: code }] : []),
    ...(reason ? [{ label: 'Motivo', value: reason }] : []),
  ];
  try {
    await sendEmail(
      email,
      `Solicitud de recarga no aprobada — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`Tu recarga no fue aprobada, ${firstName}`)}
        ${alertBoxLight('No pudimos verificar tu pago. Tu solicitud fue rechazada.', 'danger')}
        ${infoBoxLight(rows)}
        ${paragraphLight('Verifica que el comprobante sea legible y que el monto coincida exactamente con lo solicitado. Puedes intentarlo nuevamente desde tu panel.')}
        ${paragraphLight('Si necesitas ayuda, contáctanos por WhatsApp: +502 3787 1216.')}
      `),
      `PAUDRONIX GT - Solicitud de recarga rechazada\n\nHola ${firstName},\nTu solicitud de recarga no fue aprobada.${amount ? '\nMonto: Q' + amount : ''}${reason ? '\nMotivo: ' + reason : ''}`
    );
  } catch (err) { }
}

export async function sendExpirationReminderEmail(email: string, firstName: string, subscriptionName: string, daysLeft: number) {
  if (!canSendEmail()) return;
  try {
    await sendEmail(
      email,
      `Aviso: tu suscripción ${subscriptionName} vence en ${daysLeft} días — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`Aviso de vencimiento, ${firstName}`)}
        ${alertBoxLight(`Tu suscripción vence en <strong>${daysLeft} días</strong>. Renueva antes de que se interrumpa el servicio.`, 'warning')}
        ${infoBoxLight([
          { label: 'Suscripción', value: subscriptionName },
          { label: 'Días restantes', value: `${daysLeft} días` },
        ])}
        ${paragraphLight('Para renovar, ingresa a tu panel y solicita la renovación. Si necesitas ayuda, contáctanos por WhatsApp: +502 3787 1216.')}
      `),
      `PAUDRONIX GT - Aviso de vencimiento\n\nHola ${firstName},\nTu suscripción "${subscriptionName}" vence en ${daysLeft} días.\nIngresa a tu panel para renovarla.`
    );
  } catch (err) { }
}

export async function sendRenewalApprovedEmail(email: string, firstName: string, subscriptionName: string, endDate: string) {
  if (!canSendEmail()) return;
  try {
    await sendEmail(
      email,
      `Renovación aprobada: ${subscriptionName} — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`Renovación exitosa, ${firstName}`)}
        ${alertBoxLight('Tu renovación fue aprobada y tu suscripción sigue activa.', 'success')}
        ${infoBoxLight([
          { label: 'Suscripción', value: subscriptionName },
          { label: 'Nueva fecha de vencimiento', value: endDate },
        ])}
        ${paragraphLight('Gracias por seguir confiando en PAUDRONIX GT. Disfruta tu servicio.')}
      `),
      `PAUDRONIX GT - Renovación aprobada\n\nHola ${firstName},\nTu renovación de "${subscriptionName}" fue aprobada.\nNueva fecha de vencimiento: ${endDate}`
    );
  } catch (err) { }
}

export async function sendRenewalRejectedEmail(email: string, firstName: string, subscriptionName: string, reason?: string) {
  if (!canSendEmail()) return;
  try {
    await sendEmail(
      email,
      `Renovación no aprobada: ${subscriptionName} — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`Tu renovación no fue aprobada, ${firstName}`)}
        ${alertBoxLight('No pudimos procesar tu solicitud de renovación.', 'danger')}
        ${infoBoxLight([
          { label: 'Suscripción', value: subscriptionName },
          ...(reason ? [{ label: 'Motivo', value: reason }] : []),
        ])}
        ${paragraphLight('Verifica los detalles de tu solicitud e intenta nuevamente. Si crees que es un error, contáctanos por soporte o WhatsApp: +502 3787 1216.')}
      `),
      `PAUDRONIX GT - Renovación no aprobada\n\nHola ${firstName},\nTu renovación de "${subscriptionName}" no fue aprobada.${reason ? '\nMotivo: ' + reason : ''}`
    );
  } catch (err) { }
}

export async function sendAdminSellerProductSubmittedEmail(sellerName: string, sellerEmail: string, productName: string) {
  return sendAdminNotificationEmail("Nuevo Producto de Vendedor", `Vendedor: ${sellerName}\nCorreo: ${sellerEmail}\nProducto: ${productName}\nEstado: Pendiente de revisión`);
}

export async function sendAdminWithdrawalRequestEmail(sellerName: string, sellerEmail: string, amount: number, paymentMethod: string) {
  return sendAdminNotificationEmail("Solicitud de Retiro de Vendedor", `Vendedor: ${sellerName}\nCorreo: ${sellerEmail}\nMonto a retirar: Q${amount}\nMétodo: ${paymentMethod}`);
}

export async function sendAdminSellerSaleEmail(sellerName: string, sellerEmail: string, productName: string, amount: number, buyerName: string) {
  return sendAdminNotificationEmail("Venta de Vendedor Completada", `Vendedor: ${sellerName}\nCorreo: ${sellerEmail}\nProducto: ${productName}\nGanancia acreditada: Q${amount}\nComprador: ${buyerName}`);
}

export async function sendSellerProductSoldEmail(email: string, sellerName: string, productName: string, amount: number, buyerName: string) {
  if (!canSendEmail()) return;
  try {
    await sendEmail(
      email,
      `Venta realizada: "${productName}" — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`Felicidades ${sellerName}, tienes una venta`)}
        ${alertBoxLight(`Tu producto <strong>"${productName}"</strong> fue vendido y las ganancias ya están acreditadas.`, 'success')}
        ${infoBoxLight([
          { label: 'Producto vendido', value: productName },
          { label: 'Ganancias acreditadas', value: `Q${amount}` },
          { label: 'Comprador', value: buyerName },
        ])}
        ${paragraphLight('El monto ya fue acreditado a tu saldo de vendedor. Puedes retirarlo desde la sección <strong>Mis Ventas</strong> en tu perfil.')}
      `),
      `PAUDRONIX GT - Venta realizada\n\nHola ${sellerName},\nTu producto "${productName}" fue vendido.\n\nGanancias acreditadas: Q${amount}\nComprador: ${buyerName}`
    );
  } catch (err) { }
}

export async function sendAdminNewUserEmail(userName: string, userEmail: string, username: string) {
  return sendAdminNotificationEmail(
    "Nuevo Usuario Registrado",
    `Nombre: ${userName || username}\nCorreo: ${userEmail || "(sin correo)"}\nUsuario: ${username}\nFecha: ${new Date().toLocaleString("es-GT")}`
  );
}

export async function sendUserTicketOpenedEmail(email: string, firstName: string, ticketSubject: string, ticketMessage: string) {
  if (!canSendEmail()) return;
  try {
    await sendEmail(
      email,
      `Tu solicitud de soporte fue recibida — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`Hola ${firstName}, recibimos tu solicitud`)}
        ${alertBoxLight('Tu ticket fue creado correctamente. Nuestro equipo lo revisará a la brevedad.', 'success')}
        ${infoBoxLight([
          { label: 'Asunto', value: ticketSubject },
          { label: 'Estado', value: 'Abierto — En revisión' },
          { label: 'Tiempo estimado', value: '24 horas hábiles' },
        ])}
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;margin:18px 0;">
          <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px;">Tu mensaje</p>
          <p style="color:#374151;font-size:14px;margin:0;line-height:1.75;">${ticketMessage}</p>
        </div>
        ${paragraphLight('Te notificaremos por correo cuando recibas una respuesta del equipo de soporte.')}
      `),
      `PAUDRONIX GT - Solicitud de soporte recibida\n\nHola ${firstName},\nTu ticket fue creado.\n\nAsunto: ${ticketSubject}\nTu mensaje: ${ticketMessage}`
    );
  } catch (err) { }
}

export async function sendUserReportReceivedEmail(email: string, firstName: string, subscriptionName: string, description: string) {
  if (!canSendEmail()) return;
  try {
    await sendEmail(
      email,
      `Reporte recibido — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`Hola ${firstName}, recibimos tu reporte`)}
        ${alertBoxLight('Tu reporte fue enviado correctamente. Lo revisaremos pronto.', 'info')}
        ${infoBoxLight([
          { label: 'Suscripción', value: subscriptionName || 'General' },
          { label: 'Estado', value: 'Pendiente de revisión' },
        ])}
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;margin:18px 0;">
          <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px;">Tu descripción</p>
          <p style="color:#374151;font-size:14px;margin:0;line-height:1.75;">${description}</p>
        </div>
        ${paragraphLight('Nuestro equipo revisará tu reporte y te enviará una respuesta. Gracias por ayudarnos a mejorar la plataforma.')}
      `),
      `PAUDRONIX GT - Reporte recibido\n\nHola ${firstName},\nTu reporte fue recibido.\n\nSuscripción: ${subscriptionName || 'General'}\nDescripción: ${description}`
    );
  } catch (err) { }
}

export async function sendWithdrawalPaidEmail(email: string, firstName: string, amount: number, paymentMethod: string, receiptUrl?: string) {
  if (!canSendEmail()) return;
  try {
    await sendEmail(
      email,
      `Retiro pagado Q${amount} — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`Tu retiro fue pagado, ${firstName}`)}
        ${alertBoxLight('Tu solicitud de retiro fue procesada y el pago fue enviado exitosamente.', 'success')}
        ${infoBoxLight([
          { label: 'Monto pagado', value: `Q${amount}` },
          { label: 'Método de pago', value: paymentMethod },
          { label: 'Estado', value: 'Completado' },
        ])}
        ${receiptUrl ? `
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;margin:18px 0;">
          <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px;">Comprobante de pago</p>
          <a href="${receiptUrl}" style="color:#ea580c;font-size:14px;word-break:break-all;font-weight:600;">${receiptUrl}</a>
        </div>` : ''}
        ${paragraphLight('Si tienes alguna duda sobre este pago, contáctanos a través del soporte o WhatsApp: +502 3787 1216.')}
      `),
      `PAUDRONIX GT - Retiro pagado\n\nHola ${firstName},\nTu retiro fue pagado.\n\nMonto: Q${amount}\nMétodo: ${paymentMethod}`
    );
  } catch (err) { }
}

/* ─────────────────────────────────────────────────────────────
   EMAILS — JUEGOS
───────────────────────────────────────────────────────────── */

export async function sendGamePurchaseUserEmail(email: string, customerName: string, gameName: string, price: number, orderRef: string) {
  if (!canSendEmail()) return;
  try {
    await sendEmail(
      email,
      `Compra recibida: ${gameName} — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`¡Gracias por tu compra, ${customerName}!`)}
        ${alertBoxLight('Tu pedido fue recibido. En breve recibirás el código digital en este correo.', 'success')}
        ${infoBoxLight([
          { label: 'Juego', value: gameName },
          { label: 'Monto pagado', value: `Q${price}` },
          { label: 'Número de referencia', value: orderRef },
          { label: 'Estado', value: 'En proceso — Pendiente de entrega' },
        ])}
        ${paragraphLight('Nuestro equipo está procesando tu pedido. Cuando el código esté listo, te lo enviaremos a este correo. El tiempo habitual de entrega es de pocos minutos a pocas horas.')}
        ${paragraphLight('¿Alguna duda? Contáctanos por WhatsApp: +502 3787 1216 o desde la plataforma.')}
      `),
      `PAUDRONIX GT - Compra recibida\n\nHola ${customerName},\nTu compra fue recibida.\n\nJuego: ${gameName}\nMonto: Q${price}\nReferencia: ${orderRef}\n\nRecibirás el código en breve.`
    );
  } catch (err) { }
}

export async function sendGameCodeDeliveryEmail(email: string, customerName: string, gameName: string, code: string, instructions?: string) {
  if (!canSendEmail()) return;
  try {
    await sendEmail(
      email,
      `Tu código de juego está listo: ${gameName} — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`¡Tu código está listo, ${customerName}!`)}
        ${alertBoxLight(`Tu pedido de <strong>${gameName}</strong> fue procesado exitosamente. Aquí está tu código:`, 'success')}
        <div style="background:#1a1a1a;border-radius:12px;padding:28px 32px;margin:22px 0;text-align:center;">
          <p style="color:#9ca3af;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;">Tu código de juego</p>
          <p style="color:#ea580c;font-size:30px;font-weight:900;letter-spacing:5px;margin:0;font-family:'Courier New',monospace;">${code}</p>
        </div>
        ${infoBoxLight([
          { label: 'Juego', value: gameName },
          { label: 'Código entregado', value: code },
        ])}
        ${instructions ? `
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px 20px;margin:18px 0;">
          <p style="color:#92400e;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px;">Instrucciones de canje</p>
          <p style="color:#78350f;font-size:14px;margin:0;line-height:1.75;">${instructions}</p>
        </div>` : ''}
        ${alertBoxLight('Guarda este código en un lugar seguro. Es de uso único y personal. No lo compartas con nadie.', 'warning')}
        ${paragraphLight('Si tienes problemas para canjear el código, contáctanos de inmediato por WhatsApp: +502 3787 1216.')}
      `),
      `PAUDRONIX GT - Tu código de juego\n\nHola ${customerName},\nTu código de ${gameName} está listo.\n\nCÓDIGO: ${code}\n\n${instructions ? `Instrucciones: ${instructions}\n\n` : ''}Guarda este código en un lugar seguro.`
    );
  } catch (err) { }
}

export async function sendGameCredentialsDeliveryEmail(email: string, customerName: string, gameName: string, credEmail: string, credPassword: string, instructions?: string) {
  if (!canSendEmail()) return;
  try {
    await sendEmail(
      email,
      `Tus credenciales de acceso: ${gameName} — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`¡Tus credenciales están listas, ${customerName}!`)}
        ${alertBoxLight(`Tu pedido de <strong>${gameName}</strong> fue procesado. Aquí están tus datos de acceso:`, 'success')}
        <div style="background:#1a1a1a;border-radius:12px;padding:28px 32px;margin:22px 0;">
          <p style="color:#9ca3af;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 16px;">Datos de acceso</p>
          <p style="color:#9ca3af;font-size:12px;font-weight:600;margin:0 0 4px;">Correo electrónico</p>
          <p style="color:#ea580c;font-size:18px;font-weight:900;letter-spacing:2px;margin:0 0 16px;font-family:'Courier New',monospace;">${credEmail}</p>
          <p style="color:#9ca3af;font-size:12px;font-weight:600;margin:0 0 4px;">Contraseña</p>
          <p style="color:#ea580c;font-size:18px;font-weight:900;letter-spacing:2px;margin:0;font-family:'Courier New',monospace;">${credPassword}</p>
        </div>
        ${infoBoxLight([
          { label: 'Producto', value: gameName },
          { label: 'Correo de acceso', value: credEmail },
        ])}
        ${instructions ? `
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px 20px;margin:18px 0;">
          <p style="color:#92400e;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px;">Instrucciones</p>
          <p style="color:#78350f;font-size:14px;margin:0;line-height:1.75;">${instructions}</p>
        </div>` : ''}
        ${alertBoxLight('Guarda estos datos en un lugar seguro. No los compartas con nadie.', 'warning')}
        ${paragraphLight('Si tienes problemas para acceder, contáctanos de inmediato por WhatsApp: +502 3787 1216.')}
      `),
      `PAUDRONIX GT - Tus credenciales de acceso\n\nHola ${customerName},\nTus credenciales de ${gameName} están listas.\n\nCorreo: ${credEmail}\nContraseña: ${credPassword}\n\n${instructions ? `Instrucciones: ${instructions}\n\n` : ''}Guarda estos datos en un lugar seguro.`
    );
  } catch (err) { }
}

export async function sendAdminGamePurchaseEmail(customerName: string, customerEmail: string, gameName: string, price: number, orderRef: string) {
  return sendAdminNotificationEmail(
    `Nueva compra de juego: ${gameName}`,
    `Cliente: ${customerName}\nCorreo: ${customerEmail}\nJuego: ${gameName}\nPrecio: Q${price}\nReferencia: ${orderRef}\nAcción: Entregar código desde el panel admin — sección Juegos > Pedidos`
  );
}

export async function sendReferralRegisterNotificationEmail(
  email: string,
  firstName: string,
  newUserName: string,
  bonus: number
) {
  if (!canSendEmail()) return;
  try {
    await sendEmail(
      email,
      `¡Alguien usó tu código de referido! + Q${bonus} en tu saldo`,
      emailBaseLight(`
        ${headingLight(`¡Buenas noticias, ${firstName}!`)}
        ${alertBoxLight(`<strong>${newUserName}</strong> se registró usando tu código de referido.`, 'success')}
        <div style="background:#fff7ed;border:2px solid #ea580c;border-radius:16px;padding:24px 28px;margin:22px 0;text-align:center;">
          <p style="color:#9ca3af;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">Recompensa recibida</p>
          <p style="color:#ea580c;font-size:36px;font-weight:900;margin:0 0 6px;">+Q${bonus}</p>
          <p style="color:#6b7280;font-size:13px;margin:0;">Ya está disponible en tu saldo de referidos</p>
        </div>
        ${paragraphLight('Tu saldo de referidos se puede usar para comprar cualquier producto en PAUDRONIX GT.')}
        ${paragraphLight('Sigue compartiendo tu código — cada vez que alguien se registre, recibirás más saldo.')}
      `),
      `PAUDRONIX GT - Nuevo referido registrado\n\n¡Hola ${firstName}!\n${newUserName} se registró con tu código de referido.\n\nRecibiste +Q${bonus} en tu saldo de referidos.\n\nSigue compartiendo tu código para ganar más.`
    );
  } catch (err) { }
}

export async function sendAdminReferralNotificationEmail(
  referrerName: string,
  referrerEmail: string,
  newUserName: string,
  newUserEmail: string,
  bonus: number
) {
  return sendAdminNotificationEmail(
    `Nuevo referido registrado — ${newUserName}`,
    `Referidor: ${referrerName} (${referrerEmail})\nNuevo usuario: ${newUserName} (${newUserEmail})\nBono otorgado al referidor: Q${bonus}\nBono de bienvenida al nuevo usuario: Q${bonus}`
  );
}

export async function sendReferralProgramActivatedEmail(email: string, firstName: string, registerBonus: number, purchaseBonus: number) {
  if (!canSendEmail()) { console.log(`[EMAIL] canSendEmail=false, saltando activación para ${email}`); return; }
  console.log(`[EMAIL] Enviando correo de activación a ${email}`);
  const subject = `¡El programa de referidos está activo! Gana hasta Q${registerBonus} por invitar`;
  const bonusBox = `<div style="background:#fff7ed;border:2px solid #ea580c;border-radius:16px;padding:24px 28px;margin:22px 0;">
    <p style="color:#9ca3af;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;">Bonos disponibles</p>
    <div style="display:flex;gap:16px;flex-wrap:wrap;">
      <div style="flex:1;min-width:120px;text-align:center;background:#fff;border-radius:12px;padding:16px;">
        <p style="color:#ea580c;font-size:28px;font-weight:900;margin:0;">Q${registerBonus}</p>
        <p style="color:#6b7280;font-size:12px;margin:4px 0 0;">por cada registro</p>
      </div>
      <div style="flex:1;min-width:120px;text-align:center;background:#fff;border-radius:12px;padding:16px;">
        <p style="color:#ea580c;font-size:28px;font-weight:900;margin:0;">Q${purchaseBonus}</p>
        <p style="color:#6b7280;font-size:12px;margin:4px 0 0;">por cada compra</p>
      </div>
    </div>
  </div>`;
  const body = emailBaseLight(
    headingLight(`¡Buenas noticias, ${firstName}!`) +
    alertBoxLight('El programa de referidos de PAUDRONIX GT ha sido <strong>activado</strong>. Ya puedes compartir tu link y ganar saldo.', 'success') +
    bonusBox +
    paragraphLight('Entra a tu perfil, copia tu link de referido y compártelo con tus amigos para comenzar a ganar saldo.')
  );
  const text = `PAUDRONIX GT - Programa de referidos activo\n\n¡Hola ${firstName}!\nEl programa de referidos ha sido activado.\n\nBonos: Q${registerBonus} por registro, Q${purchaseBonus} por compra.\n\nEntra a tu perfil y copia tu link.`;
  try {
    await sendEmail(email, subject, body, text);
    console.log(`[EMAIL] Correo de activación enviado a ${email}`);
  } catch (err) {
    console.error(`[EMAIL] Error enviando activación a ${email}:`, err);
  }
}

export async function sendReferralProgramDeactivatedEmail(email: string, firstName: string) {
  if (!canSendEmail()) return;
  try {
    await sendEmail(
      email,
      `El programa de referidos ha sido pausado temporalmente`,
      emailBaseLight(`
        ${headingLight(`Hola ${firstName}`)}
        ${alertBoxLight('El programa de referidos de PAUDRONIX GT ha sido <strong>pausado temporalmente</strong> por el administrador.', 'warning')}
        ${paragraphLight('Durante este tiempo no se otorgarán bonos por nuevos registros ni compras con tu link.')}
        ${paragraphLight('<strong>Tu saldo ganado hasta ahora sigue disponible</strong> y puedes usarlo para comprar cualquier producto en la plataforma.')}
        ${paragraphLight('Te notificaremos por correo cuando el programa vuelva a estar activo.')}
      `),
      `PAUDRONIX GT - Programa de referidos pausado\n\nHola ${firstName},\nEl programa de referidos ha sido pausado temporalmente.\n\nTu saldo ganado sigue disponible para compras.\nTe avisaremos cuando vuelva a estar activo.`
    );
  } catch (err) { }
}

export async function sendAdminReferralProgramStatusEmail(isActive: boolean) {
  return sendAdminNotificationEmail(
    `Programa de referidos ${isActive ? "ACTIVADO" : "DESACTIVADO"}`,
    `El programa de referidos ha sido ${isActive ? "activado" : "desactivado"}.\n\nSe notificó a todos los usuarios con código de referido.`
  );
}

export async function sendGiftEmail(
  email: string,
  firstName: string,
  giftType: "saldo" | "subscription",
  amount?: number,
  productName?: string,
  durationDays?: number,
  message?: string
) {
  if (!canSendEmail()) return;
  try {
    const subject = giftType === "saldo"
      ? `Recibiste un regalo de saldo — PAUDRONIX GT`
      : `Recibiste una suscripción de regalo — PAUDRONIX GT`;

    const giftRows = giftType === "saldo"
      ? [{ label: "Saldo añadido", value: `Q ${Number(amount).toFixed(2)}` }]
      : [
          { label: "Servicio", value: productName || "" },
          { label: "Duración", value: `${durationDays} días` },
        ];

    await sendEmail(
      email,
      subject,
      emailBaseLight(`
        ${headingLight(`Tienes un regalo, ${firstName} 🎁`)}
        ${paragraphLight(giftType === "saldo"
          ? `El administrador de <strong>PAUDRONIX GT</strong> te ha enviado un regalo de saldo que ya está disponible en tu cuenta.`
          : `El administrador de <strong>PAUDRONIX GT</strong> te ha enviado una suscripción de regalo que ya está activa en tu perfil.`
        )}
        ${infoBoxLight(giftRows)}
        ${message ? alertBoxLight(`Mensaje del administrador: ${message}`, "info") : ""}
        ${alertBoxLight(
          giftType === "saldo"
            ? "Puedes usar tu saldo para comprar cualquier producto en la plataforma."
            : "Puedes ver tu suscripción activa desde tu perfil de usuario.",
          "success"
        )}
        ${paragraphLight("Ingresa a <strong>paudronix.foo</strong> para ver tu regalo. Si tienes alguna duda contáctanos por WhatsApp o soporte.")}
      `),
      `PAUDRONIX GT - Regalo recibido\n\nHola ${firstName},\nRecibiste un regalo de PAUDRONIX GT.\n${giftType === "saldo" ? `Saldo: Q ${amount}` : `Suscripción: ${productName} por ${durationDays} días`}\n${message ? `\nMensaje: ${message}` : ""}`
    );
  } catch (err) {
    console.error(`[EMAIL] Error enviando regalo a ${email}:`, err);
  }
}

export async function sendGiftRecipientEmail(
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  productName: string,
  isGift: boolean,
  message?: string
) {
  if (!canSendEmail()) return;
  try {
    const subject = isGift
      ? `¡${senderName} te envió un regalo! — PAUDRONIX GT`
      : `${senderName} te regaló una suscripción — PAUDRONIX GT`;

    await sendEmail(
      recipientEmail,
      subject,
      emailBaseLight(`
        ${headingLight(isGift ? `¡Tienes un regalo, ${recipientName}! 🎁` : `${recipientName}, recibiste una suscripción`)}
        ${paragraphLight(isGift
          ? `<strong>${senderName}</strong> te ha enviado un regalo especial en <strong>PAUDRONIX GT</strong>.`
          : `<strong>${senderName}</strong> ha pagado una suscripción para ti en <strong>PAUDRONIX GT</strong>.`
        )}
        ${infoBoxLight([
          { label: isGift ? "Regalo" : "Suscripción", value: productName },
          { label: "Estado", value: "✓ Activa en tu perfil" },
        ])}
        ${message ? alertBoxLight(`Mensaje de ${senderName}: "${message}"`, "info") : ""}
        ${alertBoxLight("Puedes ver tu suscripción activa desde tu perfil de usuario.", "success")}
        ${paragraphLight("Ingresa a <strong>PAUDRONIX GT</strong> para disfrutar tu suscripción. ¡Que lo disfrutes!")}
      `),
      `PAUDRONIX GT\n\nHola ${recipientName},\n${senderName} te ${isGift ? "envió un regalo" : "pagó una suscripción"}: ${productName}.\n${message ? `\nMensaje: ${message}` : ""}\n\nYa está activa en tu perfil.`
    );
  } catch (err) {
    console.error(`[EMAIL] Error enviando notificación de regalo a ${recipientEmail}:`, err);
  }
}

export async function sendGiftSenderConfirmationEmail(
  senderEmail: string,
  senderName: string,
  recipientName: string,
  recipientEmail: string,
  productName: string,
  isGift: boolean
) {
  if (!canSendEmail()) return;
  try {
    const subject = isGift
      ? `Tu regalo fue enviado correctamente — PAUDRONIX GT`
      : `Suscripción enviada correctamente — PAUDRONIX GT`;

    await sendEmail(
      senderEmail,
      subject,
      emailBaseLight(`
        ${headingLight(isGift ? `¡Regalo enviado con éxito! ✓` : `¡Suscripción enviada con éxito! ✓`)}
        ${paragraphLight(isGift
          ? `Tu regalo fue enviado correctamente a <strong>${recipientName}</strong>. Ya tiene su suscripción activa en su perfil.`
          : `La suscripción fue enviada correctamente a <strong>${recipientName}</strong>. Ya está activa en su perfil.`
        )}
        ${infoBoxLight([
          { label: isGift ? "Destinatario" : "Enviado a", value: `${recipientName} (${recipientEmail})` },
          { label: isGift ? "Regalo" : "Suscripción", value: productName },
          { label: "Estado", value: "✓ Entregado" },
        ])}
        ${alertBoxLight("El saldo fue descontado de tu cuenta. Puedes ver tus transacciones desde tu perfil.", "success")}
        ${paragraphLight("Gracias por usar <strong>PAUDRONIX GT</strong>. Si tienes alguna duda contáctanos por WhatsApp o soporte.")}
      `),
      `PAUDRONIX GT\n\nHola ${senderName},\n${isGift ? "Tu regalo" : "La suscripción"} para ${recipientName} (${recipientEmail}) fue enviado correctamente.\nProducto: ${productName}\nEstado: Entregado\n\nEl saldo fue descontado de tu cuenta.`
    );
  } catch (err) {
    console.error(`[EMAIL] Error enviando confirmación al remitente ${senderEmail}:`, err);
  }
}

export async function sendSubscriptionRefundEmail(email: string, firstName: string, subscriptionName: string, amount: number, adminNotes?: string) {
  if (!canSendEmail()) return;
  try {
    await sendEmail(
      email,
      `Reembolso procesado: ${subscriptionName} — PAUDRONIX GT`,
      emailBaseLight(`
        ${headingLight(`Tu reembolso fue procesado, ${firstName}`)}
        ${alertBoxLight(`Se procesó un reembolso de <strong>Q${amount.toFixed(2)}</strong> a tu saldo de cuenta por la suscripción <strong>${subscriptionName}</strong>.`, 'success')}
        ${infoBoxLight([
          { label: 'Suscripción', value: subscriptionName },
          { label: 'Monto reembolsado', value: `Q${amount.toFixed(2)}` },
          { label: 'Estado', value: '✓ Acreditado a tu saldo' },
        ])}
        ${adminNotes ? `
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;margin:18px 0;">
          <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px;">Nota del equipo</p>
          <p style="color:#374151;font-size:14px;margin:0;line-height:1.75;">${adminNotes}</p>
        </div>` : ''}
        ${paragraphLight('El saldo ya está disponible en tu cuenta. Puedes usarlo para comprar otro producto o solicitar una recarga.')}
        ${paragraphLight('Si tienes más preguntas, escríbenos por soporte o WhatsApp.')}
      `),
      `PAUDRONIX GT - Reembolso procesado\n\nHola ${firstName},\nSe procesó un reembolso de Q${amount.toFixed(2)} a tu saldo por la suscripción ${subscriptionName}.\nEl saldo ya está disponible en tu cuenta.${adminNotes ? '\nNota del equipo: ' + adminNotes : ''}`
    );
  } catch (err) { }
}

export async function sendAdminFortniteOrderEmail(
  customerName: string,
  fortniteUsername: string,
  itemName: string,
  price: number,
  orderRef: string,
  userEmail: string
) {
  if (!canSendEmail() || !process.env.ADMIN_EMAIL) return;
  try {
    await sendEmail(
      process.env.ADMIN_EMAIL,
      `⚡ NUEVO PEDIDO FORTNITE — ${itemName}`,
      emailBase(`
        <tr>
          <td style="background:linear-gradient(135deg,#4f1d96 0%,#1e0a50 100%);padding:32px 40px 28px;">
            <p style="color:#f8d43a;font-size:11px;font-weight:900;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px;">⚡ PAUDRONIX GT — FORTNITE</p>
            <h2 style="color:#ffffff;font-size:24px;font-weight:900;margin:0 0 4px;letter-spacing:-0.5px;">Nuevo pedido de skin/pavos</h2>
            <p style="color:#c4b5fd;font-size:13px;margin:0;">Acción requerida: enviar regalo desde Epic Games</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#0f0a1e;padding:32px 40px;">
            <div style="background:#1a1030;border:1px solid #4f1d9640;border-radius:12px;padding:20px 24px;margin:0 0 20px;">
              <p style="color:#a78bfa;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Detalles del pedido</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:6px 0;border-bottom:1px solid #2a1a40;">
                  <span style="color:#9ca3af;font-size:13px;">Item</span>
                  <span style="color:#ffffff;font-size:13px;font-weight:700;float:right;">${itemName}</span>
                </td></tr>
                <tr><td style="padding:6px 0;border-bottom:1px solid #2a1a40;">
                  <span style="color:#9ca3af;font-size:13px;">Precio</span>
                  <span style="color:#f8d43a;font-size:16px;font-weight:900;float:right;">Q${price.toFixed(2)}</span>
                </td></tr>
                <tr><td style="padding:6px 0;border-bottom:1px solid #2a1a40;">
                  <span style="color:#9ca3af;font-size:13px;">Referencia</span>
                  <span style="color:#ffffff;font-size:13px;font-weight:700;float:right;font-family:monospace;">${orderRef}</span>
                </td></tr>
                <tr><td style="padding:6px 0;border-bottom:1px solid #2a1a40;">
                  <span style="color:#9ca3af;font-size:13px;">Cliente</span>
                  <span style="color:#ffffff;font-size:13px;font-weight:700;float:right;">${customerName}</span>
                </td></tr>
                <tr><td style="padding:6px 0;border-bottom:1px solid #2a1a40;">
                  <span style="color:#9ca3af;font-size:13px;">Correo</span>
                  <span style="color:#60a5fa;font-size:13px;font-weight:700;float:right;">${userEmail}</span>
                </td></tr>
              </table>
            </div>
            <div style="background:linear-gradient(135deg,#1a0a3090,#0d1b3e);border:2px solid #f8d43a;border-radius:14px;padding:20px 24px;margin:0 0 20px;text-align:center;">
              <p style="color:#9ca3af;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">Usuario de Fortnite / Epic Games</p>
              <p style="color:#f8d43a;font-size:26px;font-weight:900;letter-spacing:3px;margin:0;font-family:monospace;">${fortniteUsername}</p>
              <p style="color:#c4b5fd;font-size:11px;margin:8px 0 0;">Envía la solicitud de amistad desde tu cuenta Epic y luego envía el regalo</p>
            </div>
            <div style="background:#0c1a0c;border:1px solid #16a34a40;border-radius:10px;padding:14px 18px;">
              <p style="color:#4ade80;font-size:12px;font-weight:700;margin:0 0 6px;">✅ Pasos para entregar:</p>
              <ol style="color:#86efac;font-size:12px;margin:0;padding-left:18px;line-height:2;">
                <li>Busca al usuario <strong>${fortniteUsername}</strong> en Fortnite/Epic Games</li>
                <li>Envía solicitud de amistad desde tu cuenta bot</li>
                <li>Una vez aceptada, envía el regalo: <strong>${itemName}</strong></li>
                <li>Marca el pedido como "Completado" en el panel admin</li>
              </ol>
            </div>
          </td>
        </tr>
      `),
      `NUEVO PEDIDO FORTNITE\n\nItem: ${itemName}\nPrecio: Q${price}\nCliente: ${customerName}\nCorreo: ${userEmail}\nUsuario Fortnite: ${fortniteUsername}\nReferencia: ${orderRef}\n\nEnvía la solicitud de amistad y el regalo desde Epic Games.`
    );
  } catch (err) { }
}

export async function sendUserFortniteOrderEmail(
  email: string,
  customerName: string,
  itemName: string,
  price: number,
  orderRef: string,
  fortniteUsername: string
) {
  if (!canSendEmail()) return;
  try {
    await sendEmail(
      email,
      `⚡ Tu pedido Fortnite fue recibido — ${itemName}`,
      emailBaseLight(`
        ${headingLight(`¡Pedido confirmado, ${customerName}!`)}
        ${alertBoxLight(`Tu compra de <strong>${itemName}</strong> fue procesada correctamente.`, 'success')}
        ${infoBoxLight([
          { label: 'Item comprado', value: itemName },
          { label: 'Monto pagado', value: `Q${price.toFixed(2)}` },
          { label: 'Número de referencia', value: orderRef },
          { label: 'Usuario Fortnite registrado', value: fortniteUsername },
          { label: 'Estado', value: 'En proceso — Regalo pendiente de envío' },
        ])}
        <div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:12px;padding:20px 24px;margin:20px 0;">
          <p style="color:#15803d;font-size:13px;font-weight:900;margin:0 0 10px;">⚡ ¿Qué pasa ahora?</p>
          <ol style="color:#166534;font-size:13px;margin:0;padding-left:18px;line-height:2;">
            <li>Nuestro equipo revisará tu pedido</li>
            <li>Recibirás una <strong>solicitud de amistad</strong> en Fortnite desde nuestra cuenta bot — <strong>acéptala</strong></li>
            <li>El regalo llegará a tu cuenta en <strong>hasta 2 días</strong></li>
            <li>Recibirás un correo de confirmación cuando esté entregado</li>
          </ol>
        </div>
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 18px;margin:16px 0;">
          <p style="color:#92400e;font-size:12px;font-weight:700;margin:0;">⚠️ Importante: Nunca pedimos tu contraseña de Fortnite o Epic Games. Si alguien te la pide en nuestro nombre, repórtalo de inmediato.</p>
        </div>
        ${paragraphLight('¿Dudas? Contáctanos por WhatsApp: +502 3787 1216 o desde la plataforma.')}
      `),
      `PAUDRONIX GT - Pedido Fortnite confirmado\n\nHola ${customerName},\nTu pedido fue recibido.\n\nItem: ${itemName}\nMonto: Q${price}\nReferencia: ${orderRef}\nUsuario Fortnite: ${fortniteUsername}\n\nRecibirás una solicitud de amistad en Fortnite. Acéptala para recibir el regalo.`
    );
  } catch (err) { }
}

export async function sendAdminRefundProcessedEmail(userName: string, userEmail: string, subscriptionName: string, amount: number) {
  if (!canSendEmail() || !process.env.ADMIN_EMAIL) return;
  try {
    await sendEmail(
      process.env.ADMIN_EMAIL,
      `Reembolso procesado — ${subscriptionName}`,
      emailBaseLight(`
        ${headingLight('Reembolso procesado')}
        ${infoBoxLight([
          { label: 'Usuario', value: userName },
          { label: 'Correo', value: userEmail || 'N/A' },
          { label: 'Suscripción', value: subscriptionName },
          { label: 'Monto reembolsado', value: `Q${amount.toFixed(2)}` },
        ])}
        ${alertBoxLight('El saldo fue acreditado automáticamente al wallet del usuario.', 'info')}
      `),
      `Reembolso procesado\nUsuario: ${userName}\nCorreo: ${userEmail}\nSuscripción: ${subscriptionName}\nMonto: Q${amount.toFixed(2)}`
    );
  } catch (err) { }
}
