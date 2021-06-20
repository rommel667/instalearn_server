import Question from '../../models/question.js'
import checkAuth from '../../utils/checkAuth.js'
import { categoryMerge, subcategoryMerge } from './merge.js'
import mongoose from 'mongoose'
import { categories } from './categoryResolver.js'

let questionCounts = []

const countQuestions = async () => {
    try {
        await Promise.all(categories.map(async cat => {
            const count = await Question.find({ category: cat._id }).countDocuments()
            questionCounts.push({ category: cat.category, count: count })
        }))
    } catch (err) {
        console.log(err);
    }
}

export default {
    Query: {
        questionCounts: async () => {
            console.log("questionCounts");
            if (!questionCounts) {
                throw new Error("No counts found")
            }
            if (questionCounts.length === 0) {
                await countQuestions()
                return questionCounts.map(qc => {
                    return { ...qc }
                })
            } else {
                return questionCounts.map(qc => {
                    return { ...qc }
                })
            }

        },
        questionsByCategory: async (_, { category }) => {
            console.log("questionsByCategory", category);
            try {
                const questions = await Question.find({ category })
                // console.log(questions);
                if (!questions) {
                    throw new Error(`No questions on database with category ${category}`)
                }
                return questions.map(question => {
                    return { ...question._doc, category: categoryMerge.bind(this, category), subcategory: subcategoryMerge.bind(this, question._doc.subcategory) }
                })
            }
            catch (err) {
                throw new Error(err)
            }
        },
        questionsBySubcategory: async (_, { subcategory }) => {
            console.log("questionsBySubcategory");
            try {
                const questions = await Question.find({ subcategory })
                if (!questions) {
                    throw new Error(`No questions on database with subcategory ${subcategory}`)
                }
                return questions.map(question => {
                    return { ...question._doc, subcategory: subcategoryMerge.bind(this, subcategory) }
                })
            }
            catch (err) {
                throw new Error(err)
            }
        },
        randomQuestionsByCategory: async (_, { category, size }) => {
            console.log("randomQuestionsByCategory", category, size);
         
            try {
                const questions = await Question.aggregate([
                    { $match: { category: new mongoose.Types.ObjectId(category) } },
                    { $sample: { size } }
                ])

                if (!questions) {
                    throw new Error(`No questions on database with category ${category}`)
                }
                return questions.map(question => {
                    return { ...question, category: categoryMerge.bind(this, question.category), subcategory: subcategoryMerge.bind(this, question.subcategory) }
                })
            }
            catch (err) {
                throw new Error(err)
            }
        },
        randomQuestionsByCategoryAndSubcategory: async (_, { category, subcategory, size }) => {
            console.log("randomQuestionsByCategoryAndSubcategory", category, subcategory, size);
         
            try {
                const questions = await Question.aggregate([
                    { $match: { category: new mongoose.Types.ObjectId(category), subcategory: new mongoose.Types.ObjectId(subcategory) } },
                    { $sample: { size } }
                ])

                if (!questions) {
                    throw new Error(`No questions on database with category ${category}`)
                }
                return questions.map(question => {
                    return { ...question, category: categoryMerge.bind(this, question.category), subcategory: subcategoryMerge.bind(this, question.subcategory) }
                })
            }
            catch (err) {
                throw new Error(err)
            }
        },
        searchQuestion: async (_, { inputValue }) => {
            console.log("searchQuestion", inputValue);
            try {
                const questions = await Question.find({ question: { $regex: new RegExp(".*" + inputValue + ".*", "i") } }).limit(5)
                // if(!questions) {
                //     throw new Error(`No questions on database with category ${category}` )
                // }

                return questions.map(question => {
                    return { ...question._doc }
                })
            }
            catch (err) {
                throw new Error(err)
            }
        },
    },
    Mutation: {
        createQuestion: async (_, { questionInput: { question, category, subcategory, option1, option2, option3, option4, answer, image } }, context) => {
            console.log("createQuestion", question);
            const user = await checkAuth(context)
            console.log(user);
            try {
                const questionDB = await Question.findOne({ question })
                if (questionDB) {
                    console.log('Question already in database');
                    throw new Error('Question already in database')
                }
                const newQuestion = new Question({
                    question, category, subcategory, option1, option2, option3, option4, answer, image, contributor: user.id
                })
                const result = await newQuestion.save()
                console.log(result);
                return { ...result._doc, category: categoryMerge.bind(this, category), subcategory: subcategoryMerge.bind(this, subcategory) }
            }
            catch (err) {
                throw new Error(err)
            }
        },
        editQuestion: async (_, { _id, questionInput: { question, category, subcategory, option1, option2, option3, option4, answer } }) => {
            console.log("editQuestion");
            try {
                const result = await Question.findByIdAndUpdate(_id, { $set: { question, category, subcategory, option1, option2, option3, option4, answer } }, { new: true })
                if (!result) {
                    throw new Error('Question not found')
                }
                return { ...result._doc }
            }
            catch (err) {
                throw new Error(err)
            }
        },
        deleteQuestion: async (_, { _id }) => {
            console.log("deleteQuestion");
            try {
                const result = await Question.findByIdAndDelete(_id)
                if (!result) {
                    throw new Error('Question not found')
                }
                return { ...result._doc }
            }
            catch (err) {
                throw new Error(err)
            }
        }
    }
}