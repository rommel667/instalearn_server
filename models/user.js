import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    photo: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        required: true
    },
    verificationCode: {
        type: Number,

    },
    correctExamArray: [
        [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        }]
    ],
    wrongExamArray: [
        [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        }]
    ],
    correctExamCategory: [
        {
            category: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Category'
            },
            count: {
                type: Number,
                required: true
            }
        }
    ],
    correctExamSubcategory: [
        {
            subcategory: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Subcategory'
            },
            count: {
                type: Number,
                required: true
            }
        }
    ],
    wrongExamCategory: [
        {
            category: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Category'
            },
            count: {
                type: Number,
                required: true
            }
        }
    ],
    wrongExamSubcategory: [
        {
            subcategory: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Subcategory'
            },
            count: {
                type: Number,
                required: true
            }
        }
    ],

    correctQuizArray: [
        [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        }]
    ],
    wrongQuizArray: [
        [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        }]
    ],
    correctQuizCategory: [
        {
            category: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Category'
            },
            count: {
                type: Number,
                required: true
            }
        }
    ],
    correctQuizSubcategory: [
        {
            subcategory: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Subcategory'
            },
            count: {
                type: Number,
                required: true
            }
        }
    ],
    wrongQuizCategory: [
        {
            category: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Category'
            },
            count: {
                type: Number,
                required: true
            }
        }
    ],
    wrongQuizSubcategory: [
        {
            subcategory: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Subcategory'
            },
            count: {
                type: Number,
                required: true
            }
        }
    ],
}, { timestamps: true })

export default mongoose.model('User', userSchema)