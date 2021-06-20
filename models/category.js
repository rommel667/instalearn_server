import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
    category: {
        type: String,
        required: true
    },
    subcategory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subcategory'
        }
    ] 
}, { timestamps: true })

export default mongoose.model('Category', categorySchema)