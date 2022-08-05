var db=require("../config/connection")
var collection=require('../config/collections')
var objectId=require('mongodb').ObjectId
const bcrypt =require('bcrypt')
module.exports={
    addProduct:(product,callback)=>{
        //console.log(product);
        db.get().collection('product').insertOne(product).then((data)=>{
            console.log(data.insertedId)
            callback(data.insertedId)
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(proId)}).then((response)=>{

                console.log(response)
                resolve(response)
            })
        })
    },
    getProductsDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                resolve(product)
                
            })
        })
    },
    editProduct:(proId,product)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},
            {
                $set:{
                    Name:product.Name,
                    category:product.category,
                    description:product.description
                
                }}).then((data)=>{
                resolve(data)
            })
        })
    },
    doLogin:(adminData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let admin=await db.get().collection(collection.ADMIN_COLLECTION).findOne({Email:adminData.Email})
            console.log(admin)
            if(admin){
                bcrypt.compare(adminData.Password,admin.Password).then((status)=>{
                    if(status){
                        console.log('success')

                        response.admin=admin
                        response.status=true
                        resolve(response)
                    }
                    else{
                        console.log('faild')
                        resolve({status:false})
                    }
                })

            }else{
                console.log('faild')
                resolve({status:false})
            }
        })
    },
    getAllOrders:()=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).aggregate([
                // {
                //     $lookup:{
                //         from:collection.USER_COLLECTION,
                //         localField:'userID',
                //         foreignField:'_id',
                //         as:'user'
                //     }
                // },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                        userId:'$uderID'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        _id:0,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
            ]).toArray().then((response)=>{
                console.log(response.product)
                resolve()
            })
        })
    }
    

}