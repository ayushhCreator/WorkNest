import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const testSender = 'ayushraj150103@gmail.com'; 

console.log('--- Testing Email Sender ---');
console.log('Attempting to send as:', testSender);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT == 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const mailOptions = {
  from: testSender,
  to: 'ayushraj150103@gmail.com', // Send to self
  subject: 'WorkNest Sender Verification Test',
  text: 'If you receive this, the sender address ' + testSender + ' is valid!'
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('❌ Failed to send as ' + testSender);
    console.error(error);
  } else {
    console.log('✅ Successfully sent email!');
    console.log('Message ID:', info.messageId);
  }
});
