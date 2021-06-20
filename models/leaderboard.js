import mongoose from 'mongoose'

const leaderboardSchema = new mongoose.Schema({
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
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true
    }
}, { timestamps: true })

export default mongoose.model('Leaderboard', leaderboardSchema)