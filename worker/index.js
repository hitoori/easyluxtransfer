import { authorizeBooking } from "./booking-security.js";
import { MAX_REQUEST_BYTES, readLimitedBody, RequestTooLarge } from "./request-body.js";
export { BookingRateLimiter } from "./booking-security.js";

const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", ...extraHeaders },
});

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));

function emailTemplate({ title, paragraphs, code, details, env, signoff, companyIntro }) {
  const socials = [
    ["Instagram", env.BOOKING_INSTAGRAM_URL],
    ["Facebook", env.BOOKING_FACEBOOK_URL],
    ["TikTok", env.BOOKING_TIKTOK_URL],
  ].filter(([, url]) => typeof url === "string" && /^https:\/\//i.test(url));
  const socialButtons = socials.length ? `<tr><td align="center" style="padding:4px 0 22px"><div style="font:600 10px Arial,sans-serif;letter-spacing:2px;color:#a9a39b;text-transform:uppercase;margin-bottom:12px">Follow Easy Lux</div>${socials.map(([label, url]) => `<a href="${escapeHtml(url)}" style="display:inline-block;margin:0 4px;padding:10px 13px;border:1px solid #62512c;border-radius:4px;color:#e0b83e;font:600 11px Arial,sans-serif;text-decoration:none">${label}</a>`).join("")}</td></tr>` : "";
  const paragraphsHtml = (paragraphs || []).map((paragraph) => `<p style="margin:0 0 16px">${escapeHtml(paragraph)}</p>`).join("");
  const detailsCard = `<tr><td style="padding:0 30px 22px"><div style="padding:17px 18px;border:1px solid #303435;border-radius:5px;background:#111515"><div style="font:600 10px Arial,sans-serif;letter-spacing:2px;color:#d8ad32;text-transform:uppercase;margin-bottom:10px">${companyIntro ? "Request details" : "Your request details"}</div><div style="font:14px/1.8 Arial,sans-serif;color:#dedbd4;white-space:pre-line">${escapeHtml(details)}</div></div></td></tr>`;
  const whatsapp = "https://wa.me/393207874212";
  const brand = `<table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0"><tr><td valign="middle" style="padding-right:18px"><a href="https://easyluxtransfer.com/" style="text-decoration:none"><img src="https://easyluxtransfer.com/images/brand/easy-lux-logo-wordmark.png" alt="Easy Lux Transfer" width="72" height="72" style="display:block;width:72px;height:72px;border:0"/></a></td><td valign="middle"><div style="border-left:1px solid #84652D;padding-left:16px;font:11px/2 Arial,sans-serif;letter-spacing:2px;color:#C8C0B5;text-align:left;white-space:nowrap">YOUR DRIVER<br/>AROUND ITALY</div></td></tr></table>`;
  const signoffHtml = signoff ? `<tr><td style="padding:0 30px 22px;font:14px/1.8 Arial,sans-serif;color:#d1cec7">${escapeHtml(signoff).replace(/\n/g, "<br/>")}</td></tr>` : "";
  const introHtml = companyIntro ? `<p style="margin:0">${companyIntro}</p>` : paragraphsHtml;
  return `<!doctype html><html><body bgcolor="#ffffff" style="margin:0;padding:24px 10px;background:#ffffff;color:#e9e6df"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;margin:0 auto;background:#111516;border:1px solid #292e2f;border-radius:8px"><tr><td align="center" style="padding:28px 24px 22px">${brand}</td></tr><tr><td style="padding:4px 30px 0"><div style="height:1px;background:#4a4129"></div></td></tr><tr><td align="center" style="padding:27px 30px 8px"><div style="font:30px/1.2 Georgia,serif;color:#f0ece4">${escapeHtml(title)}</div><div style="margin-top:15px;padding:8px 14px;display:inline-block;border:1px solid #4a4129;border-radius:4px;color:#ddb52f;font:600 11px Arial,sans-serif;letter-spacing:1.5px">REFERENCE&nbsp; ${escapeHtml(code)}</div></td></tr><tr><td style="padding:18px 30px 20px;font:14px/1.85 Arial,sans-serif;color:#d1cec7">${introHtml}</td></tr>${detailsCard}<tr><td align="center" style="padding:0 25px 24px"><a href="${whatsapp}" style="display:inline-block;padding:13px 20px;background:#d8ad32;border:1px solid #d8ad32;border-radius:4px;color:#101212;font:700 11px Arial,sans-serif;letter-spacing:1px;text-decoration:none">CONTACT US ON WHATSAPP&nbsp; →</a><div style="padding-top:14px;font:12px Arial,sans-serif;color:#aaa69e">or email <a href="mailto:easyluxtransfer@gmail.com" style="color:#e0b83e;text-decoration:none">easyluxtransfer@gmail.com</a></div></td></tr>${signoffHtml}${socialButtons}<tr><td style="padding:0 30px"><div style="height:1px;background:#303435"></div></td></tr><tr><td align="center" style="padding:18px 24px 24px;font:11px/1.8 Arial,sans-serif;color:#85837e">Easy Lux Transfer · Customer Service Team<br/>Private Transfers • Airports • Train Stations • Chauffeur Services<br/><a href="tel:+393207874212" style="color:#d8ad32;text-decoration:none">+39 320 787 4212</a>&nbsp; · &nbsp;<a href="tel:+393202416662" style="color:#d8ad32;text-decoration:none">+39 320 241 6662</a></td></tr></table></body></html>`;
}

export async function handleBookingRequest(request, env) {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) return json({ error: "Invalid origin." }, 403);
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return json({ error: "Invalid content type." }, 415);
  if (Number(request.headers.get("content-length") || 0) > MAX_REQUEST_BYTES) return json({ error: "Request too large." }, 413);
  let data;
  try { data = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(await readLimitedBody(request.body))); }
  catch (error) { return json({ error: error instanceof RequestTooLarge ? "Request too large." : "Invalid request." }, error instanceof RequestTooLarge ? 413 : 400); }
  if (!data || typeof data !== "object" || Array.isArray(data)) return json({ error: "Invalid request." }, 400);
  if (data.website) return json({ ok: true, requestCode: "" });

  if (typeof data.details === "string" && data.details.length > 16000) return json({ error: "Please shorten your journey details and try again." }, 413);
  const limits = { kind: 32, source: 32, service: 120, name: 120, email: 160, phone: 80, preferredContact: 16, requestId: 64, details: 16000 };
  if (Object.entries(limits).some(([key, max]) => data[key] !== undefined && (typeof data[key] !== "string" || data[key].length > max))) return json({ error: "Please check the request details and try again." }, 400);
  if (data.source === "contact" && (typeof data.message !== "string" || data.message.trim().length < 10 || data.message.length > 3000)) return json({ error: "Please enter a message between 10 and 3000 characters." }, 400);

  const clean = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";
  const kind = clean(data.kind, 32);
  const source = clean(data.source, 32);
  const service = clean(data.service, 120) || ({ transfer: "Private Transfer", hourly: "Chauffeur by the Hour", tours: "Private Day Trips", custom: "Bespoke transfer quote" }[kind] || "Transfer enquiry");
  const name = clean(data.name, 120);
  const email = clean(data.email, 160);
  const phone = clean(data.phone, 80);
  const details = clean(data.details, 16000);
  const preferredContact = clean(data.preferredContact, 16);
  const validInternationalPhone = (value) => /^\+[1-9][\d\s().-]+$/.test(value) && value.replace(/\D/g, "").length >= 7 && value.replace(/\D/g, "").length <= 15;
  if (typeof data.details === "string" && data.details.length > 16000) return json({ error: "Please shorten your journey details and try again." }, 413);
  if ((preferredContact && !["email", "whatsapp"].includes(preferredContact)) ||
      (preferredContact === "whatsapp" && !validInternationalPhone(phone)) ||
      (preferredContact && phone && !validInternationalPhone(phone))) {
    return json({ error: "Please provide a valid international phone number for WhatsApp." }, 400);
  }
  const requestId = clean(data.requestId, 64);
  if (!["transfer", "hourly", "tours", "custom"].includes(kind) || !["home-booking", "home-quote", "services-quote", "contact"].includes(source) || name.length < 2 ||
      !/^[^\s@<>(),;:"\\[\]]+@[^\s@<>(),;:"\\[\]]+\.[^\s@<>(),;:"\\[\]]+$/.test(email) || details.length < 10 ||
      data.consent !== true || !/^[a-f0-9-]{36}$/.test(requestId)) {
    return json({ error: "Please check the request details and try again." }, 400);
  }
  if (!env.RESEND_API_KEY || !env.BOOKING_FROM_EMAIL || !env.BOOKING_TO_EMAIL) {
    return json({ error: "Online booking is being configured. Please contact us directly for now." }, 503);
  }
  const securityError = await authorizeBooking(request, env, data, email);
  if (securityError) return json({ error: securityError.error }, securityError.status, securityError.retryAfter ? { "retry-after": String(securityError.retryAfter) } : {});

  const requestCode = `ELX-${requestId.slice(0, 8).toUpperCase()}`;
  const sourceLabels = { "home-booking": "Home · Booking form", "home-quote": "Home · Bespoke quote", "services-quote": "Services · Transfer quote", contact: "Contact page · Enquiry" };
  const sourceLabel = sourceLabels[source];
  const family = source === "home-booking" ? "booking" : source === "contact" ? "contact" : "quote";
  const copies = {
    booking: {
      title: "Your booking request is received",
      paragraphs: ["Thank you for choosing Easy Lux Transfer.", "We are pleased to confirm that your booking request has been successfully received and that all the details regarding your transfer have been registered in our system.", "You will shortly be contacted by one of our operators via email or WhatsApp, who will provide you with all the necessary information regarding your transfer, including service details, meeting arrangements with your driver, and any additional information you may need for a smooth and comfortable journey.", "During this communication, you will also receive instructions on how to proceed with a deposit payment, which is required to fully confirm your booking and secure the availability of your requested transfer.", "Thank you once again for choosing Easy Lux Transfer. We look forward to providing you with a professional, reliable, and comfortable transfer experience."],
      signoff: "Kind regards,\nEasy Lux Transfer\nCustomer Service Team\nPrivate Transfers • Airports • Train Stations • Chauffeur Services",
      subject: "Booking request received",
    },
    quote: {
      title: "Your quote request is received",
      paragraphs: ["Thank you for contacting Easy Lux Transfer.", "We are pleased to confirm that your request has been successfully received and is currently being processed by our team.", "One of our operators will contact you as soon as possible via email or WhatsApp to provide you with all the information regarding the transfer you have requested.", "Our team will be happy to assist you personally, answer any questions you may have, and provide you with all the necessary details to help you organize your transfer according to your needs.", "Thank you for choosing and contacting Easy Lux Transfer. We truly appreciate your interest in our services and look forward to assisting you soon."],
      signoff: "Kind regards,\nEasy Lux Transfer\nCustomer Service Team\nPrivate Transfers • Airport Transfers • Chauffeur Services",
      subject: "Transfer quote request received",
    },
    contact: {
      title: "Your enquiry is received",
      paragraphs: ["Thank you for contacting Easy Lux Transfer.", "We have successfully received your request, and one of our operators will get in touch with you as soon as possible using the email address or WhatsApp number you provided.", "Our team will provide you with all the necessary information regarding your requested transfer, including the service details and any additional information you may need.", "We will also be happy to answer any questions or specific requests you may have and assist you throughout the organization of your transfer.", "Your request is important to us, and a member of our team will get back to you as soon as possible with all the requested information.", "Thank you once again for choosing Easy Lux Transfer. We look forward to assisting you and providing you with a professional, reliable, and comfortable transfer service."],
      signoff: "Kind regards,\nEasy Lux Transfer\nCustomer Service Team\nPrivate Transfers • Airport Transfers • Chauffeur Services",
      subject: "Contact enquiry received",
    },
  };
  const copy = copies[family];
  const customerStatus = family === "booking" ? "Status: Request only — not yet a confirmed booking.\n\n" : "";
  const requestDetails = `${customerStatus}Service: ${service}\nForm: ${sourceLabel}\n\n${details}`;
  const requestStatus = family === "booking" ? "\nStatus: Request only — not yet a confirmed booking. Estimated extras must be confirmed in the quote." : "";
  const companyText = `New request · ${sourceLabel}\nService: ${service}\nReference: ${requestCode}${requestStatus}\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || "Not provided"}\nPreferred contact: ${preferredContact || "Not specified"}\n\n${details}`;
  const customerText = `Dear ${name},\n\n${[...copy.paragraphs, "Your request details:", requestDetails, copy.signoff].join("\n\n")}\n\nReference: ${requestCode}`;
  const companyHtml = emailTemplate({ title: `New request · ${sourceLabel}`, companyIntro: `<strong style="color:#f0ece4">${escapeHtml(name)}</strong> sent a request through <strong style="color:#f0ece4">${escapeHtml(sourceLabel)}</strong>.<br/>Service: ${escapeHtml(service)}<br/>Email: <a href="mailto:${escapeHtml(email)}" style="color:#e0b83e">${escapeHtml(email)}</a><br/>Phone: ${escapeHtml(phone || "Not provided")}<br/>Preferred contact: ${escapeHtml(preferredContact || "Not specified")}${requestStatus ? `<br/>${escapeHtml(requestStatus)}` : ""}`, code: requestCode, details, env });
  const customerHtml = emailTemplate({
    title: copy.title,
    paragraphs: [`Dear ${name},`, ...copy.paragraphs],
    code: requestCode, details: requestDetails, env, signoff: copy.signoff,
  });
  const senderAddress = env.BOOKING_FROM_EMAIL.match(/<([^<>]+)>/)?.[1] || env.BOOKING_FROM_EMAIL;
  const sender = `Easy Lux Transfer <${senderAddress.trim()}>`;
  let response;
  try {
    response = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
        "Idempotency-Key": `booking/${requestId}`,
      },
      body: JSON.stringify([
        { from: sender, to: [env.BOOKING_TO_EMAIL], reply_to: email,
          subject: `New ${copy.subject} · ${sourceLabel} · ${service} · ${requestCode}`, text: companyText, html: companyHtml },
        { from: sender, to: [email], reply_to: env.BOOKING_TO_EMAIL,
          subject: `${copy.subject} · ${requestCode}`, text: customerText, html: customerHtml },
      ]),
    });
  } catch {
    return json({ error: "The request could not be sent. Please try again." }, 502);
  }
  if (!response.ok) {
    console.error("Booking email provider rejected request", response.status);
    return json({ error: "The request could not be sent. Please contact us directly." }, 502);
  }
  return json({ ok: true, requestCode });
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname === "/api/booking") return handleBookingRequest(request, env);
    return env.ASSETS.fetch(request);
  },
};
