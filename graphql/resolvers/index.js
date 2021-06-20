import userResolvers from './userResolver.js'
import questionResolvers from './questionResolver.js'
import categoryResolvers from './categoryResolver.js'
import subcategoryResolvers from './subcategoryResolver.js'
import adminResolvers from './adminResolver.js'
import leaderboardAndChatResolvers from './leaderboardAndChatResolver.js'


const resolvers = {
    Query: {
        ...userResolvers.Query,
        ...questionResolvers.Query,
        ...categoryResolvers.Query,
        ...subcategoryResolvers.Query,
        ...adminResolvers.Query,
        ...leaderboardAndChatResolvers.Query,
    },
    Mutation: {
        ...userResolvers.Mutation,
        ...questionResolvers.Mutation,
        ...categoryResolvers.Mutation,
        ...subcategoryResolvers.Mutation,
        ...adminResolvers.Mutation,
        ...leaderboardAndChatResolvers.Mutation,
    },
    Subscription: {
        ...leaderboardAndChatResolvers.Subscription
    }
}

export default resolvers