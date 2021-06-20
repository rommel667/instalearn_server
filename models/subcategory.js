import mongoose from 'mongoose'

const subcategorySchema = new mongoose.Schema({
    subcategory: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }
}, { timestamps: true })

export default mongoose.model('Subcategory', subcategorySchema)