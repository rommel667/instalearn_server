import Admin from '../../models/admin.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'



export default {
    Query: {
        
    },
    Mutation: {
        adminLogin:  async (_, { email, password }) => {
            console.log("adminLogin");
            try {
                const admin = await Admin.findOne({ email })
                if(!admin) {
                    throw new Error('User not found')
                }
                const match = await bcrypt.compare(password, admin.password)
                if(!match) {
                    throw new Error('Wrong credentials')
                }
                const token = jwt.sign({
                    id: admin._id,
                    email: admin.email,
                    name: admin.name
                }, process.env.JWT_SECRET, { expiresIn: '10h' } )
                return { ...admin._doc, token }
            }
            catch (err) {
                throw new Error(err)
            }
        },
        adminRegister: async (_, { adminInput: { name, email, password } }) => {
            console.log("adminRegister", name, email, password );
            const admin = await Admin.findOne({ email })
            if(admin) {
                throw new Error('Email already used')
            }
            
            const hashedPassword = await bcrypt.hash(password, 12)
            try {
                const admin = new Admin({
                    name: name,
                    email: email,
                    password: hashedPassword,
                })
                const result = await admin.save()
                const token = jwt.sign({
                    id: result._id,
                    email: result.email,
                    name: result.name
                }, process.env.JWT_SECRET, { expiresIn: '1h' } )
                return { ...result._doc, token }
            }
            catch (err) {
                throw new Error(err)
            }
        }
    }
     
}