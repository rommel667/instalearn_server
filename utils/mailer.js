import { createTransport } from 'nodemailer'
import Email from 'email-templates'

const transporter = createTransport({
    // host: 'smtp.live.com',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
})

const email = new Email({
    transport: transporter,
    send: true,
    preview: false,
});

export const mailer = (userEmail, name, code) => {
    console.log(userEmail);
    email.send({
        template: 'hello',
        message: {
            from: process.env.MY_EMAIL,
            to: userEmail,
        },
        locals: {
            name,
            code
        },
      }).then(() => console.log('email has been send!'));
}


























// export const mailer = (email, code) => {
//     const options = {
//         from: "in_the_zone2021@outlook.com",
//         to: email,
//         subject: "Email account verification",
//         text: `Welcome to InTheZone. Your code is ${code}`,
//     }

//     transporter.sendMail(options, (err, info) => {
//         if (err) {
//             console.log(err);
//             return err
//         }
//         console.log(info.response);
//         return info.response
//     })
// }




