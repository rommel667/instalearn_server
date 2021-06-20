import Subcategory from '../../models/subcategory.js'
import Category from '../../models/category.js'
import { categoryMerge } from './merge.js'

let subcategories = []

const subcategoriesDB = async () => {
    console.log("subcategoriesDB");
    try {
        const subcats = await Subcategory.find()
        if(!subcats) {
            throw new Error("No subcategories found")
        }
        subcategories =  await Promise.all(subcats.map(async subcategory => {
            return { ...subcategory._doc, category: categoryMerge(subcategory.category) }
        })  )
    }
    catch (err) {
        throw new Error(err)
    }
}

export default {
    Query: {
        subcategories:  async () => {
            console.log("subcategories");
            try {
                if(!subcategories) {
                    throw new Error("No subcategories found")
                }
                if(subcategories.length === 0) {
                    await subcategoriesDB()
                    console.log("CASE1");
                    
                    return subcategories.map(subcategory => {
                    return { ...subcategory }
                })
                } else {
                    console.log("CASE2");
                    return subcategories.map(subcategory => {
                    return { ...subcategory }
                }) 
                }
            }
            catch (err) {
                throw new Error(err)
            }
        },
    },
    Mutation: {
        createSubcategory: async (_, { subcategory, categoryId }, context ) => {
            console.log("createSubcategory");
            // const user = checkAuth(context)
            try {
                const subcategoryDB = await Subcategory.findOne({ subcategory })
                if(subcategoryDB) {
                    throw new Error('Same subcategory already exists')    
                }
                const newSubcategory = new Subcategory({
                    subcategory, category: categoryId
                })
                const result = await newSubcategory.save()
                const category = await Category.findById(categoryId)
                if(!category) {
                    throw new Error('Category not found')    
                }
                category.subcategory.push(result._doc._id)
                await category.save()
                return { ...result._doc }
            }
            catch (err) {
                throw new Error(err)
            }
        },
        editSubcategory: async (_, { subcategoryId, subcategory, categoryId } ) => {
            console.log("editSubcategory", subcategoryId, subcategory, categoryId);
            try {
                    const subcategoryDB = await Subcategory.findOne({ subcategory })
                    if(subcategoryDB) {
                        throw new Error('Same subcategory already exists')    
                    }
                    const result = await Subcategory.findByIdAndUpdate(subcategoryId, { $set: {  subcategory, categoryId } }, { new: true })
                    return { ...result._doc }
                
            }
            catch (err) {
                throw new Error(err)
            }
        },
        deleteSubcategory: async (_, { subcategoryId, categoryId } ) => {
            console.log("deleteSubcategory");
            try {
                const result = await Subcategory.findByIdAndDelete(subcategoryId)
                if(!result) {
                    throw new Error('Subcategory not found')    
                }
                const category = await Category.findById(categoryId)
                if(!category) {
                    throw new Error('Category not found')
                }
                category.subcategory.pull(subcategoryId)
                await category.save()
                return { ...result._doc }
            }
            catch (err) {
                throw new Error(err)
            }
        }
    }
}