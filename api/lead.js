// api/lead.js — Función serverless para Vercel
// Recibe los datos del lead desde el chatbot y le manda un correo a Fernando
// usando Resend. Reemplaza al Apps Script de Google (que daba problemas).

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    var data = req.body || {};

    // ── A quién llega el correo ──
    var EMAIL_FERNANDO = "camilo.rodriguez.ara@gmail.com"; // <<< CAMBIAR por el correo real

    // Temperatura del lead según el score
    var score = parseFloat(data.score || "5");
    var caliente = score >= 7;
    var emoji = caliente ? "🔥" : "🌲";
    var etiqueta = caliente ? "LEAD CALIENTE" : "Nuevo lead";

    // Link de WhatsApp para que Fernando contacte al lead
    var waNumero = String(data.whatsapp || "").replace(/[^0-9]/g, "");
    if (waNumero.indexOf("56") !== 0 && waNumero.length === 9) waNumero = "56" + waNumero;
    var saludo = "Hola " + (data.nombre || "") + "! Soy Fernando de Raíces de Paillaco. " +
                 "Vi que cotizaste por la web, te cuento de las parcelas que quedan disponibles 🌲";
    var waLink = "https://wa.me/" + waNumero + "?text=" + encodeURIComponent(saludo);

    var primerNombre = (data.nombre || "el lead").split(" ")[0];

    var asunto = emoji + " " + etiqueta + " — " + (data.nombre || "Sin nombre") +
                 " (calificación " + (data.score || "s/i") + "/10)";

    var html =
      '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;border:1px solid #e0ddd4;border-radius:12px;overflow:hidden">' +
        '<div style="background:#063042;padding:20px 24px;color:#F4F1EA">' +
          '<div style="float:right;text-align:center;background:rgba(168,185,52,.2);border:1px solid rgba(168,185,52,.5);border-radius:12px;padding:8px 14px">' +
            '<div style="font-size:24px;color:#A8B934;font-weight:bold;line-height:1">' + (data.score || "—") + '</div>' +
            '<div style="font-size:10px;color:#A8B934">/ 10</div>' +
          '</div>' +
          '<div style="font-size:12px;color:#A8B934;letter-spacing:1px">' + etiqueta.toUpperCase() + '</div>' +
          '<div style="font-size:22px;font-weight:600;margin-top:4px">' + (data.nombre || "Sin nombre") + '</div>' +
          '<div style="font-size:14px;opacity:.8">' + (data.ciudad || "Ciudad no indicada") + '</div>' +
        '</div>' +
        '<div style="padding:22px 24px;color:#1A1A17;font-size:15px;line-height:1.7">' +
          '<table style="width:100%;border-collapse:collapse">' +
            fila("WhatsApp", data.whatsapp) +
            fila("Ciudad", data.ciudad) +
            fila("Calificación", (data.score || "—") + " / 10") +
            fila("Fecha", data.fecha) +
          '</table>' +
          '<div style="margin-top:16px;padding:14px;background:#f5f4ef;border-radius:10px;font-size:14px">' +
            '<strong style="color:#7f8f16">Resumen de lo que preguntó:</strong><br>' + (data.resumen || "—") +
          '</div>' +
          '<a href="' + waLink + '" style="display:block;text-align:center;margin-top:20px;background:#25D366;color:#fff;text-decoration:none;padding:14px;border-radius:10px;font-size:16px;font-weight:bold">' +
            '💬 Hablar con ' + primerNombre + ' por WhatsApp' +
          '</a>' +
        '</div>' +
      '</div>';

    // Enviar con Resend
    var r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Asistente Raíces <onboarding@resend.dev>", // remitente de prueba de Resend
        to: [EMAIL_FERNANDO],
        subject: asunto,
        html: html,
      }),
    });

    var result = await r.json();
    if (!r.ok) {
      console.error("Resend error:", result);
      return res.status(500).json({ ok: false, error: result });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
}

function fila(label, val) {
  return '<tr>' +
    '<td style="padding:6px 0;color:#7f8f16;font-weight:bold;width:42%">' + label + '</td>' +
    '<td style="padding:6px 0">' + (val || "—") + '</td>' +
  '</tr>';
}
