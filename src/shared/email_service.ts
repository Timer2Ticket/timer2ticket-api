import * as nodemailer from 'nodemailer';
import { Constants } from './constants';
import { translateService } from './translate_service';

export async function sendEmail(
  recipient: string,
  language: string,
  subject: string,
  text: string,
  isTextHtml = true,
): Promise<boolean> {
  const transporter = nodemailer.createTransport({
    host: Constants.emailHost,
    port: 465,
    secure: true,
    auth: {
      user: Constants.emailUsername,
      pass: Constants.emailSecret,
    },
  });

  const footer = translateService.get(language, 'emailGenericFooter');

  if (isTextHtml) {
    const info = await transporter.sendMail({
      from: Constants.emailUsername,
      to: recipient,
      subject: subject,
      html: `${text}<br/><br/><footer><p><em>${footer}</em></p></footer>`,
    });

    console.log(info);

    return true;
  }

  await transporter.sendMail({
    from: Constants.emailUsername,
    to: recipient,
    subject: subject,
    text: `${text}\n\n${footer}`,
  });

  return true;
}