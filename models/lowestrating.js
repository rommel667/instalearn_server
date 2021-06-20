import mongoose from 'mongoose'

const lowestratingSchema = new mongoose.Schema({
    ranker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    category: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true
    }
}, { timestamps: true })

export default mongoose.model('Lowestrating', lowestratingSchema)