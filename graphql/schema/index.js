import gql from 'graphql-tag'

const typeDefs = gql`

    input AdminInput {
        name: String!
        email: String!
        password: String!
    }

    input UserInput {
        name: String!
        email: String!
        password: String!
    }

    input QuestionInput {
        question: String!
        category: ID!
        subcategory: ID!
        option1: String!
        option2: String!
        option3: String!
        option4: String!
        answer: String!
        image: String
    }

    type Admin {
        _id: ID!
        name: String!
        email: String!
        password: String!
        token: String!
        createdAt: String!
        updatedAt: String!
    }

    type ResultCategory {
        category: String!
        count: Int!
    }

    type ResultSubcategory {
        subcategory: String!
        count: Int!
    }

    type User {
        _id: ID!
        name: String!
        email: String!
        password: String!
        photo: String
        token: String!
        verified: Boolean!
        correctExamArray: [[String]!]!
        wrongExamArray: [[String]!]!
        correctExamCategory: [ResultCategory!]!
        correctExamSubcategory: [ResultSubcategory!]!
        wrongExamCategory: [ResultCategory!]!
        wrongExamSubcategory: [ResultSubcategory!]!
        correctQuizArray: [[String]!]!
        wrongQuizArray: [[String]!]!
        correctQuizCategory: [ResultCategory!]!
        correctQuizSubcategory: [ResultSubcategory!]!
        wrongQuizCategory: [ResultCategory!]!
        wrongQuizSubcategory: [ResultSubcategory!]!
        createdAt: String!
        updatedAt: String!
    }

    type Question {
        _id: ID!
        question: String!
        category: Category!
        subcategory: Subcategory!
        option1: String!
        option2: String!
        option3: String!
        option4: String!
        answer: String!
        image: String
        contributor: String
        createdAt: String!
        updatedAt: String!
    }

    type Count {
        category: String!
        count: Int!
    }

    type Category {
        _id: ID!
        category: String!
        subcategory: [Subcategory!]!
        createdAt: String!
        updatedAt: String!
    }

    type Subcategory {
        _id: ID!
        subcategory: String!
        category: Category!
        createdAt: String!
        updatedAt: String!
    }

    type Leaderboard {
        _id: ID
        ranker: User!
        category: String!
        rating: Float!
        totalQuestions: Int!
        status: String!
        createdAt: String!
        updatedAt: String!
    }

    type Chat {
        _id: ID
        senderId: String!
        senderName: String!
        senderPhoto: String!
        message: String!
        createdAt: String!
        updatedAt: String!
    }

    

    type Query {
        userInfo: User!
        correctExamInfo(email: String!): [Subcategory!]!
        wrongExamInfo(email: String!): [Subcategory!]!


        questionsByCategory(category: String!): [Question!]!
        questionsBySubcategory(subcategory: String!): [Question!]!
        randomQuestionsByCategory(category: String!, size: Int!): [Question!]!
        randomQuestionsByCategoryAndSubcategory(category: String!, subcategory: String! size: Int!): [Question!]!
        searchQuestion(inputValue: String!): [Question!]!
        questionCounts: [Count]!
    
        categories: [Category!]!
        subcategories: [Subcategory!]!
        category(_id: ID!): Category!

        leaderboards: [Leaderboard!]!

        chats: [Chat!]!
    }

    type Mutation {
        adminLogin(email: String!, password: String!): Admin!
        adminRegister(adminInput: AdminInput!): Admin!
        

        login(email: String!, password: String!): User!
        registerUser(userInput: UserInput!): User!
        verifyUser(email: String!, code: String!): User!
        signInWithGoogle(name: String!, email: String!, photo: String!, token: String!): User!
        tryDemo: User!
        editProfile(_id: String!, name: String!, photo:String!) : User!
        submitResultExam(correctArray: [String]!, wrongArray: [String]!): User!
        submitResultQuiz(correctArray: [String]!, wrongArray: [String]!): User!

        createQuestion(questionInput: QuestionInput!): Question!
        editQuestion(_id: ID!, questionInput: QuestionInput!): Question!
        deleteQuestion(_id: ID!): Question!

        createCategory(category: String!) : Category!
        editCategory(_id: ID!, category: String!): Category!
        deleteCategory(_id: ID!, category: String!): Category!

        createSubcategory(subcategory: String!, categoryId: ID!): Subcategory!
        editSubcategory(subcategoryId: ID!, subcategory: String!, categoryId: ID!): Subcategory!
        deleteSubcategory(subcategoryId: ID!, categoryId: ID!): Subcategory!

        newRanker(userId: String!, category: String!, rating: Float!, totalQuestions: Int!): Leaderboard!

        newChat(message: String!, createdAt: String!): Chat!
    }

    type Subscription {
        newRanker: Leaderboard!
        newChat: Chat!
    }
`;

export default typeDefs;