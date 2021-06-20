import Category from '../../models/category.js'
import subcategoryResolvers from './subcategoryResolver.js'
import { subcategoriesMerge } from './merge.js'

export let categories = []

const categoriesDB = async () => {
    console.log("categoriesDB");
    try {
        const cats = await Category.find()
        if(!cats) {
            throw new Error("No categories found")
        }
        categories =  await Promise.all(cats.map(async category => {
            return { ...category._doc, subcategory: await subcategoriesMerge(category.subcategory) }
        })  )
    }
    catch (err) {
        throw new Error(err)
    }
}

export default {
    Query: {
        categories:  async () => {
            console.log("categories");
            try {
                if(!categories) {
                    throw new Error("No categories found")
                }
                if(categories.length === 0) {
                    await categoriesDB()
                    console.log("CASE1");
                    
                    return categories.map(category => {
                    return { ...category }
                })
                } else {
                    console.log("CASE2");
                    return categories.map(category => {
                    return { ...category }
                }) 
                }
            }
            catch (err) {
                throw new Error(err)
            }
        },
        category:  async (_, { _id }) => {
            console.log("category");
            try {
                const category = await Category.findById(_id)
                if(!category) {
                    throw new Error("No category found")
                }
                return { ...category._doc, subcategory: subcategoryResolvers.Query.subcategories }
            }
            catch (err) {
                throw new Error(err)
            }
        },  
    },
    Mutation: {
        createCategory: async (_, { category }, context ) => {
            console.log("createCategory");
            // const user = checkAuth(context)
            const categoryDB = await Category.findOne({ category })
            if(categoryDB) {
                throw new Error('Same category already exists')    
            }
            try {
                const newCategory = new Category({
                    category
                })
                const result = await newCategory.save()
                return { ...result._doc }
            }
            catch (err) {
                throw new Error(err)
            }
        },
        editCategory: async (_, { _id, category } ) => {
            console.log("editCategory");
            try {
                const result = await Category.findByIdAndUpdate(_id, { $set: {  category } }, { new: true })
                if(!result) {
                    throw new Error('category not found')    
                }
                return { ...result._doc }
            }
            catch (err) {
                throw new Error(err)
            }
        },
        deleteCategory: async (_, { _id } ) => {
            console.log("deleteCategory");
            try {
                const result = await Category.findByIdAndDelete(_id)
                if(!result) {
                    throw new Error('Category not found')    
                }
                return { ...result._doc }
            }
            catch (err) {
                throw new Error(err)
            }
        }
    }
}