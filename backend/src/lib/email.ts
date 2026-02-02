import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';

// Asegurarse de cargar el .env
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Librería Amicone <onboarding@resend.dev>';

export const sendBookRequestEmail = async (
    ownerEmail: string,
    ownerName: string,
    requesterName: string,
    bookTitle: string
) => {
    try {
        await resend.emails.send({
            from: FROM_EMAIL,
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
        });
    } catch (error) {
        console.error('Error sending book request email:', error);
    }
};

export const sendRequestApprovedEmail = async (
    requesterEmail: string,
    requesterName: string,
    ownerName: string,
    bookTitle: string
) => {
    try {
        await resend.emails.send({
            from: FROM_EMAIL,
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
        });
    } catch (error) {
        console.error('Error sending request approved email:', error);
    }
};
