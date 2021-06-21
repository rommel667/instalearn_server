import User from '../../models/user.js'
import Subcategory from '../../models/subcategory.js'
import Question from '../../models/question.js'
import Category from '../../models/category.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import checkAuth from '../../utils/checkAuth.js'
import nodemailer from 'nodemailer'
import sendGridTransport from 'nodemailer-sendgrid-transport'
import { arrayEqual, ranking } from './merge.js'
import { mailer } from '../../utils/mailer.js'


export default {
    Query: {
        userInfo: async (_, args, context) => {
            console.log("userInfo");
            const userContext = await checkAuth(context)
            // console.log(userContext);
            try {
                const user = await User.findOne({ email: userContext.email })
                if (!user) {
                    throw new Error('User not found')
                }
                return { ...user._doc }
            }
            catch (err) {
                throw new Error(err)
            }
        },
    },
    Mutation: {
        login: async (_, { email, password }) => {
            console.log("login", email, password);
            try {
                const user = await User.findOne({ email })
                if (!user) {
                    throw new Error('Wrong credentials!')
                }
                if (user.verified === false) {
                    throw new Error('Please check your email for verification code to proceed')
                }
                const match = await bcrypt.compare(password, user.password)
                if (!match) {
                    throw new Error('Wrong credentials')
                }
                const token = jwt.sign({
                    _id: user._id,
                    email: user.email,
                    name: user.name,
                    photo: user.photo
                }, process.env.JWT_SECRET, { expiresIn: '10h' })
                return { ...user._doc, token }
            }
            catch (err) {
                throw new Error(err)
            }
        },
        registerUser: async (_, { userInput: { name, email, password } }) => {
            console.log("registerUser", name, email, password);

            const user = await User.findOne({ email })
            if (user) {
                throw new Error('Email already used')
            }

            const hashedPassword = await bcrypt.hash(password, 12)
            try {
                const verificationCode = Math.floor(Math.random() * 8999 + 1000)
                const user = new User({
                    name: name,
                    email: email,
                    password: hashedPassword,
                    photo: "https://res.cloudinary.com/rommel/image/upload/v1601204560/tk58aebfctjwz7t74qya.jpg",
                    verified: false,
                    verificationCode: verificationCode
                })
                const result = await user.save()


                if (result) {
                    mailer(result.email, result.name, result.verificationCode)
                }

                return { ...result._doc }
            }
            catch (err) {
                throw new Error(err)
            }
        },
        verifyUser: async (_, { email, code }) => {
            console.log("verifyUser", code);
            try {
                const user = await User.findOne({ email })
                console.log(user.verificationCode);
                if (!user) {
                    throw new Error('User not found')
                }
                if (parseInt(user.verificationCode) !== parseInt(code)) {
                    throw new Error('Wrong verification code')
                }
                user.verified = true
                const result = await user.save()
                const token = jwt.sign({
                    _id: result._id,
                    email: result.email,
                    name: result.name,
                    photo: result.photo
                }, process.env.JWT_SECRET, { expiresIn: '10h' })
                console.log(result);
                return { ...result._doc, token }
            }
            catch (err) {
                throw new Error(err)
            }
        },
        editProfile: async (_, { _id, name, photo }) => {
            console.log("editProfile");
            try {
                const user = await User.findById(_id)
                if (!user) {
                    throw new Error('Usernot found')
                }
                if (photo === "same") {
                    const editedProfile = await User.findByIdAndUpdate(user._id, { $set: { name } }, { new: true })
                    const token = jwt.sign({
                        _id: editedProfile._id,
                        email: editedProfile.email,
                        name: editedProfile.name,
                        photo: editedProfile.photo
                    }, process.env.JWT_SECRET, { expiresIn: '10h' })
                    return { ...editedProfile._doc, token }
                } else {
                    const editedProfile = await User.findByIdAndUpdate(user._id, { $set: { name, photo } }, { new: true })
                    const token = jwt.sign({
                        _id: editedProfile._id,
                        email: editedProfile.email,
                        name: editedProfile.name,
                        photo: editedProfile.photo
                    }, process.env.JWT_SECRET, { expiresIn: '10h' })
                    return { ...editedProfile._doc, token }
                }
            }
            catch (err) {
                throw new Error(err)
            }
        },
        signInWithGoogle: async (_, { name, email, photo, token }) => {
            console.log("signInWithGoogle", name, email, token, photo);
            try {
                const user = await User.findOne({ email })
                const hashedPassword = await bcrypt.hash(email, 12)
                if (!user) {
                    const newUser = await new User({
                        name: name,
                        email: email,
                        photo: photo,
                        password: hashedPassword,
                        verified: true
                    })
                    const result = await newUser.save()
                    const newToken = jwt.sign({
                        _id: result._id,
                        email: result.email,
                        name: result.name,
                        photo: result.photo
                    }, process.env.JWT_SECRET, { expiresIn: '10h' })
                    return { ...result._doc, token: newToken }
                } else {
                    const newToken = jwt.sign({
                        _id: user._id,
                        email: user.email,
                        name: user.name,
                        photo: user.photo
                    }, process.env.JWT_SECRET, { expiresIn: '10h' })
                    return { ...user._doc, token: newToken }
                }
            }
            catch (err) {
                throw new Error(err)
            }
        },
        tryDemo: async (_, __,) => {
            console.log("tryDemo");
            try {
                const users = await User.find()
                const guests = users.filter(user => user.name.split('_')[0] === "Guest")
                const name = `Guest_${guests.length + 1}`
                const email = `${name}@guest.com`
                const hashedPassword = await bcrypt.hash(email, 12)

                const newGuest = await new User({
                    name: name,
                    email: email,
                    photo: "https://res.cloudinary.com/rommel/image/upload/v1601204560/tk58aebfctjwz7t74qya.jpg",
                    password: hashedPassword,
                    verified: true
                })
                const result = await newGuest.save()
                const newToken = jwt.sign({
                    _id: result._id,
                    email: result.email,
                    name: result.name,
                    photo: result.photo
                }, process.env.JWT_SECRET, { expiresIn: '1h' })
                return { ...result._doc, token: newToken }
            }
            catch (err) {
                throw new Error(err)
            }
        },
        submitResultExam: async (_, { correctArray, wrongArray }, context) => {
            console.log("submitResultExam");
            try {
                const userCon = await checkAuth(context)
                const user = await User.findOne({ email: userCon.email })

                let correctCategories = [...user.correctExamCategory]
                let correctSubcategories = [...user.correctExamSubcategory]
                let wrongCategories = [...user.wrongExamCategory]
                let wrongSubcategories = [...user.wrongExamSubcategory]

                if (correctArray.length > 0) {
                    const correctQuestions = await Question.find({ _id: { $in: correctArray } })

                    correctQuestions.map(cq => {
                        if (correctCategories.length === 0) {
                            correctCategories.push(Object.assign({}, { category: cq.category, count: 1 }))
                        } else {
                            if (correctCategories.some(el => el.category.toString() === cq.category.toString())) {
                                correctCategories.map(w => {
                                    if (w.category.toString() === cq.category.toString()) {
                                        w.count = w.count + 1
                                    }
                                })
                            } else {
                                correctCategories = [...correctCategories, Object.assign({}, { category: cq.category, count: 1 })]
                            }
                        }
                    })

                    correctQuestions.map(cq => {
                        if (correctSubcategories.length === 0) {
                            correctSubcategories.push(Object.assign({}, { subcategory: cq.subcategory, count: 1 }))
                        } else {
                            if (correctSubcategories.some(el => el.subcategory.toString() === cq.subcategory.toString())) {
                                correctSubcategories.map(w => {
                                    if (w.subcategory.toString() === cq.subcategory.toString()) {
                                        w.count = w.count + 1
                                    }
                                })
                            } else {
                                correctSubcategories = [...correctSubcategories, Object.assign({}, { subcategory: cq.subcategory, count: 1 })]
                            }
                        }

                    })
                }

                if (wrongArray.length > 0) {
                    const wrongQuestions = await Question.find({ _id: { $in: wrongArray } })

                    wrongQuestions.map(cq => {
                        if (wrongCategories.length === 0) {
                            wrongCategories.push(Object.assign({}, { category: cq.category, count: 1 }))
                        } else {
                            if (wrongCategories.some(el => el.category.toString() === cq.category.toString())) {
                                wrongCategories.map(w => {
                                    if (w.category.toString() === cq.category.toString()) {
                                        w.count = w.count + 1
                                    }
                                })
                            } else {
                                wrongCategories = [...wrongCategories, Object.assign({}, { category: cq.category, count: 1 })]
                            }
                        }

                    })

                    wrongQuestions.map(cq => {
                        if (wrongSubcategories.length === 0) {
                            wrongSubcategories.push(Object.assign({}, { subcategory: cq.subcategory, count: 1 }))
                        } else {
                            if (wrongSubcategories.some(el => el.subcategory.toString() === cq.subcategory.toString())) {
                                wrongSubcategories.map(w => {
                                    if (w.subcategory.toString() === cq.subcategory.toString()) {
                                        w.count = w.count + 1
                                    }
                                })
                            } else {
                                wrongSubcategories = [...wrongSubcategories, Object.assign({}, { subcategory: cq.subcategory, count: 1 })]
                            }
                        }
                    })
                }

                console.log(correctCategories, wrongCategories, correctSubcategories, wrongSubcategories);

                if (user) {
                    user.correctExamArray.push(correctArray)
                    user.wrongExamArray.push(wrongArray)
                    user.correctExamCategory = correctCategories
                    user.wrongExamCategory = wrongCategories
                    user.correctExamSubcategory = correctSubcategories
                    user.wrongExamSubcategory = wrongSubcategories
                    const result = await user.save()
                    ranking(result, user._id, context)
                    return {
                        ...result._doc
                    }
                }


            }
            catch (err) {
                throw new Error(err)
            }
        },
        submitResultQuiz: async (_, { correctArray, wrongArray }, context) => {
            console.log("submitResultQuiz");

            try {
                const userCon = await checkAuth(context)
                const user = await User.findOne({ email: userCon.email })
                let correctCategories = [...user.correctQuizCategory]
                let correctSubcategories = [...user.correctQuizSubcategory]
                let wrongCategories = [...user.wrongQuizCategory]
                let wrongSubcategories = [...user.wrongQuizSubcategory]

                if (correctArray.length > 0) {
                    const correctQuestions = await Question.find({ _id: { $in: correctArray } })
                    correctQuestions.map(cq => {
                    console.log("CORRECT",correctQuestions);
                        if (correctCategories.length === 0) {
                            correctCategories.push(Object.assign({}, { category: cq.category, count: 1 }))
                        } else {

                            

                            if (correctCategories.some(el => el.category.toString() === cq.category.toString())) {
                                correctCategories.map(w => {
                                    if (w.category.toString() === cq.category.toString()) {
                                        w.count = w.count + 1
                                    }
                                })
                            } else {
                                correctCategories = [...correctCategories, Object.assign({}, { category: cq.category, count: 1 })]
                            }
                        }

                    })

                    correctQuestions.map(cq => {
                        if (correctSubcategories.length === 0) {
                            correctSubcategories.push(Object.assign({}, { subcategory: cq.subcategory, count: 1 }))
                        } else {
                            if (correctSubcategories.some(el => el.subcategory.toString() === cq.subcategory.toString())) {
                                correctSubcategories.map(w => {
                                    if (w.subcategory.toString() === cq.subcategory.toString()) {
                                        w.count = w.count + 1
                                    }
                                })
                            } else {
                                correctSubcategories = [...correctSubcategories, Object.assign({}, { subcategory: cq.subcategory, count: 1 })]
                            }
                        }

                    })
                }

                if (wrongArray.length > 0) {
                    const wrongQuestions = await Question.find({ _id: { $in: wrongArray } })
                    console.log("WRONG",wrongQuestions);
                    wrongQuestions.map(cq => {
                        if (wrongCategories.length === 0) {
                            wrongCategories.push(Object.assign({}, { category: cq.category, count: 1 }))
                        } else {
                            if (wrongCategories.some(el => el.category.toString() === cq.category.toString())) {
                                wrongCategories.map(w => {
                                    if (w.category.toString() === cq.category.toString()) {
                                        w.count = w.count + 1
                                    }
                                })
                            } else {
                                wrongCategories = [...wrongCategories, Object.assign({}, { category: cq.category, count: 1 })]
                            }
                        }

                    })

                    wrongQuestions.map(cq => {
                        if (wrongSubcategories.length === 0) {
                            wrongSubcategories.push(Object.assign({}, { subcategory: cq.subcategory, count: 1 }))
                        } else {
                            if (wrongSubcategories.some(el => el.subcategory.toString() === cq.subcategory.toString())) {
                                wrongSubcategories.map(w => {
                                    if (w.subcategory.toString() === cq.subcategory.toString()) {
                                        w.count = w.count + 1
                                    }
                                })
                            } else {
                                wrongSubcategories = [...wrongSubcategories, Object.assign({}, { subcategory: cq.subcategory, count: 1 })]
                            }
                        }

                    })
                }

                console.log("CC",correctCategories, "WC",wrongCategories, "CS",correctSubcategories, "WS",wrongSubcategories);

                if (user) {
                    user.correctQuizArray.push(correctArray)
                    user.wrongQuizArray.push(wrongArray)
                    user.correctQuizCategory = correctCategories
                    user.wrongQuizCategory = wrongCategories
                    user.correctQuizSubcategory = correctSubcategories
                    user.wrongQuizSubcategory = wrongSubcategories
                    const result = await user.save()
                    ranking(result, user._id, context)
                    return {
                        ...result._doc
                    }
                }


            }
            catch (err) {
                throw new Error(err)
            }
        },
        // submitResultQuiz: async (_, { correctArray, wrongArray }, context) => {
        //     console.log("submitResultQuiz", correctArray, wrongArray);

        //     try {
        //         const userCon = await checkAuth(context)
        //         const user = await User.findOne({ email: userCon.email })
        //         console.log(user);

        //         let correctCategories = [...user.correctQuizCategory]
        //         let correctSubcategories = [...user.correctQuizSubcategory]
        //         let wrongCategories = [...user.wrongQuizCategory]
        //         let wrongSubcategories = [...user.wrongQuizSubcategory]

        //         if (correctArray.length > 0) {
        //             const correctQuestions = await Question.find({ _id: { $in: correctArray } })
        //             console.log("CORRECT",correctQuestions);
        //             correctQuestions.map(cq => {
        //                 if (correctCategories.length === 0) {
        //                     correctCategories.push(Object.assign({}, { type: cq.category, count: 1 }))
        //                 } else {
        //                     if (correctCategories.every(v => v.type === cq.category)) {
        //                         correctCategories.map(w => {
        //                             if (w.type === cq.category) {
        //                                 w.count = w.count + 1
        //                             }
        //                         })
        //                     } else {
        //                         correctCategories.push([...correctCategories, Object.assign({}, { type: cq.category, count: 1 })])
        //                     }
        //                 }

        //             })

        //             correctQuestions.map(cq => {
        //                 if (correctSubcategories.length === 0) {
        //                     correctSubcategories.push(Object.assign({}, { type: cq.subcategory, count: 1 }))
        //                 } else {
        //                     if (correctSubcategories.every(v => v.type === cq.subcategory)) {
        //                         correctSubcategories.map(w => {
        //                             if (w.type === cq.subcategory) {
        //                                 w.count = w.count + 1
        //                             }
        //                         })
        //                     } else {
        //                         correctSubcategories.push([...correctSubcategories, Object.assign({}, { type: cq.subcategory, count: 1 })])
        //                     }
        //                 }

        //             })
        //         }

        //         if (wrongArray.length > 0) {
        //             const wrongQuestions = await Question.find({ _id: { $in: wrongArray } })
        //             console.log("WRONG",wrongQuestions);
        //             wrongQuestions.map(cq => {
        //                 if (wrongCategories.length === 0) {
        //                     wrongCategories.push(Object.assign({}, { type: cq.category, count: 1 }))
        //                 } else {
        //                     if (wrongCategories.every(v => v.type === cq.category)) {
        //                         wrongCategories.map(w => {
        //                             if (w.type === cq.category) {
        //                                 w.count = w.count + 1
        //                             }
        //                         })
        //                     } else {
        //                         wrongCategories.push([...wrongCategories, Object.assign({}, { type: cq.category, count: 1 })])
        //                     }
        //                 }

        //             })

        //             wrongQuestions.map(cq => {
        //                 if (wrongSubcategories.length === 0) {
        //                     wrongSubcategories.push(Object.assign({}, { type: cq.subcategory, count: 1 }))
        //                 } else {
        //                     if (wrongSubcategories.every(v => v.type === cq.subcategory)) {
        //                         wrongSubcategories.map(w => {
        //                             if (w.type === cq.subcategory) {
        //                                 w.count = w.count + 1
        //                             }
        //                         })
        //                     } else {
        //                         wrongSubcategories.push([...wrongSubcategories, Object.assign({}, { type: cq.subcategory, count: 1 })])
        //                     }
        //                 }

        //             })
        //         }

        //         console.log(correctCategories, wrongCategories, correctSubcategories, wrongSubcategories);

        //         if (user) {
        //             user.correctQuizArray.push(correctArray)
        //             user.wrongQuizArray.push(wrongArray)
        //             user.correctQuizCategory = correctCategories
        //             user.wrongQuizCategory = wrongCategories
        //             user.correctQuizSubcategory = correctSubcategories
        //             user.wrongQuizSubcategory = wrongSubcategories
        //             const result = await user.save()
        //             ranking(result, user._id, context)
        //             return {
        //                 ...result._doc
        //             }
        //         }


        //     }
        //     catch (err) {
        //         throw new Error(err)
        //     }
        // },

    }

}