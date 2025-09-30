const nodemailer = require('nodemailer');
const Webinar = require('../models/Webinar');

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendWelcomeEmail(userEmail, userName, webinarId) {
    try {
        const webinar = await Webinar.findById(webinarId);
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `Welcome to ${webinar.title} Webinar!`,
            html: `
                <h2>Welcome to ${webinar.title}!</h2>
                <p>Dear ${userName},</p>
                <p>Thank you for registering for our webinar "${webinar.title}".</p>
                <p><strong>Webinar Details:</strong></p>
                <ul>
                    <li>Date: ${new Date(webinar.date).toLocaleDateString()}</li>
                    <li>Time: ${webinar.time}</li>
                    <li>Duration: ${webinar.duration}</li>
                </ul>
                <p>We will send you the joining link before the webinar starts.</p>
                <p>Best regards,<br>Webinar Team</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${userEmail}`);
    } catch (error) {
        console.error('Email sending error:', error);
    }
}

async function sendBulkEmail(users, subject, message) {
    try {
        for (const user of users) {
            const personalizedMessage = message.replace(/{{name}}/g, user.name);
            
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: subject,
                html: `
                    <h2>${subject}</h2>
                    <p>Dear ${user.name},</p>
                    ${personalizedMessage}
                    <p>Best regards,<br>Webinar Team</p>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`Bulk email sent to ${user.email}`);
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch (error) {
        console.error('Bulk email error:', error);
        throw error;
    }
}

module.exports = { sendWelcomeEmail, sendBulkEmail };