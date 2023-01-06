import Sgmail from '@sendgrid/mail'
Sgmail.setApiKey(import.meta.env.SENDGRID_API_KEY)

export async function post({ request }) {
  const body = await request.json()
  const msg = {
    to: body.to, from: 'E-volts Automobiles <noreply@evoltsauto.com>', 
    subject: body.subject, text: 'Notification',
    html: `<div style="max-width:600px;">${body.msg}</div>`
  }
  try {
    await Sgmail.send(msg)
    return new Response(JSON.stringify({
        msg: 'E-mail envoyé au destinataire'
    }))
  } catch (err) {
    return new Response(JSON.stringify({
      err: err
    }))
  }
}