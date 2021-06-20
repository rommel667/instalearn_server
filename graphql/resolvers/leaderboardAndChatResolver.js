import Leaderboard from '../../models/leaderboard.js'
import { rankerMerge } from './merge.js'
import checkAuth from '../../utils/checkAuth.js'
import { v4 as uuid_v4 } from "uuid";

export let leaderboards = []
const chats = []

const NEW_RANKER = 'NEW_RANKER'
const NEW_CHAT = 'NEW_CHAT'


const leaderboardsDB =  async () => {
    console.log("leaderboardsDB");
    try {
        const rankers = await Leaderboard.find().sort({rating: -1})
        if(!rankers) {
            throw new Error("No rankers found")
        }
        leaderboards = await Promise.all(rankers.map( async ranker => {
            return ({ ...ranker._doc, updatedAt: new Date(ranker._doc.updatedAt).toISOString(), ranker: await rankerMerge(ranker.ranker) })
        })  )
    }
    catch (err) {
        throw new Error(err)
    }
}

export const filteredLeaderboards = async (userRankerNewRecord, { pubsub }) => {
    chats.push({ ...userRankerNewRecord._doc, updatedAt: new Date(userRankerNewRecord.updatedAt).toISOString(), ranker: await rankerMerge(userRankerNewRecord.ranker) })
    leaderboardsDB()
    pubsub.publish(NEW_RANKER, {
        newRanker: {
            ...userRankerNewRecord._doc, updatedAt: new Date(userRankerNewRecord.updatedAt).toISOString(), ranker: await rankerMerge(userRankerNewRecord.ranker)
        }
    })
}


export default {
    Query: {
        leaderboards:  async (_, args) => {
            console.log("leaderboards");
                if(!leaderboards) {
                    throw new Error("No rankers found")
                }
                if(leaderboards.length === 0) {
                    await leaderboardsDB()
                    console.log("CASE1");
                    
                    return leaderboards.map(ranker => {
                    return { ...ranker }
                })
                } else {
                    console.log("CASE2");
                    return leaderboards.map(ranker => {
                    return { ...ranker }
                }) 
                }
        },
        chats: async () => {
            console.log("chats");
            return chats.map(chat => {
                return { ...chat  }
            })
        }
     
    },
    Mutation: {
        newRanker: async (_, {userId, category, rating, totalQuestions, status}, { pubsub }) => {
            console.log("newRanker");
            try {
                const newRanker = new Leaderboard({
                    ranker: userId,
                    category: category,
                    rating: rating,
                    totalQuestions: totalQuestions,
                    status: status,
                    updatedAt: new Date(Date.now()).toISOString()
                })
                await newRanker.save()
                chats.push({ ...newRanker._doc, updatedAt: new Date(newRanker._doc.updatedAt).toISOString(), ranker: await rankerMerge(newRanker.ranker) })
                leaderboardsDB()
                pubsub.publish(NEW_RANKER, {
                    newRanker: {
                        ...newRanker._doc, updatedAt: new Date(newRanker._doc.updatedAt).toISOString(), ranker: await rankerMerge(newRanker.ranker)
                    }
                })
                return { ...newRanker._doc }
            } catch (err) {
                console.log(err);
            }
        },
        newChat:  async (_, { message, createdAt }, context) => {
            console.log("newChat");
            const user = await checkAuth(context)
            try {
                if(chats.length >= 10) {
                    chats.shift()
                }
                const newChatEntry = { _id: uuid_v4(), sender: user, senderId: user._id, senderName: user.name, senderPhoto: user.photo, message: message, createdAt: createdAt }
                console.log(newChatEntry);
                context.pubsub.publish(NEW_CHAT, {
                    newChat: newChatEntry
                })
                chats.push(newChatEntry)
                
                return newChatEntry
            }
            catch (err) {
                throw new Error(err)
            }
        },
    },
    Subscription: {
        newRanker: {
            subscribe: (_, __, { pubsub }) => pubsub.asyncIterator(NEW_RANKER)
        },
        newChat: {
            subscribe: (_, __, { pubsub }) => pubsub.asyncIterator(NEW_CHAT)
        }
    }
}
