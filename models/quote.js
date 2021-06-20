import mongoose from 'mongoose'

const quoteSchema = new mongoose.Schema({
    quote: {
        type: String,
        required: true
    }
}, { timestamps: true })

export default mongoose.model('Quote', quoteSchema)