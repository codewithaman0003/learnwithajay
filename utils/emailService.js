import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendWelcomeEmail = async (user) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Welcome to Webinar - Payment Pending',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background: #f9f9f9; }
                        .button { background: #4CAF50; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to Our Webinar!</h1>
                        </div>
                        <div class="content">
                            <h3>Dear ${user.name},</h3>
                            <p>Thank you for registering for our exclusive webinar!</p>
                            <p>Your registration is almost complete. To secure your spot, please complete the payment of ₹49.</p>
                            <p><strong>Webinar Details:</strong></p>
                            <ul>
                                <li>Date: [Webinar Date]</li>
                                <li>Time: [Webinar Time]</li>
                                <li>Duration: 60 minutes</li>
                            </ul>
                            <p style="text-align: center;">
                                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/payment" class="button">
                                    Complete Payment Now
                                </a>
                            </p>
                            <p>If you have any questions, please contact us.</p>
                            <br>
                            <p>Best regards,<br><strong>Webinar Team</strong></p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Welcome email error:', error);
        return false;
    }
};

export const sendPaymentSuccessEmail = async (user) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Webinar Registration Confirmed! 🎉',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background: #f9f9f9; }
                        .success { color: #4CAF50; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Payment Successful! 🎉</h1>
                        </div>
                        <div class="content">
                            <h3>Dear ${user.name},</h3>
                            <p class="success">Your payment of ₹49 has been received successfully!</p>
                            <p>You now have full access to the webinar content and resources.</p>
                            
                            <p><strong>Important Details:</strong></p>
                            <ul>
                                <li><strong>Webinar Date:</strong> [Date]</li>
                                <li><strong>Time:</strong> [Time] IST</li>
                                <li><strong>Meeting Link:</strong> <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/success">Click here to access webinar</a></li>
                                <li><strong>Meeting ID:</strong> Will be shared 1 hour before webinar</li>
                            </ul>
                            
                            <p><strong>What's Next:</strong></p>
                            <ol>
                                <li>Save this email for future reference</li>
                                <li>Join the webinar 5 minutes early</li>
                                <li>Have your questions ready</li>
                            </ol>
                            
                            <p>If you have any questions, reply to this email.</p>
                            <br>
                            <p>Best regards,<br><strong>Webinar Team</strong></p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Success email error:', error);
        return false;
    }
};

export const sendPaymentReminderEmail = async (user) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Reminder: Complete Your Webinar Payment',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background: #f9f9f9; }
                        .button { background: #4CAF50; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; }
                        .urgent { color: #FF9800; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Payment Reminder</h1>
                        </div>
                        <div class="content">
                            <h3>Dear ${user.name},</h3>
                            <p class="urgent">This is a friendly reminder to complete your webinar registration payment.</p>
                            <p>Your spot is reserved but will be released soon if payment is not completed.</p>
                            
                            <p><strong>Webinar Highlights:</strong></p>
                            <ul>
                                <li>Expert-led session</li>
                                <li>Live Q&A opportunity</li>
                                <li>Recording access for 7 days</li>
                                <li>Bonus materials included</li>
                            </ul>
                            
                            <p style="text-align: center;">
                                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/payment" class="button">
                                    Complete Payment Now - ₹49
                                </a>
                            </p>
                            
                            <p><small>If you've already paid, please ignore this email. For issues, contact support.</small></p>
                            <br>
                            <p>Best regards,<br><strong>Webinar Team</strong></p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Reminder email error:', error);
        return false;
    }
};

export const sendBulkEmails = async (users, subject, message, filterType) => {
    try {
        let emailCount = 0;
        
        for (const user of users) {
            const customizedMessage = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background: #f9f9f9; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>${subject}</h1>
                        </div>
                        <div class="content">
                            <p>Dear ${user.name},</p>
                            ${message}
                            ${filterType === 'pending' ? 
                                '<p><a href="' + (process.env.CLIENT_URL || 'http://localhost:3000') + '/payment" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Complete Payment</a></p>' : 
                                ''}
                            <br>
                            <p>Best regards,<br><strong>Webinar Team</strong></p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: subject,
                html: customizedMessage
            };

            await transporter.sendMail(mailOptions);
            emailCount++;
            
            // Add delay to avoid hitting email limits
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return { success: true, count: emailCount };
    } catch (error) {
        console.error('Bulk email error:', error);
        return { success: false, error: error.message };
    }
};