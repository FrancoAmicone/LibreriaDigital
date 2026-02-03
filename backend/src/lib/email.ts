import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Asegurarse de cargar el .env
dotenv.config();

const GMAIL_USER = 'fncmicndev@gmail.com';
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;

console.log('--- Email Setup Debug ---');
console.log('Working Directory:', process.cwd());
console.log('GMAIL_APP_PASSWORD exists:', !!GMAIL_PASS);
if (GMAIL_PASS) {
    console.log('GMAIL_APP_PASSWORD length:', GMAIL_PASS.length);
    if (GMAIL_PASS.length !== 16) {
        console.warn('⚠️ WARNING: Google App Passwords must be 16 characters (no spaces). Your current length is', GMAIL_PASS.length);
    }
}
console.log('------------------------');

// Configuración de Nodemailer muy robusta para evitar timeouts
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // false para STARTTLS (puerto 587)
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS,
    },
    tls: {
        // Esto ayuda en entornos donde el certificado o el proxy dan problemas
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
    },
    debug: true,
    logger: true,
    connectionTimeout: 20000, // Aumentamos a 20 segundos
    greetingTimeout: 20000,
});

// Verificar conexión al iniciar
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Error crítico de conexión SMTP:', error);
    } else {
        console.log('✅ Servidor de correo listo para enviar mensajes');
    }
});

export const sendBookRequestEmail = async (
    ownerEmail: string,
    ownerName: string,
    requesterName: string,
    bookTitle: string
) => {
    console.log(`Attempting to send request email to: ${ownerEmail} via Nodemailer`);

    const mailOptions = {
        from: '"Librería Amicone" <fncmicndev@gmail.com>',
        to: ownerEmail,
        subject: `📖 ¡Alguien quiere tu libro! - ${bookTitle}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h1 style="color: #333;">¡Hola ${ownerName}!</h1>
                <p style="font-size: 16px; color: #555;">
                    <strong>${requesterName}</strong> ha solicitado tu libro <strong>"${bookTitle}"</strong>.
                </p>
                <p style="font-size: 16px; color: #555;">
                    Entra a la aplicación para aceptar o rechazar la solicitud.
                </p>
                <div style="margin-top: 30px; text-align: center;">
                    <a href="https://libreria-amicone.vercel.app/profile" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver mis solicitudes</a>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
    } catch (error) {
        console.error('Error sending book request email:', error);
    }
};

export const sendRequestRejectedEmail = async (
    requesterEmail: string,
    requesterName: string,
    ownerName: string,
    bookTitle: string
) => {
    console.log(`Attempting to send rejection email to: ${requesterEmail} via Nodemailer`);

    const mailOptions = {
        from: '"Librería Amicone" <fncmicndev@gmail.com>',
        to: requesterEmail,
        subject: `❌ Solicitud rechazada - ${bookTitle}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h1 style="color: #333;">Hola ${requesterName}</h1>
                <p style="font-size: 16px; color: #555;">
                    Lamentablemente, <strong>${ownerName}</strong> ha rechazado tu solicitud por el libro <strong>"${bookTitle}"</strong>.
                </p>
                <p style="font-size: 16px; color: #555;">
                    ¡No te preocupes! Hay muchos otros libros disponibles en la biblioteca.
                </p>
                <div style="margin-top: 30px; text-align: center;">
                    <a href="https://libreria-amicone.vercel.app/" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Explorar otros libros</a>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
    } catch (error) {
        console.error('Error sending request rejected email:', error);
    }
};

export const sendRequestApprovedEmail = async (
    requesterEmail: string,
    requesterName: string,
    ownerName: string,
    bookTitle: string
) => {
    console.log(`Attempting to send approval email to: ${requesterEmail} via Nodemailer`);

    const mailOptions = {
        from: '"Librería Amicone" <fncmicndev@gmail.com>',
        to: requesterEmail,
        subject: `✅ ¡Tu solicitud fue aceptada! - ${bookTitle}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h1 style="color: #333;">¡Buenas noticias ${requesterName}!</h1>
                <p style="font-size: 16px; color: #555;">
                    <strong>${ownerName}</strong> ha aceptado tu solicitud por el libro <strong>"${bookTitle}"</strong>.
                </p>
                <p style="font-size: 16px; color: #555;">
                    Ya puedes coordinar la entrega.
                </p>
                <div style="margin-top: 30px; text-align: center;">
                    <a href="https://libreria-amicone.vercel.app/profile" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver mi biblioteca</a>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
    } catch (error) {
        console.error('Error sending request approved email:', error);
    }
};
