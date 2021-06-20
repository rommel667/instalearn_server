import Subcategory from '../../models/subcategory.js'
import Category from '../../models/category.js'
import Question from '../../models/question.js'
import Leaderboard from '../../models/leaderboard.js'
import User from '../../models/user.js'
import Lowestrating from '../../models/lowestrating.js'
import leaderboardResolvers, { filteredLeaderboards, leaderboards } from './leaderboardAndChatResolver.js'
import { categories } from './categoryResolver.js'



export const subcategoriesMerge = async (subcategoryIds) => {
    console.log("subcategoriesMerge");
    try {
        const subcategories = await Subcategory.find({ _id: { $in: subcategoryIds } })
        if (!subcategories) {
            throw new Error("No categories found")
        }
        return subcategories.map(subcategory => {
            return { ...subcategory._doc }
        })
    }
    catch (err) {
        throw new Error(err)
    }
}

export const categoryMerge = async (categoryId) => {
    console.log("categoryMerge");
    try {
        const category = await Category.findById(categoryId)
        if (!category) {
            throw new Error("No categories found")
        }
        return { ...category._doc }
    }
    catch (err) {
        throw new Error(err)
    }
}

export const subcategoryMerge = async (subcategoryId) => {
    console.log("subcategoryMerge");
    try {
        const subcategory = await Subcategory.findById(subcategoryId)
        if (!subcategory) {
            throw new Error("No categories found")
        }
        return { ...subcategory._doc }
    }
    catch (err) {
        throw new Error(err)
    }
}

export const rankerMerge = async (rankerId) => {
    console.log("rankerMerge");
    try {
        const ranker = await User.findById(rankerId)
        if (!ranker) {
            throw new Error("Ranker not found")
        }
        return { _id: ranker._doc._id, name: ranker._doc.name, photo: ranker._doc.photo, updatedAt: ranker._doc.updatedAt }
    }
    catch (err) {
        throw new Error(err)
    }
}

export const questionMerge = async (questionIds) => {
    console.log("questionMerge", questionIds);
    try {
        return questionIds.map(async array => {
            const questions = await Question.find({ _id: { $in: array } })

            return questions.map(question => {
                return { ...question._doc, subcategory: subcategoryMerge.bind(this, question.subcategory) }
            })
        })
    }
    catch (err) {
        throw new Error(err)
    }
}


export const arrayEqual = arr => arr.every(v => v.toString() === (arr[0]).toString())




const rankingQualifier = async (data, userId, context) => {
    const lowestRatings = await Lowestrating.find()
    const leaderboardsData = await Leaderboard.find().sort({rating: -1})
    data.map(async item => {
        console.log("ITEM", item.category);
        const calcRating = ((item.correctCount / (item.correctCount + item.wrongCount)) * 100).toFixed(2)
        const rating = parseFloat(calcRating)
        if (isNaN(rating)) {
            console.log("QUALIFIER CASE 1");
            return
        }
        if (lowestRatings.length === 0 || lowestRatings.some(lowest => lowest.category === item.category) === false) {
            console.log("QUALIFIER CASE 2");
            leaderboardResolvers.Mutation.newRanker(item.category, { userId, category: item.category, rating: rating, totalQuestions: (item.correctCount + item.wrongCount), status: "NEW RANKER" }, context)
            const newLowest = new Lowestrating({
                ranker: userId,
                category: item.category,
                rating: rating
            })
            await newLowest.save()
            return
        }

        if (lowestRatings.some(lowest => lowest.category === item.category)) {
            console.log("QUALIFIER CASE 3");
            const rankers = leaderboardsData.filter(lb => lb.category === item.category).sort()
            console.log(rankers);
            const userOnRankers = rankers.find(ranker => ranker.ranker._id.toString() === userId.toString())
            console.log(userOnRankers);
            lowestRatings.map(async lowestRating => {
                if (lowestRating.category === item.category) {
                    console.log("QUALIFIER CASE 3 1");
                    if (rankers.length <= 2) {
                        console.log("QUALIFIER CASE 3 1 1");
                        if (userOnRankers) {
                            console.log("QUALIFIER CASE 3 1 1 1");
                            console.log(typeof(rating), typeof(userOnRankers.rating));
                            if (rating === userOnRankers.rating) {
                                console.log("QUALIFIER CASE 3 1 1 1 1");
                                return
                            }
                            if (rating > userOnRankers.rating) {
                                console.log("QUALIFIER CASE 3 1 1 1 2");
                                const userRankerNewRecord = await Leaderboard.findByIdAndUpdate(userOnRankers._id, { $set: { rating: rating, totalQuestions: (item.correctCount + item.wrongCount), status: "RANK UP" } }, { new: true })
                                filteredLeaderboards(userRankerNewRecord, context)
                                if (rankers.length > 1) {
                                    console.log("QUALIFIER CASE 3 1 1 1 2 1");
                                    if (userId === lowestRating.ranker) {
                                        console.log("QUALIFIER CASE 3 1 1 1 2 1 1");
                                        await Lowestrating.findByIdAndDelete(lowestRating._id)
                                        if (rating > rankers[1].rating) {
                                            console.log("QUALIFIER CASE 3 1 1 1 2 1 1 1");
                                            const newLowest = new Lowestrating({
                                                ranker: rankers[1].ranker,
                                                category: item.category,
                                                rating: rankers[1].rating
                                            })
                                            await newLowest.save()
                                            return
                                        } else {
                                            console.log("QUALIFIER CASE 3 1 1 1 2 1 1 2");
                                            const newLowest = new Lowestrating({
                                                ranker: userId,
                                                category: item.category,
                                                rating: rating
                                            })
                                            await newLowest.save()
                                            return
                                        }
                                    } else {
                                        console.log("QUALIFIER CASE 3 1 1 1 2 1 2");
                                        return
                                    }

                                } else {
                                    console.log("QUALIFIER CASE 3 1 1 1 2 2");
                                    await Lowestrating.findByIdAndDelete(lowestRating._id)
                                    const newLowest = new Lowestrating({
                                        ranker: userId,
                                        category: item.category,
                                        rating: rating
                                    })
                                    await newLowest.save()
                                    return
                                }
                            } else {
                                console.log("QUALIFIER CASE 3 1 1 1 3");
                                const userRankerNewRecord = await Leaderboard.findByIdAndUpdate(userOnRankers._id, { $set: { rating: rating, totalQuestions: (item.correctCount + item.wrongCount), status: "RANK DOWN" } }, { new: true })
                                filteredLeaderboards(userRankerNewRecord, context)
                                if (rankers.length > 1) {
                                    console.log("QUALIFIER CASE 3 1 1 1 3 1");
                                    if (userId === lowestRating.ranker) {
                                        console.log("QUALIFIER CASE 3 1 1 1 3 1 1");
                                        await Lowestrating.findByIdAndDelete(lowestRating._id)
                                        if (rating > rankers[1].rating) {
                                            console.log("QUALIFIER CASE 3 1 1 1 3 1 1 1");
                                            const newLowest = new Lowestrating({
                                                ranker: rankers[1].ranker,
                                                category: item.category,
                                                rating: rankers[1].rating
                                            })
                                            await newLowest.save()
                                            return
                                        } else {
                                            console.log("QUALIFIER CASE 3 1 1 1 3 1 1 2");
                                            const newLowest = new Lowestrating({
                                                ranker: userId,
                                                category: item.category,
                                                rating: rating
                                            })
                                            await newLowest.save()
                                            return
                                        }
                                    } else {
                                        console.log("QUALIFIER CASE 3 1 1 1 3 1 2");
                                        return
                                    }

                                } else {
                                    console.log("QUALIFIER CASE 3 1 1 1 3 2");
                                    await Lowestrating.findByIdAndDelete(lowestRating._id)
                                    const newLowest = new Lowestrating({
                                        ranker: userId,
                                        category: item.category,
                                        rating: rating
                                    })
                                    await newLowest.save()
                                    return
                                }
                            }
                        } else {
                            console.log("QUALIFIER CASE 3 1 1 2");
                            leaderboardResolvers.Mutation.newRanker(item.category, { userId, category: item.category, rating: rating, totalQuestions: (item.correctCount + item.wrongCount), status: "NEW RANKER" }, context)
                            if (rating > lowestRating.rating) {
                                console.log("QUALIFIER CASE 3 1 1 2 1");
                                return
                            } else {
                                console.log("QUALIFIER CASE 3 1 1 2 2");
                                await Lowestrating.findByIdAndDelete(lowestRating._id)
                                const newLowest = new Lowestrating({
                                    ranker: userId,
                                    category: item.category,
                                    rating: rating
                                })
                                await newLowest.save()
                                return
                            }
                        }
                    } else {
                        console.log("QUALIFIER CASE 3 1 2");
                        if (userOnRankers) {
                            console.log("QUALIFIER CASE 3 1 2 1");
                            if (rating === userOnRankers.rating) {
                                console.log("QUALIFIER CASE 3 1 2 1 1");
                                return
                            }
                            if (rating > userOnRankers.rating) {
                                console.log("QUALIFIER CASE 3 1 2 1 2");
                                const userRankerNewRecord = await Leaderboard.findByIdAndUpdate(userOnRankers._id, { $set: { rating: rating, totalQuestions: (item.correctCount + item.wrongCount), status: "RANK UP" } }, { new: true })
                                filteredLeaderboards(userRankerNewRecord, context)
                                if (userId === lowestRating.ranker) {
                                    console.log("QUALIFIER CASE 3 1 2 1 2 1");
                                    await Lowestrating.findByIdAndDelete(lowestRating._id)
                                    if (rating > rankers[1].rating) {
                                        console.log("QUALIFIER CASE 3 1 2 1 2 1 1");
                                        const newLowest = new Lowestrating({
                                            ranker: rankers[1].ranker,
                                            category: item.category,
                                            rating: rankers[1].rating
                                        })
                                        await newLowest.save()
                                        return
                                    } else {
                                        console.log("QUALIFIER CASE 3 1 2 1 2 1 2");
                                        const newLowest = new Lowestrating({
                                            ranker: userId,
                                            category: item.category,
                                            rating: rating
                                        })
                                        await newLowest.save()
                                        return
                                    }
                                } else {
                                    console.log("QUALIFIER CASE 3 1 2 1 2 2");
                                    if (rating > lowestRating.rating) {
                                        console.log("QUALIFIER CASE 3 1 2 1 2 2 1");
                                        return
                                    } else {
                                        console.log("QUALIFIER CASE 3 1 2 1 2 2 2");
                                        await Lowestrating.findByIdAndDelete(lowestRating._id)
                                        const newLowest = new Lowestrating({
                                            ranker: userId,
                                            category: item.category,
                                            rating: rating
                                        })
                                        await newLowest.save()
                                        return
                                    }
                                }
                            } else {
                                console.log("QUALIFIER CASE 3 1 2 1 3");
                                const userRankerNewRecord = await Leaderboard.findByIdAndUpdate(userOnRankers._id, { $set: { rating: rating, totalQuestions: (item.correctCount + item.wrongCount), status: "RANK DOWN" } }, { new: true })
                                filteredLeaderboards(userRankerNewRecord, context)
                                if (userId === lowestRating.ranker) {
                                    console.log("QUALIFIER CASE 3 1 2 1 3 1");
                                    await Lowestrating.findByIdAndDelete(lowestRating._id)
                                    if (rating > rankers[1].rating) {
                                        console.log("QUALIFIER CASE 3 1 2 1 3 1 1");
                                        const newLowest = new Lowestrating({
                                            ranker: rankers[1].ranker,
                                            category: item.category,
                                            rating: rankers[1].rating
                                        })
                                        await newLowest.save()
                                        return
                                    } else {
                                        console.log("QUALIFIER CASE 3 1 2 1 3 1 2");
                                        const newLowest = new Lowestrating({
                                            ranker: userId,
                                            category: item.category,
                                            rating: rating
                                        })
                                        await newLowest.save()
                                        return
                                    }
                                } else {
                                    console.log("QUALIFIER CASE 3 1 2 1 3 2");
                                    if (rating > lowestRating.rating) {
                                        console.log("QUALIFIER CASE 3 1 2 1 3 2 1");
                                        return
                                    } else {
                                        console.log("QUALIFIER CASE 3 1 2 1 3 2 2");
                                        await Lowestrating.findByIdAndDelete(lowestRating._id)
                                        const newLowest = new Lowestrating({
                                            ranker: userId,
                                            category: item.category,
                                            rating: rating
                                        })
                                        await newLowest.save()
                                        return
                                    }
                                }
                            }
                        } else {
                            console.log("QUALIFIER CASE 3 1 2 2");
                            if (rating > lowestRating.rating) {
                                console.log("QUALIFIER CASE 3 1 2 2 1");
                                leaderboardResolvers.Mutation.newRanker(item.category, { userId, category: item.category, rating: rating, totalQuestions: (item.correctCount + item.wrongCount), status: "NEW RANKER" }, context)
                                await Lowestrating.findByIdAndDelete(lowestRating._id)
                                await Leaderboard.findOneAndDelete({ ranker: lowestRating.ranker, category: lowestRating.category })
                                if (rating > rankers[1].rating) {
                                    console.log("QUALIFIER CASE 3 1 2 2 1 1");
                                    const newLowest = new Lowestrating({
                                        ranker: rankers[1].ranker,
                                        category: item.category,
                                        rating: rankers[1].rating
                                    })
                                    await newLowest.save()
                                    return
                                } else {
                                    console.log("QUALIFIER CASE 3 1 2 2 1 2");
                                    const newLowest = new Lowestrating({
                                        ranker: userId,
                                        category: item.category,
                                        rating: rating
                                    })
                                    await newLowest.save()
                                    return
                                }
                            } else {
                                console.log("QUALIFIER CASE 3 1 2 2 2");
                                return
                            }
                        }
                    }
                }
            })

        }

    })
}


export const ranking = async (result, userId, context) => {

    const categoriesArray = ['OVERALL', ...categories]

    const data = []

    categoriesArray.map(item => {
        if(item === "OVERALL") {
            data.push(Object.assign({}, { categoryId: '12345' }, { category: item }, { wrongCount: 0 }, { correctCount: 0 }))
        } else {
            data.push(Object.assign({}, { categoryId: item._id }, { category: item.category }, { wrongCount: 0 }, { correctCount: 0 }))
        }
        
    })

    

    result.correctExamCategory.map(el => {
        data.map(item => {
            if(item.category === 'OVERALL') item.correctCount = item.correctCount + el.count
            if(item.categoryId.toString() === el.category.toString()) {
                item.correctCount = item.correctCount + el.count
            }
        })
    })

    result.correctQuizCategory.map(el => {
        data.map(item => {
            if(item.category === 'OVERALL') item.correctCount = item.correctCount + el.count
            if(item.categoryId.toString() === el.category.toString()) {
                item.correctCount = item.correctCount + el.count
            }
        })
    })

    result.wrongExamCategory.map(el => {
        data.map(item => {
            if(item.category === 'OVERALL') item.wrongCount = item.wrongCount + el.count
            if(item.categoryId.toString() === el.category.toString()) {
                item.wrongCount = item.wrongCount + el.count
            }
        })
    })

    result.wrongQuizCategory.map(el => {
        data.map(item => {
            if(item.category === 'OVERALL') item.wrongCount = item.wrongCount + el.count
            if(item.categoryId.toString() === el.category.toString()) {
                item.wrongCount = item.wrongCount + el.count
            }
        })
    })


    rankingQualifier(data, userId, context)


}



